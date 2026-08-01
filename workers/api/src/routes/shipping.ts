import type { Env } from '../types';
import { SHIPPING_OVERRIDES } from '../config/shippingOverrides';

interface PackageInfo {
  weight: number; height: number; width: number; length: number; quantity: number;
}

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
});

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

function resolveShipping(postalCode: string, cartSubtotal: number) {
  const override = SHIPPING_OVERRIDES[postalCode];
  if (override) {
    const freeShipping = typeof override.freeShippingThreshold === 'number' && cartSubtotal >= override.freeShippingThreshold;
    return {
      method: override.service,
      days: formatOverrideDays(override.etaMinDays, override.etaMaxDays),
      cost: freeShipping ? 0 : override.price,
      source: 'manual_override',
    };
  }
  return calculateFallback(postalCode);
}

function sanitizeCartSubtotal(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

export async function handleShipping(request: Request, env: Env, _ctx: ExecutionContext, path: string, method: string): Promise<Response> {
  if (method === 'POST' && path === '/api/shipping/quote') {
    const { postalCode, packages, cartSubtotal } = await request.json() as { postalCode: string; packages: PackageInfo[]; cartSubtotal?: unknown };
    if (!postalCode || postalCode.length < 4) return json({ error: 'Código postal inválido' }, 400);
    return json(resolveShipping(postalCode, sanitizeCartSubtotal(cartSubtotal)));
  }
  return json({ error: 'Not found' }, 404);
}
