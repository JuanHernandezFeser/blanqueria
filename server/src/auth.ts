import { Context, Next } from 'hono';
import { getDb } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'blanqueria-secret-key-change-in-production';

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

async function encodeBase64Url(data: ArrayBuffer): Promise<string> {
  const uint8 = new Uint8Array(data);
  const binary = String.fromCharCode(...uint8);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function decodeBase64Url(str: string): Promise<Uint8Array> {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const uint8 = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) uint8[i] = binary.charCodeAt(i);
  return uint8;
}

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyData = enc.encode(JWT_SECRET.padEnd(32, ' ').slice(0, 32));
  return crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signToken(payload: JwtPayload): Promise<string> {
  const key = await getKey();
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerStr = await encodeBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadStr = await encodeBase64Url(new TextEncoder().encode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 86400 })));
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${headerStr}.${payloadStr}`));
  const sigStr = await encodeBase64Url(signature);
  return `${headerStr}.${payloadStr}.${sigStr}`;
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const key = await getKey();
    const valid = await crypto.subtle.verify('HMAC', key, await decodeBase64Url(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(await decodeBase64Url(parts[1])));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { id: payload.id, email: payload.email, name: payload.name, isAdmin: payload.isAdmin };
  } catch {
    return null;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    c.status(401);
    return c.json({ error: 'Se requiere autenticación' });
  }
  const payload = await verifyToken(auth.slice(7));
  if (!payload) {
    c.status(401);
    return c.json({ error: 'Token inválido o expirado' });
  }
  c.set('user', payload);
  await next();
}

export async function adminMiddleware(c: Context, next: Next) {
  const user = c.get('user') as JwtPayload;
  if (!user?.isAdmin) {
    c.status(403);
    return c.json({ error: 'Se requieren permisos de administrador' });
  }
  await next();
}
