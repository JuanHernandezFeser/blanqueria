import { Hono } from 'hono';
import { getDb } from '../db';
import { signToken, authMiddleware } from '../auth';

const auth = new Hono();

auth.post('/register', async (c) => {
  const { name, email, password, phone, address, locality, province, postalCode } = await c.req.json();
  if (!email?.includes('@') || !password || password.length < 4 || !name) {
    c.status(400);
    return c.json({ error: 'Datos inválidos. Email válido, password (4+ caracteres) y nombre requeridos.' });
  }
  const db = getDb();
  const existing = db.query('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    c.status(409);
    return c.json({ error: 'El email ya está registrado' });
  }
  const id = `usr-${Date.now()}`;
  const hash = await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 });
  db.run('INSERT INTO users (id, email, password_hash, name, is_admin, phone, address, locality, province, postal_code) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?)', [id, email, hash, name, phone || '', address || '', locality || '', province || '', postalCode || '']);
  const token = await signToken({ id, email, name, isAdmin: false });
  return c.json({ token, user: { email, name, isAdmin: false, phone: phone || '', address: address || '', locality: locality || '', province: province || '', postalCode: postalCode || '' } }, 201);
});

auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  if (!email || !password) {
    c.status(400);
    return c.json({ error: 'Email y password requeridos' });
  }
  const db = getDb();
  const user = db.query('SELECT id, email, password_hash, name, is_admin FROM users WHERE email = ?').get(email) as { id: string; email: string; password_hash: string; name: string; is_admin: number } | undefined;
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
  const row = db.query('SELECT email, name, is_admin, phone, address, locality, province, postal_code FROM users WHERE id = ?').get(jwt.id) as { email: string; name: string; is_admin: number; phone: string; address: string; locality: string; province: string; postal_code: string } | undefined;
  if (!row) { c.status(404); return c.json({ error: 'Usuario no encontrado' }); }
  return c.json({ email: row.email, name: row.name, isAdmin: !!row.is_admin, phone: row.phone, address: row.address, locality: row.locality, province: row.province, postalCode: row.postal_code });
});

export default auth;
