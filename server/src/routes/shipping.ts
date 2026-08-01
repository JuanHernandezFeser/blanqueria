import { Hono } from 'hono';
import { SHIPPING_OVERRIDES } from '../config/shippingOverrides';

const shipping = new Hono();

interface PackageInfo {
  weight: number; height: number; width: number; length: number; quantity: number;
}

function calculateFallback(postalCode: string) {
  const isCABA = postalCode.startsWith('1');
  const isGBA = postalCode.startsWith('16') || postalCode.startsWith('17') || postalCode.startsWith('18') || postalCode.startsWith('19');
  if (isCABA) return { method: 'Envío Express', days: '24-48hs', cost: 850, source: 'fallback' };
  if (isGBA) return { method: 'Envío Estándar', days: '2-3 días hábiles', cost: 1200, source: 'fallback' };
  return { method: 'Correo Argentino', days: '3-5 días hábiles', cost: 1400, source: 'fallback' };
}

function formatOverrideDays(minDays: number, maxDays: number): string {
  if (minDays === maxDays) return `${maxDays} día${maxDays === 1 ? '' : 's'} hábil${maxDays === 1 ? '' : 'es'}`;
  return `${minDays}-${maxDays} días hábiles`;
}

function sanitizeCartSubtotal(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

shipping.post('/quote', async (c) => {
  const { postalCode, packages, cartSubtotal } = await c.req.json() as { postalCode: string; packages: PackageInfo[]; cartSubtotal?: unknown };
  if (!postalCode || postalCode.length < 4) {
    c.status(400);
    return c.json({ error: 'Código postal inválido' });
  }
  const sub = sanitizeCartSubtotal(cartSubtotal);
  const override = SHIPPING_OVERRIDES[postalCode];
  if (override) {
    const freeShipping = typeof override.freeShippingThreshold === 'number' && sub >= override.freeShippingThreshold;
    return c.json({
      method: override.service,
      days: formatOverrideDays(override.etaMinDays, override.etaMaxDays),
      cost: freeShipping ? 0 : override.price,
      source: 'manual_override',
    });
  }
  return c.json(calculateFallback(postalCode));
});

export default shipping;
