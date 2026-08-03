import type { Env } from '../types';
import { requireAuth, requireAdmin } from '../auth';
import { sendOrderConfirmation, sendOrderStatusUpdateEmail, sendInternalOrderNotification } from '../mail';
import { buildRestoreStockStatements, parseOrderItems } from '../services/stock';
import { SHIPPING_OVERRIDES } from '../config/shippingOverrides';

const PAYMENT_METHODS = ['mercadopago', 'transferencia', 'efectivo'] as const;

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

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
});

export async function handleOrders(request: Request, env: Env, ctx: ExecutionContext, path: string, method: string): Promise<Response> {
  // GET /api/orders
  if (method === 'GET' && path === '/api/orders') {
    const user = await requireAuth(request, env);
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    let rows: OrderRow[];
    if (user.isAdmin) {
      const { results } = await env.DB.prepare('SELECT * FROM orders ORDER BY date DESC').all<OrderRow>();
      rows = results;
    } else {
      const { results } = await env.DB.prepare('SELECT * FROM orders WHERE customer_email = ? ORDER BY date DESC').bind(user.email).all<OrderRow>();
      rows = results;
    }
    const filtered = email ? rows.filter(o => o.customer_email === email) : rows;
    return json(filtered.map(formatOrder));
  }

  // POST /api/orders
  if (method === 'POST' && path === '/api/orders') {
    const body = await request.json() as any;
    const paymentMethod = body.paymentMethod;
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return json({ error: 'Método de pago inválido' }, 400);
    }
    const postalCode = body.shippingAddress?.postalCode;
    const isPickup = body.shippingAddress?.deliveryMethod === 'retiro';
    if (paymentMethod === 'efectivo' && !isPickup && !SHIPPING_OVERRIDES[String(postalCode)]) {
      return json({ error: 'El pago en efectivo solo está disponible en códigos postales con entrega personal o retiro en local' }, 400);
    }
    const id = `ORD-${String(Date.now()).slice(-6)}`;
    const date = new Date().toISOString();

    const escJsonKey = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    const stmts: D1PreparedStatement[] = [
      env.DB.prepare(
        `INSERT INTO orders (id, customer_name, customer_email, date, subtotal, shipping_cost, total, order_status, payment_method, payment_status, items_json, shipping_address_json, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id, body.customerName, body.customerEmail, date, body.subtotal, body.shippingCost || 0,
        body.total, 'Pendiente', body.paymentMethod, body.paymentStatus || 'pendiente',
        JSON.stringify(body.items || []), JSON.stringify(body.shippingAddress || {}), body.source || 'web'
      ),
    ];

    const itemInfos: { productId: string; variant?: string; qty: number; productName: string }[] = [];
    for (const item of body.items || []) {
      const qty = item.quantity || 1;
      itemInfos.push({ productId: item.productId, variant: item.variant, qty, productName: item.productName || item.productId });
      if (item.variant) {
        const path = `$."${escJsonKey(String(item.variant))}"`;
        stmts.push(env.DB.prepare(
          `UPDATE products SET variant_stock_json = json_set(variant_stock_json, ?, json_extract(variant_stock_json, ?) - ?)
           WHERE id = ? AND json_extract(variant_stock_json, ?) >= ?`
        ).bind(path, path, qty, item.productId, path, qty));
      } else {
        stmts.push(env.DB.prepare(
          'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?'
        ).bind(qty, item.productId, qty));
      }
    }

    const results = await env.DB.batch(stmts);

    const applied: { productId: string; variant?: string; qty: number }[] = [];
    const outOfStock: string[] = [];
    for (let i = 0; i < itemInfos.length; i++) {
      const res = results[i + 1];
      if (res.meta.changes === 0) outOfStock.push(itemInfos[i].productName);
      else applied.push(itemInfos[i]);
    }

    if (outOfStock.length > 0) {
      const rollback: D1PreparedStatement[] = [env.DB.prepare('DELETE FROM orders WHERE id = ?').bind(id)];
      rollback.push(...buildRestoreStockStatements(
        env.DB,
        applied.map((a) => ({ productId: a.productId, variant: a.variant, quantity: a.qty }))
      ));
      await env.DB.batch(rollback);
      return json({ error: `Stock insuficiente para ${outOfStock[0]}` }, 409);
    }

    const row = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first<OrderRow>();
    ctx.waitUntil(sendOrderConfirmation(env, { ...body, id }));
    ctx.waitUntil(sendInternalOrderNotification(env, { ...body, id }));
    return json(formatOrder(row!), 201);
  }

  // PATCH /api/orders/:id/status
  const orderMatch = path.match(/^\/api\/orders\/([^/]+)\/status$/);
  if (method === 'PATCH' && orderMatch) {
    await requireAdmin(request, env);
    const body = await request.json() as { orderStatus: string };
    const existing = await env.DB.prepare('SELECT id, order_status, items_json FROM orders WHERE id = ?')
      .bind(orderMatch[1]).first<{ id: string; order_status: string; items_json: string }>();
    if (!existing) return json({ error: 'Pedido no encontrado' }, 404);

    const stmts: D1PreparedStatement[] = [env.DB.prepare('UPDATE orders SET order_status = ? WHERE id = ?').bind(body.orderStatus, orderMatch[1])];
    if (body.orderStatus === 'Cancelado' && existing.order_status !== 'Cancelado') {
      stmts.push(...buildRestoreStockStatements(env.DB, parseOrderItems(existing.items_json)));
    } else if (existing.order_status === 'Cancelado' && body.orderStatus !== 'Cancelado') {
      console.warn(`[orders] Orden ${orderMatch[1]} pasó de Cancelado a ${body.orderStatus}; no se re-descuenta stock (decisión manual)`);
    }
    await env.DB.batch(stmts);

    if (body.orderStatus !== 'Pendiente') {
      const updated = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderMatch[1]).first<OrderRow>();
      if (updated) {
        ctx.waitUntil(sendOrderStatusUpdateEmail(env, formatOrder(updated), body.orderStatus));
      }
    }
    return json({ ok: true });
  }

  // PATCH /api/orders/:id/payment-status
  const paymentMatch = path.match(/^\/api\/orders\/([^/]+)\/payment-status$/);
  if (method === 'PATCH' && paymentMatch) {
    await requireAdmin(request, env);
    const body = await request.json() as { paymentStatus: string };
    if (body.paymentStatus !== 'aprobado') {
      return json({ error: 'Solo se admite confirmar el pago como aprobado' }, 400);
    }
    const existing = await env.DB.prepare('SELECT id, payment_status FROM orders WHERE id = ?')
      .bind(paymentMatch[1]).first<{ id: string; payment_status: string }>();
    if (!existing) return json({ error: 'Pedido no encontrado' }, 404);
    if (existing.payment_status !== 'aprobado') {
      await env.DB.prepare('UPDATE orders SET payment_status = ? WHERE id = ?').bind('aprobado', paymentMatch[1]).run();
    }
    return json({ ok: true });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}
