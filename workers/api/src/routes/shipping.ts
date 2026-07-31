import type { Env } from '../types';

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

export async function handleShipping(request: Request, env: Env, _ctx: ExecutionContext, path: string, method: string): Promise<Response> {
  if (method === 'POST' && path === '/api/shipping/quote') {
    const { postalCode, packages } = await request.json() as { postalCode: string; packages: PackageInfo[] };
    if (!postalCode || postalCode.length < 4) return json({ error: 'Código postal inválido' }, 400);
    return json(calculateFallback(postalCode));
  }
  return json({ error: 'Not found' }, 404);
}
