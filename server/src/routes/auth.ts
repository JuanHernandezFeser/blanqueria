import { Hono } from 'hono';
import { getDb } from '../db';
import { signToken, authMiddleware } from '../auth';
import { sendVerificationEmail } from '../mail';

const auth = new Hono();

auth.post('/register', async (c) => {
  const { email, password } = await c.req.json();
  if (!email?.includes('@') || !password || password.length < 4) {
    c.status(400);
    return c.json({ error: 'Email válido y password (4+ caracteres) requeridos.' });
  }
  const db = getDb();
  const existing = db.query('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    c.status(409);
    return c.json({ error: 'El email ya está registrado' });
  }
  const id = `usr-${Date.now()}`;
  const hash = await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 });
  const verificationToken = crypto.randomUUID();
  db.run(
    'INSERT INTO users (id, email, password_hash, name, is_admin, email_verified, verification_token) VALUES (?, ?, ?, ?, 0, 1, ?)',
    [id, email, hash, email.split('@')[0], verificationToken]
  );
  const token = await signToken({ id, email, name: email.split('@')[0], isAdmin: false });
  sendVerificationEmail(email, email.split('@')[0], verificationToken);
  return c.json({ token, user: { email, name: email.split('@')[0], isAdmin: false } }, 201);
});

auth.post('/verify-email', async (c) => {
  const { token } = await c.req.json();
  if (!token) {
    c.status(400);
    return c.json({ error: 'Token requerido' });
  }
  const db = getDb();
  const user = db.query('SELECT id FROM users WHERE verification_token = ?').get(token) as { id: string } | undefined;
  if (!user) {
    c.status(400);
    return c.json({ error: 'Token inválido o expirado' });
  }
  db.run('UPDATE users SET email_verified = 1, verification_token = \'\' WHERE id = ?', [user.id]);
  return c.json({ message: 'Email verificado correctamente' });
});

auth.post('/resend-verification', async (c) => {
  const { email } = await c.req.json();
  if (!email) {
    c.status(400);
    return c.json({ error: 'Email requerido' });
  }
  const db = getDb();
  const user = db.query('SELECT id, name, email_verified FROM users WHERE email = ?').get(email) as { id: string; name: string; email_verified: number } | undefined;
  if (!user) {
    c.status(404);
    return c.json({ error: 'No se encontró una cuenta con ese email' });
  }
  if (user.email_verified) {
    c.status(400);
    return c.json({ error: 'Este email ya está verificado' });
  }
  const newToken = crypto.randomUUID();
  db.run('UPDATE users SET verification_token = ? WHERE id = ?', [newToken, user.id]);
  await sendVerificationEmail(email, user.name, newToken);
  return c.json({ message: 'Email de verificación reenviado' });
});

auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  if (!email || !password) {
    c.status(400);
    return c.json({ error: 'Email y password requeridos' });
  }
  const db = getDb();
  const user = db.query('SELECT id, email, password_hash, name, is_admin, email_verified FROM users WHERE email = ?').get(email) as { id: string; email: string; password_hash: string; name: string; is_admin: number; email_verified: number } | undefined;
  if (!user) {
    c.status(401);
    return c.json({ error: 'Credenciales inválidas' });
  }
  const valid = await Bun.password.verify(password, user.password_hash);
  if (!valid) {
    c.status(401);
    return c.json({ error: 'Credenciales inválidas' });
  }
  const token = await signToken({ id: user.id, email: user.email, name: user.name, isAdmin: !!user.is_admin });
  return c.json({ token, user: { email: user.email, name: user.name, isAdmin: !!user.is_admin } });
});

auth.get('/me', authMiddleware, async (c) => {
  const jwt = c.get('user');
  const db = getDb();
  const row = db.query('SELECT email, name, is_admin, phone, address, locality, province, postal_code, email_verified FROM users WHERE id = ?').get(jwt.id) as { email: string; name: string; is_admin: number; phone: string; address: string; locality: string; province: string; postal_code: string; email_verified: number } | undefined;
  if (!row) { c.status(404); return c.json({ error: 'Usuario no encontrado' }); }
  return c.json({ email: row.email, name: row.name, isAdmin: !!row.is_admin, phone: row.phone, address: row.address, locality: row.locality, province: row.province, postalCode: row.postal_code, emailVerified: !!row.email_verified });
});

auth.put('/profile', authMiddleware, async (c) => {
  const jwt = c.get('user');
  const { name, phone, address, locality, province, postalCode } = await c.req.json();
  const db = getDb();
  db.run(
    'UPDATE users SET name = ?, phone = ?, address = ?, locality = ?, province = ?, postal_code = ? WHERE id = ?',
    [name || '', phone || '', address || '', locality || '', province || '', postalCode || '', jwt.id]
  );
  return c.json({ message: 'Perfil actualizado' });
});

export default auth;
