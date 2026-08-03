import { Hono } from 'hono';
import { getDb } from '../db';
import { authMiddleware, adminMiddleware } from '../auth';
import { sendOrderConfirmation, sendOrderStatusUpdateEmail, sendInternalOrderNotification } from '../mail';
import { SHIPPING_OVERRIDES } from '../config/shippingOverrides';

const PAYMENT_METHODS = ['mercadopago', 'transferencia', 'efectivo'] as const;

const orders = new Hono();

interface OrderRow {
  id: string; customer_name: string; customer_email: string; date: string;
  subtotal: number; shipping_cost: number; total: number;
  order_status: string; payment_method: string; payment_status: string;
  items_json: string; shipping_address_json: string; source: string;
}

function formatOrder(row: OrderRow) {
  return {
    id: row.id, customerName: row.customer_name, customerEmail: row.customer_email,
    date: row.date, subtotal: row.subtotal, shippingCost: row.shipping_cost,
    total: row.total, orderStatus: row.order_status,
    paymentMethod: row.payment_method, paymentStatus: row.payment_status,
    items: JSON.parse(row.items_json || '[]'),
    shippingAddress: JSON.parse(row.shipping_address_json || '{}'),
    source: row.source,
  };
}

export function restoreStockForItems(db: ReturnType<typeof getDb>, items: { productId: string; variant?: string; quantity: number }[]) {
  const escJsonKey = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  for (const item of items || []) {
    const qty = item.quantity || 1;
    if (item.variant) {
      const path = `$."${escJsonKey(String(item.variant))}"`;
      db.query(
        `UPDATE products SET variant_stock_json = json_set(variant_stock_json, ?, COALESCE(json_extract(variant_stock_json, ?), 0) + ?) WHERE id = ?`
      ).run(path, path, qty, item.productId);
    } else {
      db.query('UPDATE products SET stock = stock + ? WHERE id = ?').run(qty, item.productId);
    }
  }
}

export function parseOrderItems(itemsJson: string): { productId: string; variant?: string; quantity: number }[] {
  try {
    return JSON.parse(itemsJson || '[]') as { productId: string; variant?: string; quantity: number }[];
  } catch {
    return [];
  }
}

orders.get('/', authMiddleware, (c) => {
  const db = getDb();
  const user = c.get('user');
  let rows: OrderRow[];
  if (user.isAdmin) {
    rows = db.query('SELECT * FROM orders ORDER BY date DESC').all() as OrderRow[];
  } else {
    rows = db.query('SELECT * FROM orders WHERE customer_email = ? ORDER BY date DESC').all(user.email) as OrderRow[];
  }
  return c.json(rows.map(formatOrder));
});

class InsufficientStockError extends Error {
  constructor(productName: string) {
    super(`Stock insuficiente para ${productName}`);
  }
}

const escJsonKey = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

orders.post('/', async (c) => {
  const body = await c.req.json();
  const paymentMethod = body.paymentMethod;
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    c.status(400);
    return c.json({ error: 'Método de pago inválido' });
  }
  const postalCode = body.shippingAddress?.postalCode;
  const isPickup = body.shippingAddress?.deliveryMethod === 'retiro';
  if (paymentMethod === 'efectivo' && !isPickup && !SHIPPING_OVERRIDES[String(postalCode)]) {
    c.status(400);
    return c.json({ error: 'El pago en efectivo solo está disponible en códigos postales con entrega personal o retiro en local' });
  }
  const db = getDb();

  const createOrder = db.transaction((b) => {
    const id = `ORD-${String(Date.now()).slice(-6)}`;
    const date = new Date().toISOString();

    db.run(
      'INSERT INTO orders (id, customer_name, customer_email, date, subtotal, shipping_cost, total, order_status, payment_method, payment_status, items_json, shipping_address_json, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      id, b.customerName, b.customerEmail, date, b.subtotal, b.shippingCost || 0,
      b.total, 'Pendiente', b.paymentMethod, b.paymentStatus || 'pendiente',
      JSON.stringify(b.items || []), JSON.stringify(b.shippingAddress || {}), b.source || 'web'
    );

    for (const item of b.items || []) {
      const qty = item.quantity || 1;
      let info: { changes: number };
      if (item.variant) {
        const path = `$."${escJsonKey(String(item.variant))}"`;
        info = db.query(
          `UPDATE products SET variant_stock_json = json_set(variant_stock_json, ?, json_extract(variant_stock_json, ?) - ?)
           WHERE id = ? AND json_extract(variant_stock_json, ?) >= ?`
        ).run(path, path, qty, item.productId, path, qty);
      } else {
        info = db.query('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?').run(qty, item.productId, qty);
      }
      if (info.changes === 0) throw new InsufficientStockError(item.productName || item.productId);
    }

    return { id, date };
  });

  let created: { id: string; date: string };
  try {
    created = createOrder(body);
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      c.status(409);
      return c.json({ error: err.message });
    }
    throw err;
  }

  const row = db.query('SELECT * FROM orders WHERE id = ?').get(created.id) as OrderRow;

  await sendOrderConfirmation({ ...body, id: created.id });

  sendInternalOrderNotification({ ...body, id: created.id }).catch((err) => console.error('[orders] Internal notification failed:', err));

  return c.json(formatOrder(row), 201);
});

orders.patch('/:id/status', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json();
  const db = getDb();
  const existing = db.query('SELECT id, order_status, items_json FROM orders WHERE id = ?').get(c.req.param('id')) as { id: string; order_status: string; items_json: string } | undefined;
  if (!existing) { c.status(404); return c.json({ error: 'Pedido no encontrado' }); }

  const update = db.transaction(() => {
    db.run('UPDATE orders SET order_status = ? WHERE id = ?', body.orderStatus, c.req.param('id'));
    if (body.orderStatus === 'Cancelado' && existing.order_status !== 'Cancelado') {
      restoreStockForItems(db, parseOrderItems(existing.items_json));
    } else if (existing.order_status === 'Cancelado' && body.orderStatus !== 'Cancelado') {
      console.warn(`[orders] Orden ${c.req.param('id')} pasó de Cancelado a ${body.orderStatus}; no se re-descuenta stock (decisión manual)`);
    }
  });
  update();

  if (body.orderStatus !== 'Pendiente') {
    const row = db.query('SELECT * FROM orders WHERE id = ?').get(c.req.param('id')) as OrderRow;
    if (row) {
      sendOrderStatusUpdateEmail(formatOrder(row), body.orderStatus).catch((err) => console.error('[orders] Status email failed:', err));
    }
  }
  return c.json({ ok: true });
});

orders.patch('/:id/payment-status', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json();
  if (body.paymentStatus !== 'aprobado') {
    c.status(400);
    return c.json({ error: 'Solo se admite confirmar el pago como aprobado' });
  }
  const db = getDb();
  const existing = db.query('SELECT id, payment_status FROM orders WHERE id = ?').get(c.req.param('id')) as { id: string; payment_status: string } | undefined;
  if (!existing) { c.status(404); return c.json({ error: 'Pedido no encontrado' }); }
  if (existing.payment_status !== 'aprobado') {
    db.run('UPDATE orders SET payment_status = ? WHERE id = ?', 'aprobado', c.req.param('id'));
  }
  return c.json({ ok: true });
});

export default orders;
