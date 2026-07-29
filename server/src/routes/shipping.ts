import { Hono } from 'hono';

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

shipping.post('/quote', async (c) => {
  const { postalCode, packages } = await c.req.json() as { postalCode: string; packages: PackageInfo[] };
  if (!postalCode || postalCode.length < 4) {
    c.status(400);
    return c.json({ error: 'Código postal inválido' });
  }
  return c.json(calculateFallback(postalCode));
});

export default shipping;
