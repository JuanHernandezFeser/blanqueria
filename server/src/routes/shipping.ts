import { Hono } from 'hono';
import { SHIPPING_OVERRIDES } from '../config/shippingOverrides';

const shipping = new Hono();

interface PackageInfo {
  weight: number; height: number; width: number; length: number; quantity: number;
}

interface OcaQuote {
  cost: number;
  days: number;
  ambito: string;
}

// Espejo de workers/api/src/routes/shipping.ts para el backend local de Bun.
// Credenciales OCA (QA por defecto): al tener la cuenta real solo se cambian
// estas variables en .env: OCA_API_URL, OCA_CUIT, OCA_OPERATIVA y OCA_ORIGEN_CP.
const OCA_DEFAULT_URL = 'https://integraciones.ocadev.com.ar/epak_tracking_test/Oep_TrackEPak.asmx/Tarifar_Envio_Corporativo';
const OCA_PROD_URL = 'https://webservice.oca.com.ar/ePak_tracking/Oep_TrackEPak.asmx/Tarifar_Envio_Corporativo';
const OCA_DEFAULT_CUIT = '30-53625919-4';
// Operativa de prueba "Sucursal a Puerta": el cliente despacha en la sucursal de
// OCA de Bahía Blanca y OCA entrega en el domicilio del destinatario.
const OCA_DEFAULT_OPERATIVA = '94584';
const OCA_DEFAULT_ORIGIN_CP = '8000';
const OCA_TIMEOUT_MS = 8000;
const DEFAULT_WEIGHT = 1;
const DEFAULT_DIM = 20;

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

function formatOcaDays(days: number): string {
  if (!days || days <= 0) return 'A consultar';
  return `${days} día${days === 1 ? '' : 's'} hábil${days === 1 ? '' : 'es'}`;
}

function sanitizeCartSubtotal(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

function getOcaConfig() {
  return {
    url: process.env.OCA_API_URL || OCA_DEFAULT_URL,
    cuit: process.env.OCA_CUIT || OCA_DEFAULT_CUIT,
    operativa: process.env.OCA_OPERATIVA || OCA_DEFAULT_OPERATIVA,
    originCp: process.env.OCA_ORIGEN_CP || OCA_DEFAULT_ORIGIN_CP,
  };
}

/** Suma peso (kg), volumen (m³) y cantidad de paquetes a partir de las líneas del carrito. */
export function computeShipment(packages: PackageInfo[]) {
  let totalWeightKg = 0;
  let totalVolumeM3 = 0;
  let packageCount = 0;
  for (const p of packages) {
    const qty = p.quantity || 1;
    const weight = p.weight || DEFAULT_WEIGHT;
    const height = p.height || DEFAULT_DIM;
    const width = p.width || DEFAULT_DIM;
    const length = p.length || DEFAULT_DIM;
    totalWeightKg += weight * qty;
    totalVolumeM3 += (height * width * length) * qty / 1_000_000;
    packageCount += qty;
  }
  return { totalWeightKg, totalVolumeM3, packageCount };
}

/**
 * Extrae la cotización más barata del XML que devuelve Tarifar_Envio_Corporativo.
 * El éxito viene en filas <Table> con Total/PlazoEntrega/Ambito; los errores vienen
 * en filas <Table1><Error>...</Error>. Devuelve null si no hay fila válida.
 */
export function parseOcaQuote(xml: string): OcaQuote | null {
  const rows: OcaQuote[] = [];
  const tableRe = /<Table[^>]*>([\s\S]*?)<\/Table>/g;
  let match: RegExpExecArray | null;
  while ((match = tableRe.exec(xml)) !== null) {
    const block = match[1];
    if (/<Error>[\s\S]*?<\/Error>/.test(block)) continue;
    const total = /<Total>([\d.]+)<\/Total>/.exec(block);
    if (!total) continue;
    const cost = parseFloat(total[1]);
    if (!Number.isFinite(cost)) continue;
    const days = /<PlazoEntrega>(\d+)<\/PlazoEntrega>/.exec(block);
    const ambito = /<Ambito>([^<]+)<\/Ambito>/.exec(block);
    rows.push({
      cost,
      days: days ? parseInt(days[1], 10) : 0,
      ambito: ambito ? ambito[1].trim() : '',
    });
  }
  if (rows.length === 0) return null;
  rows.sort((a, b) => a.cost - b.cost || a.days - b.days);
  return rows[0];
}

/** Cotiza el envío contra el web service de OCA. Devuelve null ante cualquier error. */
export async function quoteOCA(postalCode: string, packages: PackageInfo[], cartSubtotal: number): Promise<OcaQuote | null> {
  const { url, cuit, operativa, originCp } = getOcaConfig();
  if (!cuit || !operativa) return null;

  const { totalWeightKg, totalVolumeM3, packageCount } = computeShipment(packages);
  const params = new URLSearchParams({
    PesoTotal: totalWeightKg.toFixed(3),
    VolumenTotal: totalVolumeM3.toFixed(3),
    CodigoPostalOrigen: originCp,
    CodigoPostalDestino: postalCode,
    CantidadPaquetes: String(packageCount),
    ValorDeclarado: String(Math.round(cartSubtotal)),
    Cuit: cuit,
    Operativa: operativa,
  });

  try {
    const res = await fetch(`${url}?${params}`, {
      headers: { Accept: 'application/xml' },
      signal: AbortSignal.timeout(OCA_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const xml = await res.text();
    return parseOcaQuote(xml);
  } catch {
    return null;
  }
}

async function resolveShipping(postalCode: string, cartSubtotal: number, packages: PackageInfo[]) {
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
  const quote = await quoteOCA(postalCode, packages, cartSubtotal);
  if (quote) {
    return {
      method: 'Envío a domicilio (OCA)',
      days: formatOcaDays(quote.days),
      cost: Math.round(quote.cost),
      source: 'oca',
    };
  }
  return calculateFallback(postalCode);
}

shipping.post('/quote', async (c) => {
  const { postalCode, packages, cartSubtotal } = await c.req.json() as { postalCode: string; packages: PackageInfo[]; cartSubtotal?: unknown };
  if (!postalCode || postalCode.length < 4) {
    c.status(400);
    return c.json({ error: 'Código postal inválido' });
  }
  return c.json(await resolveShipping(postalCode, sanitizeCartSubtotal(cartSubtotal), packages ?? []));
});

export default shipping;
