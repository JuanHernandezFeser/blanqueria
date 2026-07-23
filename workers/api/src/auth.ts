import type { Env, JwtPayload } from './types';

function base64UrlEncode(data: ArrayBuffer): string {
  const uint8 = new Uint8Array(data);
  const binary = String.fromCharCode(...uint8);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const uint8 = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) uint8[i] = binary.charCodeAt(i);
  return uint8;
}

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyData = enc.encode(secret.padEnd(32, ' ').slice(0, 32));
  return crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signToken(payload: JwtPayload, secret: string): Promise<string> {
  const key = await getKey(secret);
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerStr = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadStr = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 86400 })));
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${headerStr}.${payloadStr}`));
  const sigStr = base64UrlEncode(signature);
  return `${headerStr}.${payloadStr}.${sigStr}`;
}

export async function verifyToken(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const key = await getKey(secret);
    const valid = await crypto.subtle.verify('HMAC', key, base64UrlDecode(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { id: payload.id, email: payload.email, name: payload.name, isAdmin: payload.isAdmin };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const saltStr = base64UrlEncode(salt.buffer);
  const hashStr = base64UrlEncode(hash);
  return `pbkdf2:sha256:100000:${saltStr}:${hashStr}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':');
  if (parts[0] !== 'pbkdf2') return false;
  const iterations = parseInt(parts[2]);
  const salt = base64UrlDecode(parts[3]);
  const expectedHash = parts[4];

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const hashStr = base64UrlEncode(hash);
  return hashStr === expectedHash;
}

export async function authenticate(request: Request, env: Env): Promise<JwtPayload | null> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7), env.JWT_SECRET);
}

export async function requireAuth(request: Request, env: Env): Promise<JwtPayload> {
  const user = await authenticate(request, env);
  if (!user) throw new Response(JSON.stringify({ error: 'Se requiere autenticación' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  return user;
}

export async function requireAdmin(request: Request, env: Env): Promise<JwtPayload> {
  const user = await requireAuth(request, env);
  if (!user.isAdmin) throw new Response(JSON.stringify({ error: 'Se requieren permisos de administrador' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  return user;
}
