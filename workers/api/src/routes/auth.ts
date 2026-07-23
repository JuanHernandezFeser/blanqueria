import type { Env } from '../types';
import { signToken, requireAuth, hashPassword, verifyPassword } from '../auth';
import { sendVerificationEmail } from '../mail';

export async function handleAuth(request: Request, env: Env, path: string, method: string): Promise<Response> {
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });

  // POST /api/auth/register
  if (method === 'POST' && path === '/api/auth/register') {
    const { email, password } = await request.json() as { email: string; password: string };
    if (!email?.includes('@') || !password || password.length < 4) {
      return json({ error: 'Email válido y password (4+ caracteres) requeridos.' }, 400);
    }
    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) return json({ error: 'El email ya está registrado' }, 409);

    const id = `usr-${Date.now()}`;
    const hash = await hashPassword(password);
    const verificationToken = crypto.randomUUID();
    const name = email.split('@')[0];

    await env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, name, is_admin, email_verified, verification_token) VALUES (?, ?, ?, ?, 0, 1, ?)'
    ).bind(id, email, hash, name, verificationToken).run();

    const token = await signToken({ id, email, name, isAdmin: false }, env.JWT_SECRET);
    sendVerificationEmail(env, email, name, verificationToken);
    return json({ token, user: { email, name, isAdmin: false } }, 201);
  }

  // POST /api/auth/login
  if (method === 'POST' && path === '/api/auth/login') {
    const { email, password } = await request.json() as { email: string; password: string };
    if (!email || !password) return json({ error: 'Email y password requeridos' }, 400);

    const user = await env.DB.prepare(
      'SELECT id, email, password_hash, name, is_admin FROM users WHERE email = ?'
    ).bind(email).first<{ id: string; email: string; password_hash: string; name: string; is_admin: number }>();

    if (!user) return json({ error: 'Credenciales inválidas' }, 401);
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return json({ error: 'Credenciales inválidas' }, 401);

    const token = await signToken({ id: user.id, email: user.email, name: user.name, isAdmin: !!user.is_admin }, env.JWT_SECRET);
    return json({ token, user: { email: user.email, name: user.name, isAdmin: !!user.is_admin } });
  }

  // GET /api/auth/me
  if (method === 'GET' && path === '/api/auth/me') {
    const jwt = await requireAuth(request, env);
    const row = await env.DB.prepare(
      'SELECT email, name, is_admin, phone, address, locality, province, postal_code, email_verified FROM users WHERE id = ?'
    ).bind(jwt.id).first<{ email: string; name: string; is_admin: number; phone: string; address: string; locality: string; province: string; postal_code: string; email_verified: number }>();
    if (!row) return json({ error: 'Usuario no encontrado' }, 404);
    return json({
      email: row.email, name: row.name, isAdmin: !!row.is_admin,
      phone: row.phone, address: row.address, locality: row.locality,
      province: row.province, postalCode: row.postal_code, emailVerified: !!row.email_verified,
    });
  }

  // PUT /api/auth/profile
  if (method === 'PUT' && path === '/api/auth/profile') {
    const jwt = await requireAuth(request, env);
    const { name, phone, address, locality, province, postalCode } = await request.json();
    await env.DB.prepare(
      'UPDATE users SET name = ?, phone = ?, address = ?, locality = ?, province = ?, postal_code = ? WHERE id = ?'
    ).bind(name || '', phone || '', address || '', locality || '', province || '', postalCode || '', jwt.id).run();
    return json({ message: 'Perfil actualizado' });
  }

  // POST /api/auth/verify-email
  if (method === 'POST' && path === '/api/auth/verify-email') {
    const { token } = await request.json() as { token: string };
    if (!token) return json({ error: 'Token requerido' }, 400);
    const user = await env.DB.prepare('SELECT id FROM users WHERE verification_token = ?').bind(token).first<{ id: string }>();
    if (!user) return json({ error: 'Token inválido o expirado' }, 400);
    await env.DB.prepare("UPDATE users SET email_verified = 1, verification_token = '' WHERE id = ?").bind(user.id).run();
    return json({ message: 'Email verificado correctamente' });
  }

  // POST /api/auth/resend-verification
  if (method === 'POST' && path === '/api/auth/resend-verification') {
    const { email } = await request.json() as { email: string };
    if (!email) return json({ error: 'Email requerido' }, 400);
    const user = await env.DB.prepare('SELECT id, name, email_verified FROM users WHERE email = ?').bind(email).first<{ id: string; name: string; email_verified: number }>();
    if (!user) return json({ error: 'No se encontró una cuenta con ese email' }, 404);
    if (user.email_verified) return json({ error: 'Este email ya está verificado' }, 400);
    const newToken = crypto.randomUUID();
    await env.DB.prepare('UPDATE users SET verification_token = ? WHERE id = ?').bind(newToken, user.id).run();
    await sendVerificationEmail(env, email, user.name, newToken);
    return json({ message: 'Email de verificación reenviado' });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}
