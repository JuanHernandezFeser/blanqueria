import { Hono } from 'hono';
import { getDb } from '../db';
import { authMiddleware, adminMiddleware } from '../auth';

const specials = new Hono();

interface SpecialRow {
  id: string; title: string; product_ids_json: string; active: number;
}

function formatSpecial(row: SpecialRow) {
  return {
    id: row.id,
    title: row.title,
    productIds: JSON.parse(row.product_ids_json || '[]') as string[],
    active: row.active === 1,
  };
}

specials.get('/', (c) => {
  const db = getDb();
  const rows = db.query('SELECT * FROM specials ORDER BY created_at DESC').all() as SpecialRow[];
  return c.json(rows.map(formatSpecial));
});

specials.post('/', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json();
  if (!body.title?.trim()) { c.status(400); return c.json({ error: 'El título es obligatorio' }); }
  const db = getDb();
  const id = `special-${Date.now()}`;
  db.run('INSERT INTO specials (id, title, product_ids_json, active) VALUES (?, ?, ?, 0)',
    id, body.title.trim(), JSON.stringify(Array.isArray(body.productIds) ? body.productIds : []));
  const row = db.query('SELECT * FROM specials WHERE id = ?').get(id) as SpecialRow;
  return c.json(formatSpecial(row), 201);
});

specials.put('/:id', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json();
  const db = getDb();
  const existing = db.query('SELECT id FROM specials WHERE id = ?').get(c.req.param('id'));
  if (!existing) { c.status(404); return c.json({ error: 'Especial no encontrado' }); }

  const fields: string[] = [];
  const vals: string[] = [];
  if (body.title !== undefined) {
    if (!String(body.title).trim()) { c.status(400); return c.json({ error: 'El título es obligatorio' }); }
    fields.push('title = ?');
    vals.push(String(body.title).trim());
  }
  if (body.productIds !== undefined) {
    if (!Array.isArray(body.productIds)) { c.status(400); return c.json({ error: 'productIds debe ser un array' }); }
    fields.push('product_ids_json = ?');
    vals.push(JSON.stringify(body.productIds));
  }
  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')");
    vals.push(c.req.param('id'));
    db.run(`UPDATE specials SET ${fields.join(', ')} WHERE id = ?`, ...vals);
  }
  if (body.active !== undefined) {
    const active = body.active === true || body.active === 1;
    if (active) db.run('UPDATE specials SET active = 0');
    db.run('UPDATE specials SET active = ? WHERE id = ?', active ? 1 : 0, c.req.param('id'));
  }
  const row = db.query('SELECT * FROM specials WHERE id = ?').get(c.req.param('id')) as SpecialRow;
  return c.json(formatSpecial(row));
});

specials.delete('/:id', authMiddleware, adminMiddleware, (c) => {
  const db = getDb();
  db.run('DELETE FROM specials WHERE id = ?', c.req.param('id'));
  return c.json({ ok: true });
});

export default specials;
