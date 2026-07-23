import type { Env } from './types';

const RESEND_API = 'https://api.resend.com/emails';

function formatPrice(amount: number): string {
  return '$' + amount.toLocaleString('es-AR');
}

function orderEmailHtml(order: any, bankConfig?: any): string {
  const itemsHtml = (order.items || []).map((item: any) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1f2937">${item.productName}${item.variant ? ` <span style="color:#6b7280;font-size:12px">(${item.variant})</span>` : ''}</td>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280;text-align:center">x${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1f2937;text-align:right">${formatPrice(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  const bankHtml = bankConfig ? `
    <div style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:8px;font-size:13px;color:#374151">
      <p style="margin:0 0 8px;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280">Datos para transferir</p>
      <p style="margin:2px 0">Banco: ${bankConfig.bankName}</p>
      <p style="margin:2px 0">CBU: ${bankConfig.cbu}</p>
      <p style="margin:2px 0">Alias: ${bankConfig.alias}</p>
      <p style="margin:2px 0">Titular: ${bankConfig.accountHolder}</p>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
      <tr><td style="padding:32px 32px 0;text-align:center">
        <h1 style="margin:0;font-size:24px;color:#1f2937;font-weight:600">¡Gracias por tu compra!</h1>
        <p style="margin:8px 0 0;font-size:14px;color:#6b7280">Pedido <strong style="color:#1f2937">${order.id}</strong></p>
      </td></tr>
      <tr><td style="padding:24px 32px">
        <p style="margin:0;font-size:14px;color:#374151">Hola <strong>${order.customerName}</strong>,</p>
        <p style="margin:8px 0 0;font-size:14px;color:#6b7280;line-height:1.5">Recibimos tu pedido correctamente. Te vamos a mantener informado sobre el estado del envío.</p>
      </td></tr>
      <tr><td style="padding:0 32px">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom:8px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;font-weight:600">Producto</td>
            <td style="padding-bottom:8px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;font-weight:600;text-align:center">Cant.</td>
            <td style="padding-bottom:8px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;font-weight:600;text-align:right">Subtotal</td>
          </tr>
          ${itemsHtml}
        </table>
      </td></tr>
      <tr><td style="padding:16px 32px 0;text-align:right">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-size:14px;color:#6b7280">Subtotal</td><td style="font-size:14px;color:#1f2937;text-align:right">${formatPrice(order.subtotal)}</td></tr>
          ${order.shippingCost > 0 ? `<tr><td style="font-size:14px;color:#6b7280">Envío</td><td style="font-size:14px;color:#1f2937;text-align:right">${formatPrice(order.shippingCost)}</td></tr>` : ''}
          <tr><td style="padding-top:8px;font-size:16px;font-weight:600;color:#1f2937">Total</td><td style="padding-top:8px;font-size:16px;font-weight:600;color:#1f2937;text-align:right">${formatPrice(order.total)}</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:24px 32px">
        <div style="padding:16px;background:#f9fafb;border-radius:8px">
          <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;font-weight:600">Envío a</p>
          <p style="margin:2px 0;font-size:14px;color:#1f2937">${order.shippingAddress?.address}</p>
          <p style="margin:2px 0;font-size:14px;color:#6b7280">${order.shippingAddress?.city}, ${order.shippingAddress?.province} - CP ${order.shippingAddress?.postalCode}</p>
          <p style="margin:2px 0;font-size:14px;color:#6b7280">Tel: ${order.shippingAddress?.phone}</p>
        </div>
        <div style="margin-top:12px;padding:16px;background:#f9fafb;border-radius:8px">
          <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;font-weight:600">Método de pago</p>
          <p style="margin:0;font-size:14px;color:#1f2937">${order.paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Transferencia bancaria'}</p>
          <p style="margin:2px 0 0;font-size:13px;color:#6b7280">Estado: ${order.paymentStatus === 'aprobado' ? 'Aprobado' : order.paymentStatus === 'rechazado' ? 'Rechazado' : 'Pendiente'}</p>
        </div>
        ${bankHtml}
      </td></tr>
      <tr><td style="padding:0 32px 32px;text-align:center">
        <p style="margin:0;font-size:13px;color:#9ca3af">Ante cualquier duda, respondé este correo.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}

function verificationEmailHtml(name: string, token: string, siteUrl: string): string {
  const verifyUrl = `${siteUrl}/verificar-email/${token}`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
      <tr><td style="padding:32px 32px 0;text-align:center">
        <h1 style="margin:0;font-size:24px;color:#1f2937;font-weight:600">Verificá tu email</h1>
      </td></tr>
      <tr><td style="padding:24px 32px">
        <p style="margin:0;font-size:14px;color:#374151">Hola <strong>${name}</strong>,</p>
        <p style="margin:8px 0 0;font-size:14px;color:#6b7280;line-height:1.5">Gracias por crear tu cuenta. Para completar el registro, hacé click en el botón de abajo.</p>
      </td></tr>
      <tr><td style="padding:0 32px 24px;text-align:center">
        <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;background:#1f2937;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.5px">Verificar email</a>
      </td></tr>
      <tr><td style="padding:0 32px 32px;text-align:center">
        <p style="margin:0;font-size:13px;color:#9ca3af">Si no creaste esta cuenta, podés ignorar este mensaje.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}

export async function sendVerificationEmail(env: Pick<Env, 'RESEND_API_KEY' | 'EMAIL_FROM' | 'SITE_URL'>, email: string, name: string, token: string) {
  if (!env.RESEND_API_KEY) return;
  try {
    await fetch(RESEND_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: email,
        subject: 'Verificá tu cuenta',
        html: verificationEmailHtml(name, token, env.SITE_URL),
      }),
    });
  } catch (err) {
    console.error('[mail] Error sending verification email:', err);
  }
}

export async function sendOrderConfirmation(env: Pick<Env, 'RESEND_API_KEY' | 'EMAIL_FROM'>, order: any) {
  if (!env.RESEND_API_KEY) return;
  try {
    await fetch(RESEND_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: order.customerEmail,
        subject: `Pedido confirmado - ${order.id}`,
        html: orderEmailHtml(order, null),
      }),
    });
  } catch (err) {
    console.error('[mail] Error sending order confirmation:', err);
  }
}
