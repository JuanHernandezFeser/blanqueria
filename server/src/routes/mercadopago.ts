import { Hono } from 'hono';
import { getDb } from '../db';
import { restoreStockForItems, parseOrderItems } from './orders';
import crypto from 'node:crypto';

const mercadopago = new Hono();

const MP_API = 'https://api.mercadopago.com';

function mapMpStatus(status: string): 'aprobado' | 'pendiente' | 'rechazado' {
  if (status === 'approved') return 'aprobado';
  if (status === 'pending' || status === 'in_process' || status === 'in_mediation') return 'pendiente';
  return 'rechazado';
}

function verifyMpSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secret: string
): boolean {
  const parts: Record<string, string> = {};
  for (const p of xSignature.split(',')) {
    const [k, v] = p.split('=').map(s => s.trim());
    parts[k] = v;
  }
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1 || !dataId || !xRequestId) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const computed = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed, 'hex'),
      Buffer.from(v1, 'hex')
    );
  } catch {
    return false;
  }
}

mercadopago.post('/create-preference', async (c) => {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const siteUrl = process.env.SITE_URL || 'http://localhost:8080';

  if (!accessToken) {
    c.status(400);
    return c.json({ error: 'Mercado Pago no configurado. Configurá MERCADOPAGO_ACCESS_TOKEN.' });
  }

  const body = await c.req.json();
  const externalRef = body.orderId || crypto.randomUUID();

  const response = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      items: body.items.map((item: { title: string; quantity: number; unitPrice: number }) => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: 'ARS',
      })),
      payer: { email: body.customerEmail },
      external_reference: externalRef,
      back_urls: {
        success: `${siteUrl}/pago/retorno?status=approved`,
        pending: `${siteUrl}/pago/retorno?status=pending`,
        failure: `${siteUrl}/pago/retorno?status=failure`,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[MP] Error creating preference:', response.status, err);
    c.status(502);
    return c.json({ error: `Error de Mercado Pago: ${err}` });
  }

  const data = await response.json();
  const initPoint = data.init_point || data.sandbox_init_point;
  return c.json({ initPoint, preferenceId: data.id, externalReference: externalRef });
});

mercadopago.post('/webhooks/mercadopago', async (c) => {
  const body = await c.req.json();
  const topic = body.topic || body.type;
  const paymentId = Number(body.id || body.data?.id);
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (webhookSecret) {
    const xSignature = c.req.header('x-signature') || '';
    const xRequestId = c.req.header('x-request-id') || '';
    const dataId = String(body.data?.id || '');

    if (!xSignature || !xRequestId || !dataId) {
      console.error('[MP Webhook] Missing signature headers');
      return c.json({ ok: true });
    }

    if (!verifyMpSignature(xSignature, xRequestId, dataId, webhookSecret)) {
      console.error(`[MP Webhook] Invalid signature for payment ${dataId}`);
      return c.json({ ok: true });
    }
  }

  if ((topic === 'payment' || topic === 'merchant_order') && paymentId && accessToken) {
    const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.ok) {
      const payment = await res.json() as {
        id: number; status: string; status_detail: string;
        external_reference?: string; transaction_amount: number;
        payer?: { email?: string };
      };
      const newStatus = mapMpStatus(payment.status);
      const db = getDb();

      const applyStatus = (order: { id: string; payment_status: string; items_json: string }): boolean => {
        if (order.payment_status === newStatus) return false;
        const update = db.transaction(() => {
          db.run('UPDATE orders SET payment_status = ? WHERE id = ?', newStatus, order.id);
          if (newStatus === 'rechazado') {
            restoreStockForItems(db, parseOrderItems(order.items_json));
          }
        });
        update();
        return true;
      };

      let updated = false;

      if (payment.external_reference) {
        const existing = db.query('SELECT id, payment_status, items_json FROM orders WHERE id = ?').get(payment.external_reference) as { id: string; payment_status: string; items_json: string } | undefined;
        if (existing) {
          updated = applyStatus(existing);
        }
      }

      if (!updated && payment.payer?.email) {
        const orders = db.query(
          `SELECT id, payment_status, total, items_json FROM orders
           WHERE customer_email = ? AND payment_method = 'mercadopago' AND payment_status = 'pendiente'
           ORDER BY date DESC LIMIT 5`
        ).all(payment.payer.email) as { id: string; payment_status: string; total: number; items_json: string }[];

        for (const order of orders) {
          if (Math.abs(order.total - payment.transaction_amount) < 1) {
            updated = applyStatus(order);
            break;
          }
        }
      }

      console.log(`[MP Webhook] payment=${paymentId} status=${payment.status} updated_order=${updated}`);
    } else {
      console.error(`[MP Webhook] Could not fetch payment ${paymentId}: ${res.status}`);
    }
  }

  return c.json({ ok: true });
});

export default mercadopago;
