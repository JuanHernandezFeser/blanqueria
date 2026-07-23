import type { Env } from '../types';
import { requireAuth, requireAdmin } from '../auth';
import { sendOrderConfirmation } from '../mail';

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

export async function handleOrders(request: Request, env: Env, path: string, method: string): Promise<Response> {
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
    const id = `ORD-${String(Date.now()).slice(-6)}`;
    const date = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO orders (id, customer_name, customer_email, date, subtotal, shipping_cost, total, order_status, payment_method, payment_status, items_json, shipping_address_json, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, body.customerName, body.customerEmail, date, body.subtotal, body.shippingCost || 0,
      body.total, 'Pendiente', body.paymentMethod, body.paymentStatus || 'pendiente',
      JSON.stringify(body.items || []), JSON.stringify(body.shippingAddress || {}), body.source || 'web'
    ).run();

    // Decrement stock
    for (const item of body.items || []) {
      const product = await env.DB.prepare('SELECT stock, variant_stock_json FROM products WHERE id = ?').bind(item.productId).first<{ stock: number; variant_stock_json: string }>();
      if (!product) continue;
      const qty = item.quantity || 1;
      if (item.variant) {
        const variantStock = JSON.parse(product.variant_stock_json || '{}');
        const current = variantStock[item.variant] ?? 0;
        variantStock[item.variant] = Math.max(0, current - qty);
        await env.DB.prepare('UPDATE products SET variant_stock_json = ? WHERE id = ?').bind(JSON.stringify(variantStock), item.productId).run();
      } else {
        await env.DB.prepare('UPDATE products SET stock = ? WHERE id = ?').bind(Math.max(0, product.stock - qty), item.productId).run();
      }
    }

    const row = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first<OrderRow>();
    sendOrderConfirmation(env, { ...body, id });
    return json(formatOrder(row!), 201);
  }

  // PATCH /api/orders/:id/status
  const orderMatch = path.match(/^\/api\/orders\/([^/]+)\/status$/);
  if (method === 'PATCH' && orderMatch) {
    await requireAdmin(request, env);
    const body = await request.json() as { orderStatus: string };
    const existing = await env.DB.prepare('SELECT id FROM orders WHERE id = ?').bind(orderMatch[1]).first();
    if (!existing) return json({ error: 'Pedido no encontrado' }, 404);
    await env.DB.prepare('UPDATE orders SET order_status = ? WHERE id = ?').bind(body.orderStatus, orderMatch[1]).run();
    return json({ ok: true });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}
