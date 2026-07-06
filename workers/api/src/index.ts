import { addOrder, getOrders, updateOrderStatus, getBankConfig, saveBankConfig } from './orders';
import { createPreference, handleWebhook } from './mercadopago';
import type { Order } from './types';

interface Env {
  ORDERS_KV: KVNamespace;
  MERCADOPAGO_ACCESS_TOKEN: string;
  MERCADOPAGO_PUBLIC_KEY: string;
  SITE_URL: string;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

function corsHeaders(): Headers {
  const headers = new Headers({ 'Access-Control-Allow-Origin': '*' });
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return headers;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    try {
      // POST /api/create-preference
      if (method === 'POST' && path === '/api/create-preference') {
        const body = await request.json();
        const result = await createPreference(
          env.MERCADOPAGO_ACCESS_TOKEN,
          body as any,
          env.SITE_URL
        );
        return jsonResponse(result);
      }

      // POST /api/webhooks/mercadopago
      if (method === 'POST' && path === '/api/webhooks/mercadopago') {
        const body = await request.json();
        await handleWebhook(body as Record<string, unknown>);
        return jsonResponse({ ok: true });
      }

      // POST /api/orders
      if (method === 'POST' && path === '/api/orders') {
        const body = (await request.json()) as Omit<Order, 'id' | 'date'>;
        const id = `ORD-${String(Date.now()).slice(-6)}`;
        const order: Order = {
          ...body,
          id,
          date: new Date().toISOString().split('T')[0],
        };
        const created = await addOrder(env.ORDERS_KV, order);
        return jsonResponse(created, 201);
      }

      // GET /api/orders
      if (method === 'GET' && path === '/api/orders') {
        const email = url.searchParams.get('email');
        const orders = await getOrders(env.ORDERS_KV);
        const filtered = email ? orders.filter((o) => o.customerEmail === email) : orders;
        return jsonResponse(filtered);
      }

      // PATCH /api/orders/:id/status
      if (method === 'PATCH' && path.match(/^\/api\/orders\/[^/]+\/status$/)) {
        const id = path.split('/')[3];
        const body = (await request.json()) as { orderStatus: string };
        await updateOrderStatus(env.ORDERS_KV, id, body.orderStatus);
        return jsonResponse({ ok: true });
      }

      // GET /api/bank-config
      if (method === 'GET' && path === '/api/bank-config') {
        const config = await getBankConfig(env.ORDERS_KV);
        return jsonResponse(config);
      }

      // PUT /api/bank-config
      if (method === 'PUT' && path === '/api/bank-config') {
        const body = await request.json();
        await saveBankConfig(env.ORDERS_KV, body as any);
        return jsonResponse({ ok: true });
      }

      return errorResponse('Not found', 404);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal error';
      return errorResponse(message, 500);
    }
  },
};
