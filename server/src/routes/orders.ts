import { Hono } from 'hono';
import { getDb } from '../db';
import { authMiddleware, adminMiddleware } from '../auth';
import { sendOrderConfirmation } from '../mail';

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

orders.post('/', async (c) => {
  const body = await c.req.json();
  const db = getDb();
  const id = `ORD-${String(Date.now()).slice(-6)}`;
  const date = new Date().toISOString();

  db.run(
    'INSERT INTO orders (id, customer_name, customer_email, date, subtotal, shipping_cost, total, order_status, payment_method, payment_status, items_json, shipping_address_json, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    id, body.customerName, body.customerEmail, date, body.subtotal, body.shippingCost || 0,
    body.total, 'Pendiente', body.paymentMethod, body.paymentStatus || 'pendiente',
    JSON.stringify(body.items || []), JSON.stringify(body.shippingAddress || {}), body.source || 'web'
  );

  for (const item of body.items || []) {
    const product = db.query('SELECT stock, variant_stock_json FROM products WHERE id = ?').get(item.productId) as { stock: number; variant_stock_json: string } | undefined;
    if (!product) continue;
    const qty = item.quantity || 1;
    if (item.variant) {
      const variantStock = JSON.parse(product.variant_stock_json || '{}');
      const current = variantStock[item.variant] ?? 0;
      variantStock[item.variant] = Math.max(0, current - qty);
      db.run('UPDATE products SET variant_stock_json = ? WHERE id = ?', JSON.stringify(variantStock), item.productId);
    } else {
      db.run('UPDATE products SET stock = ? WHERE id = ?', Math.max(0, product.stock - qty), item.productId);
    }
  }

  const row = db.query('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow;

  await sendOrderConfirmation({ ...body, id });

  return c.json(formatOrder(row), 201);
});

orders.patch('/:id/status', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json();
  const db = getDb();
  const existing = db.query('SELECT id FROM orders WHERE id = ?').get(c.req.param('id'));
  if (!existing) { c.status(404); return c.json({ error: 'Pedido no encontrado' }); }
  db.run('UPDATE orders SET order_status = ? WHERE id = ?', body.orderStatus, c.req.param('id'));
  return c.json({ ok: true });
});

export default orders;
