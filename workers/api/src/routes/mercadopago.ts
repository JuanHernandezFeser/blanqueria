import type { Env } from '../types';

const MP_API = 'https://api.mercadopago.com';

function jsonResp(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

interface MpPayment {
  id: number;
  status: string;
  status_detail: string;
  external_reference?: string;
  transaction_amount: number;
  payer?: { email?: string };
  payment_method_id?: string;
}

function mapMpStatus(status: string, statusDetail: string): 'aprobado' | 'pendiente' | 'rechazado' {
  if (status === 'approved') return 'aprobado';
  if (status === 'pending' || status === 'in_process' || status === 'in_mediation') return 'pendiente';
  return 'rechazado';
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function verifyMpSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secret: string
): Promise<boolean> {
  const parts: Record<string, string> = {};
  for (const p of xSignature.split(',')) {
    const [k, v] = p.split('=').map(s => s.trim());
    parts[k] = v;
  }
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1 || !dataId || !xRequestId) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest));
  const computed = new Uint8Array(sig);

  return timingSafeEqual(computed, hexToBytes(v1));
}

async function fetchPayment(paymentId: number, accessToken: string): Promise<MpPayment | null> {
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<MpPayment>;
}

async function updateOrderPayment(env: Env, payment: MpPayment): Promise<boolean> {
  const newStatus = mapMpStatus(payment.status, payment.status_detail);

  if (payment.external_reference) {
    const byRef = await env.DB.prepare('SELECT id, payment_status FROM orders WHERE id = ?')
      .bind(payment.external_reference).first<{ id: string; payment_status: string }>();
    if (byRef && byRef.payment_status !== newStatus) {
      await env.DB.prepare('UPDATE orders SET payment_status = ? WHERE id = ?').bind(newStatus, byRef.id).run();
      return true;
    }
  }

  const payerEmail = payment.payer?.email;
  if (payerEmail) {
    const { results } = await env.DB.prepare(
      `SELECT id, payment_status, total FROM orders
       WHERE customer_email = ? AND payment_method = 'mercadopago' AND payment_status = 'pendiente'
       ORDER BY date DESC LIMIT 5`
    ).bind(payerEmail).all<{ id: string; payment_status: string; total: number }>();

    for (const order of results) {
      if (Math.abs(order.total - payment.transaction_amount) < 1) {
        await env.DB.prepare('UPDATE orders SET payment_status = ? WHERE id = ?').bind(newStatus, order.id).run();
        return true;
      }
    }
  }

  return false;
}

export async function handleMercadoPago(request: Request, env: Env, path: string, method: string): Promise<Response> {
  if (method === 'POST' && path === '/api/create-preference') {
    if (!env.MERCADOPAGO_ACCESS_TOKEN) {
      return jsonResp({ error: 'Mercado Pago no configurado. Configurá MERCADOPAGO_ACCESS_TOKEN.' }, 400);
    }
    const body = await request.json() as any;
    const externalRef = body.orderId || crypto.randomUUID();
    const response = await fetch(`${MP_API}/checkout/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}` },
      body: JSON.stringify({
        items: body.items.map((item: { title: string; quantity: number; unitPrice: number }) => ({
          title: item.title, quantity: item.quantity, unit_price: item.unitPrice, currency_id: 'ARS',
        })),
        payer: { email: body.customerEmail },
        external_reference: externalRef,
        back_urls: {
          success: `${env.SITE_URL}/pago/retorno?status=approved`,
          pending: `${env.SITE_URL}/pago/retorno?status=pending`,
          failure: `${env.SITE_URL}/pago/retorno?status=failure`,
        },
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      return jsonResp({ error: `Error de Mercado Pago: ${err}` }, 502);
    }
    const data = await response.json() as any;
    const initPoint = data.init_point || data.sandbox_init_point;
    return jsonResp({ initPoint, preferenceId: data.id, externalReference: externalRef });
  }

  if (method === 'POST' && path === '/api/webhooks/mercadopago') {
    const body = await request.json() as Record<string, unknown>;
    const topic = (body as any).topic || (body as any).type;
    const paymentId = Number((body as any).id || (body as any).data?.id);

    if (env.MERCADOPAGO_WEBHOOK_SECRET) {
      const xSignature = request.headers.get('x-signature') || '';
      const xRequestId = request.headers.get('x-request-id') || '';
      const dataId = String((body as any).data?.id || '');

      if (!xSignature || !xRequestId || !dataId) {
        console.error('[MP Webhook] Missing signature headers');
        return jsonResp({ ok: true });
      }

      if (!await verifyMpSignature(xSignature, xRequestId, dataId, env.MERCADOPAGO_WEBHOOK_SECRET)) {
        console.error(`[MP Webhook] Invalid signature for payment ${dataId}`);
        return jsonResp({ ok: true });
      }
    }

    if ((topic === 'payment' || topic === 'merchant_order') && paymentId && env.MERCADOPAGO_ACCESS_TOKEN) {
      const payment = await fetchPayment(paymentId, env.MERCADOPAGO_ACCESS_TOKEN);
      if (payment) {
        const updated = await updateOrderPayment(env, payment);
        console.log(`[MP Webhook] payment=${paymentId} status=${payment.status} updated_order=${updated}`);
      } else {
        console.error(`[MP Webhook] Could not fetch payment ${paymentId}`);
      }
    }

    return jsonResp({ ok: true });
  }

  return jsonResp({ error: 'Not found' }, 404);
}
