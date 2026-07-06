import { Hono } from 'hono';

const mercadopago = new Hono();

const MP_API = 'https://api.mercadopago.com';

mercadopago.post('/create-preference', async (c) => {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const siteUrl = process.env.SITE_URL || 'http://localhost:8080';

  if (!accessToken) {
    c.status(400);
    return c.json({ error: 'Mercado Pago no configurado. Configurá MERCADOPAGO_ACCESS_TOKEN.' });
  }

  const body = await c.req.json();

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
      back_urls: {
        success: `${siteUrl}/pago/retorno?status=approved`,
        pending: `${siteUrl}/pago/retorno?status=pending`,
        failure: `${siteUrl}/pago/retorno?status=failure`,
      },
      auto_return: 'approved',
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    c.status(502);
    return c.json({ error: `Error de Mercado Pago: ${err}` });
  }

  const data = await response.json();
  return c.json({ initPoint: data.init_point, preferenceId: data.id });
});

mercadopago.post('/webhooks/mercadopago', async (c) => {
  const body = await c.req.json();
  const topic = body.topic || body.type;
  const id = body.id || body.data?.id;

  if (topic === 'payment' && id) {
    console.log(`Payment notification: payment_id=${id}`);
  }

  return c.json({ ok: true });
});

export default mercadopago;
