import type { MpPreferenceRequest, MpPreferenceResponse } from './types';

const MP_API = 'https://api.mercadopago.com';

export async function createPreference(
  accessToken: string,
  payload: MpPreferenceRequest,
  siteUrl: string
): Promise<MpPreferenceResponse> {
  const response = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      items: payload.items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: 'ARS',
      })),
      payer: { email: payload.customerEmail },
      back_urls: {
        success: `${siteUrl}/pago/retorno`,
        pending: `${siteUrl}/pago/retorno`,
        failure: `${siteUrl}/pago/retorno`,
      },
      auto_return: 'approved',
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Mercado Pago error: ${err}`);
  }

  const data = await response.json();
  return {
    initPoint: data.init_point,
    preferenceId: data.id,
  };
}

export async function handleWebhook(body: Record<string, unknown>): Promise<void> {
  // Webhook handling logic
  // MP sends topic=payment, id=<payment_id>
  // We'd fetch the payment status and update the order
  const topic = body.topic || body.type;
  const id = body.id || body.data?.id;

  if (topic === 'payment' && id) {
    // In a real scenario, fetch payment status from MP API
    // and update the corresponding order in KV
    console.log(`Payment notification received: payment_id=${id}`);
  }
}
