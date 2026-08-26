import type { Env } from '../types';
import { SHIPPING_OVERRIDES } from '../config/shippingOverrides';
import { getShippingQuote } from '../lib/micorreo';

interface PackageInfo {
  weight: number; height: number; width: number; length: number; quantity: number;
}

const DEFAULT_WEIGHT = 1;
const DEFAULT_DIM = 20;

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
});

function formatOverrideDays(minDays: number, maxDays: number): string {
  if (minDays === maxDays) return `${maxDays} día${maxDays === 1 ? '' : 's'} hábil${maxDays === 1 ? '' : 'es'}`;
  return `${minDays}-${maxDays} días hábiles`;
}

function sanitizeCartSubtotal(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

/** Combina las dimensiones de los items en un solo paquete para cotizar. */
function combinePackages(packages: PackageInfo[]) {
  let totalWeightGrams = 0;
  let maxHeight = 0;
  let maxWidth = 0;
  let maxLength = 0;

  for (const p of packages) {
    const qty = p.quantity || 1;
    const weight = p.weight || DEFAULT_WEIGHT;
    const height = p.height || DEFAULT_DIM;
    const width = p.width || DEFAULT_DIM;
    const length = p.length || DEFAULT_DIM;

    totalWeightGrams += weight * qty;
    if (height > maxHeight) maxHeight = height;
    if (width > maxWidth) maxWidth = width;
    if (length > maxLength) maxLength = length;
  }

  return { totalWeightGrams, maxHeight, maxWidth, maxLength };
}

async function resolveShipping(postalCode: string, cartSubtotal: number, packages: PackageInfo[], env: Env) {
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

  const { totalWeightGrams, maxHeight, maxWidth, maxLength } = combinePackages(packages);
  const cost = await getShippingQuote(env, {
    destinationCp: postalCode,
    weightGrams: totalWeightGrams,
    heightCm: maxHeight,
    widthCm: maxWidth,
    lengthCm: maxLength,
  });

  return {
    method: 'Envío a domicilio (Correo Argentino)',
    days: 'A consultar',
    cost,
    source: 'correo_argentino_api',
  };
}

export async function handleShipping(request: Request, env: Env, _ctx: ExecutionContext, path: string, method: string): Promise<Response> {
  if (method === 'POST' && path === '/api/shipping/quote') {
    const { postalCode, packages, cartSubtotal } = await request.json() as { postalCode: string; packages: PackageInfo[]; cartSubtotal?: unknown };
    if (!postalCode || postalCode.length < 4) return json({ error: 'Código postal inválido' }, 400);
    try {
      return json(await resolveShipping(postalCode, sanitizeCartSubtotal(cartSubtotal), packages ?? [], env));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al calcular envío';
      return json({ error: message }, 502);
    }
  }
  return json({ error: 'Not found' }, 404);
}
