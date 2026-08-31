import type { Env } from '../types';

const MICORREO_BASE = 'https://api.correoargentino.com.ar/micorreo/v1';
const TOKEN_MARGIN_MS = 5 * 60 * 1000;

async function ensureCacheTable(db: D1Database): Promise<void> {
  await db
    .prepare(
      'CREATE TABLE IF NOT EXISTS micorreo_token_cache (id INTEGER PRIMARY KEY, token TEXT NOT NULL, expires_at TEXT NOT NULL)'
    )
    .run();
}

export async function getMicorreoToken(env: Env): Promise<string> {
  await ensureCacheTable(env.DB);

  const cached = await env.DB.prepare(
    'SELECT token, expires_at FROM micorreo_token_cache WHERE id = 1'
  ).first<{ token: string; expires_at: string }>();

  if (cached) {
    const expiresAt = new Date(cached.expires_at).getTime();
    if (Date.now() < expiresAt - TOKEN_MARGIN_MS) {
      return cached.token;
    }
  }

  const credentials = btoa(
    `${env.MICORREO_EMAIL}:${env.MICORREO_PASSWORD}`
  );

  const res = await fetch(`${MICORREO_BASE}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    },
    body: '{}',
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `MiCorreo token error ${res.status}: ${body}`
    );
  }

  const data = (await res.json()) as {
    token?: string;
    access_token?: string;
    expires?: string;
  };

  const token = data.token || data.access_token;
  if (!token) {
    throw new Error('MiCorreo: no se obtuvo token en la respuesta');
  }

  let expiresAt: string;
  if (data.expires) {
    expiresAt = data.expires;
  } else {
    const payload = decodeJwtPayload(token);
    const exp = typeof payload.exp === 'number' ? payload.exp : 0;
    expiresAt = exp
      ? new Date(exp * 1000).toISOString()
      : new Date(Date.now() + 3600_000).toISOString();
  }

  await env.DB.prepare(
    'INSERT OR REPLACE INTO micorreo_token_cache (id, token, expires_at) VALUES (1, ?, ?)'
  )
    .bind(token, expiresAt)
    .run();

  return token;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const part = token.split('.')[1];
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(pad)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

interface ShippingQuoteParams {
  destinationCp: string;
  weightGrams: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
}

export async function getShippingQuote(
  env: Env,
  params: ShippingQuoteParams
): Promise<number> {
  const token = await getMicorreoToken(env);

  const res = await fetch(`${MICORREO_BASE}/rates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      customerId: env.MICORREO_CUSTOMER_ID,
      postalCodeOrigin: '8000',
      postalCodeDestination: params.destinationCp,
      deliveredType: 'D',
      dimensions: {
        weight: params.weightGrams,
        height: params.heightCm,
        width: params.widthCm,
        length: params.lengthCm,
      },
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `MiCorreo rates error ${res.status}: ${body}`
    );
  }

  const data = (await res.json()) as {
    error?: string;
    rates?: Array<{ price?: number; cost?: number }>;
  };

  if (data.error) {
    throw new Error(`MiCorreo: ${data.error}`);
  }

  if (!data.rates || data.rates.length === 0) {
    throw new Error('MiCorreo: no se obtuvieron tarifas para este destino');
  }

  const rate = data.rates[0];
  const price = rate.price ?? rate.cost;

  if (price == null || !Number.isFinite(price)) {
    throw new Error('MiCorreo: tarifa inválida en la respuesta');
  }

  return Math.round(price);
}
