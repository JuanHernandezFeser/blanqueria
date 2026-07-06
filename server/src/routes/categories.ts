import { Hono } from 'hono';
import { getDb } from '../db';
import { authMiddleware, adminMiddleware } from '../auth';

const categories = new Hono();

interface CategoryRow {
  name: string; image: string; description: string; subcategories_json: string;
}

const PLACEHOLDER_CATEGORY = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22750%22 viewBox=%220 0 600 750%22%3E%3Crect width=%22600%22 height=%22750%22 fill=%22%23e5e7eb%22/%3E%3Ctext x=%22300%22 y=%22375%22 text-anchor=%22middle%22 dominant-baseline=%22central%22 font-family=%22sans-serif%22 font-size=%2224%22 fill=%22%23999%22%3EPor definir%3C/text%3E%3C/svg%3E';

function formatCategory(row: CategoryRow) {
  const db = getDb();
  const product = db.query('SELECT image FROM products WHERE category = ? LIMIT 1').get(row.name) as { image?: string } | undefined;
  const image = product?.image || PLACEHOLDER_CATEGORY;
  return { name: row.name, image, description: row.description, subcategories: JSON.parse(row.subcategories_json || '[]') };
}

categories.get('/', (c) => {
  const db = getDb();
  const rows = db.query('SELECT * FROM categories ORDER BY name').all() as CategoryRow[];
  return c.json(rows.map(formatCategory));
});

categories.post('/', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json();
  const db = getDb();
  const existing = db.query('SELECT name FROM categories WHERE name = ?').get(body.name);
  if (existing) { c.status(409); return c.json({ error: 'La categoría ya existe' }); }
  db.run('INSERT INTO categories (name, image, description, subcategories_json) VALUES (?, ?, ?, ?)',
    body.name, body.image || '', body.description || '', JSON.stringify(body.subcategories || []));
  const row = db.query('SELECT * FROM categories WHERE name = ?').get(body.name) as CategoryRow;
  return c.json(formatCategory(row), 201);
});

categories.put('/:name', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json();
  const db = getDb();
  const oldName = c.req.param('name');
  const existing = db.query('SELECT name FROM categories WHERE name = ?').get(oldName);
  if (!existing) { c.status(404); return c.json({ error: 'Categoría no encontrada' }); }
  const fields: string[] = [];
  const vals: any[] = [];
  if (body.name !== undefined) fields.push('name = ?'), vals.push(body.name);
  if (body.image !== undefined) fields.push('image = ?'), vals.push(body.image);
  if (body.description !== undefined) fields.push('description = ?'), vals.push(body.description);
  if (body.subcategories !== undefined) fields.push('subcategories_json = ?'), vals.push(JSON.stringify(body.subcategories));
  if (fields.length === 0) return c.json({ error: 'Sin cambios' });
  vals.push(oldName);
  db.run(`UPDATE categories SET ${fields.join(', ')} WHERE name = ?`, ...vals);
  const newName = body.name || oldName;
  const row = db.query('SELECT * FROM categories WHERE name = ?').get(newName) as CategoryRow;
  return c.json(formatCategory(row));
});

categories.delete('/:name', authMiddleware, adminMiddleware, (c) => {
  const db = getDb();
  db.run('DELETE FROM categories WHERE name = ?', c.req.param('name'));
  return c.json({ ok: true });
});

export default categories;
