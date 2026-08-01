// TEMPORAL - Diagnóstico de credenciales MiCorreo (Correo Argentino).
// NO toca el flujo productivo: solo valida credenciales contra TEST y PROD.
//
// Uso (necesita las credenciales, se leen de env):
//   MICORREO_EMAIL=<email> MICORREO_PASSWORD=<pass> MICORREO_CUSTOMER_ID=<id> \
//     bun workers/api/scripts/micorreo-diag.ts
//   (o: MICORREO_EMAIL=... bun --env-file=.env.micorreo workers/api/scripts/micorreo-diag.ts)
//
// Flujo por ambiente:
//   1) POST /token        (Basic auth con email:password) -> JWT
//   2) POST /users/validate (Bearer + {email,password})  -> customerId
//   3) POST /rates        (Bearer + customerId + caso de prueba) -> tarifas

const BASES: Record<string, string> = {
  TEST: 'https://apitest.correoargentino.com.ar/micorreo/v1',
  PROD: 'https://api.correoargentino.com.ar/micorreo/v1',
};

const email = process.env.MICORREO_EMAIL;
const password = process.env.MICORREO_PASSWORD;
const expectedCustomerId = process.env.MICORREO_CUSTOMER_ID;

if (!email || !password) {
  console.error('Faltan MICORREO_EMAIL y/o MICORREO_PASSWORD');
  process.exit(1);
}

const RATES_PAYLOAD = {
  postalCodeOrigin: '8000',
  postalCodeDestination: '1704',
  deliveredType: 'D',
  dimensions: { weight: 1000, height: 10, width: 15, length: 20 },
};

interface CallResult {
  status: number;
  statusText: string;
  body: string;
  json: Record<string, unknown> | null;
}

async function post(
  url: string,
  opts: { basic?: string; token?: string; body?: unknown } = {}
): Promise<CallResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.basic) headers.Authorization = `Basic ${Buffer.from(opts.basic).toString('base64')}`;
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: opts.body === undefined ? '{}' : JSON.stringify(opts.body),
  });
  const text = await res.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* no JSON */
  }
  return { status: res.status, statusText: res.statusText, body: text, json };
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const part = token.split('.')[1];
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(Buffer.from(pad, 'base64').toString('utf8')) as Record<string, unknown>;
  } catch (e) {
    return { decodeError: String(e) };
  }
}

async function runEnvironment(name: string): Promise<void> {
  const base = BASES[name];
  console.log(`\n========================================`);
  console.log(`== ${name}  ${base}`);
  console.log(`========================================`);
  console.log(`email: ${email}`);
  console.log(`expected customerId (MICORREO_CUSTOMER_ID): ${expectedCustomerId ?? '(no seteado)'}`);

  // ---- 1) token ----
  console.log('\n[1] POST /token  (Authorization: Basic email:password, body {})');
  let tok = await post(`${base}/token`, { basic: `${email}:${password}` });
  console.log(`  status: ${tok.status} ${tok.statusText}`);
  console.log(`  body: ${tok.body}`);

  if (tok.status !== 200 && tok.status !== 201) {
    console.log('\n[1b] POST /token  (intento alternativo: body JSON {email, password}, sin Basic)');
    tok = await post(`${base}/token`, { body: { email, password } });
    console.log(`  status: ${tok.status} ${tok.statusText}`);
    console.log(`  body: ${tok.body}`);
  }

  const token = String(tok.json?.token ?? tok.json?.access_token ?? '');
  if (!token) {
    console.log('  >> No se obtuvo token. Aborto este ambiente.');
    return;
  }

  const claims = decodeJwtPayload(token);
  const expNum = Number(claims.exp ?? 0);
  const iatNum = Number(claims.iat ?? 0);
  const expIso = expNum ? new Date(expNum * 1000).toISOString() : undefined;
  const ttlMin = expNum && iatNum ? Math.round((expNum - iatNum) / 60) : undefined;
  console.log(`  token OK (longitud ${token.length} chars)`);
  console.log(`  claims JWT: ${JSON.stringify({ ...claims, exp: expIso ?? claims.exp })}`);
  console.log(`  exp JWT: ${expIso ?? 'n/a'}  |  TTL aprox: ${ttlMin ?? 'n/a'} min`);
  console.log(`  campo "expires" del response: ${String(tok.json?.expires ?? 'n/a')}`);

  // ---- 2) users/validate ----
  console.log('\n[2] POST /users/validate  (Bearer + body {email, password})');
  const val = await post(`${base}/users/validate`, { token, body: { email, password } });
  console.log(`  status: ${val.status} ${val.statusText}`);
  console.log(`  body: ${val.body}`);

  const customerId = String(val.json?.customerId ?? '');
  if (customerId) {
    console.log(`  customerId devuelto: ${customerId}`);
    console.log(
      expectedCustomerId
        ? `  coincide con MICORREO_CUSTOMER_ID? ${customerId === expectedCustomerId ? 'SI' : `NO (esperado: ${expectedCustomerId})`}`
        : '  (no se puede comparar: falta MICORREO_CUSTOMER_ID)'
    );
  } else {
    console.log('  >> No se obtuvo customerId.');
  }

  const cid = customerId || expectedCustomerId;
  if (!cid) {
    console.log('  >> Sin customerId. Aborto antes de /rates.');
    return;
  }

  // ---- 3) rates ----
  console.log(`\n[3] POST /rates  (Bearer, customerId=${cid})`);
  const ratesPayload = { customerId: cid, ...RATES_PAYLOAD };
  console.log(`  payload: ${JSON.stringify(ratesPayload)}`);
  const rates = await post(`${base}/rates`, { token, body: ratesPayload });
  console.log(`  status: ${rates.status} ${rates.statusText}`);
  console.log(`  body: ${rates.body}`);
}

(async () => {
  for (const name of ['TEST', 'PROD']) {
    try {
      await runEnvironment(name);
    } catch (e) {
      console.error(`Error en ${name}:`, e);
    }
  }
})();
