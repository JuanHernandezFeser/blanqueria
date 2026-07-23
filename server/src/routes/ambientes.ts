import { Hono } from 'hono';
import { getDb } from '../db';
import { authMiddleware, adminMiddleware } from '../auth';

const ambientes = new Hono();

interface AmbienteRow {
  name: string; image: string; description: string;
}

ambientes.get('/', (c) => {
  const db = getDb();
  const rows = db.query('SELECT * FROM ambientes ORDER BY name').all() as AmbienteRow[];
  return c.json(rows);
});

ambientes.post('/', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json();
  const db = getDb();
  const existing = db.query('SELECT name FROM ambientes WHERE name = ?').get(body.name);
  if (existing) { c.status(409); return c.json({ error: 'El ambiente ya existe' }); }
  db.run('INSERT INTO ambientes (name, image, description) VALUES (?, ?, ?)',
    body.name, body.image || '', body.description || '');
  const row = db.query('SELECT * FROM ambientes WHERE name = ?').get(body.name) as AmbienteRow;
  return c.json(row, 201);
});

ambientes.put('/:name', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json();
  const db = getDb();
  const oldName = c.req.param('name');
  const existing = db.query('SELECT name FROM ambientes WHERE name = ?').get(oldName);
  if (!existing) { c.status(404); return c.json({ error: 'Ambiente no encontrado' }); }
  const fields: string[] = [];
  const vals: any[] = [];
  if (body.name !== undefined) fields.push('name = ?'), vals.push(body.name);
  if (body.image !== undefined) fields.push('image = ?'), vals.push(body.image);
  if (body.description !== undefined) fields.push('description = ?'), vals.push(body.description);
  if (fields.length === 0) return c.json({ error: 'Sin cambios' });
  vals.push(oldName);
  db.run(`UPDATE ambientes SET ${fields.join(', ')} WHERE name = ?`, ...vals);
  const newName = body.name || oldName;
  const row = db.query('SELECT * FROM ambientes WHERE name = ?').get(newName) as AmbienteRow;
  return c.json(row);
});

ambientes.delete('/:name', authMiddleware, adminMiddleware, (c) => {
  const db = getDb();
  db.run('DELETE FROM ambientes WHERE name = ?', c.req.param('name'));
  return c.json({ ok: true });
});

export default ambientes;
