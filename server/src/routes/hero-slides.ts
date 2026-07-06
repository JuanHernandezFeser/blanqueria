import { Hono } from 'hono';
import { getDb } from '../db';
import { authMiddleware, adminMiddleware } from '../auth';

const heroSlides = new Hono();

interface SlideRow {
  id: string; type: string; image: string; product_id: string | null;
  title: string; subtitle: string; link: string; order: number;
}

function formatSlide(row: SlideRow) {
  return { id: row.id, type: row.type, image: row.image, productId: row.product_id, title: row.title, subtitle: row.subtitle, link: row.link, order: row.order };
}

heroSlides.get('/', (c) => {
  const db = getDb();
  const rows = db.query('SELECT * FROM hero_slides ORDER BY "order"').all() as SlideRow[];
  return c.json(rows.map(formatSlide));
});

heroSlides.post('/', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json();
  const db = getDb();
  const id = `hero-${Date.now()}`;
  const maxRow = db.query('SELECT MAX("order") as max_order FROM hero_slides').get() as { max_order: number | null };
  const order = (maxRow.max_order ?? -1) + 1;
  db.run('INSERT INTO hero_slides (id, type, image, product_id, title, subtitle, link, "order") VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    id, body.type || 'image', body.image || '', body.productId || null, body.title || '', body.subtitle || '', body.link || '', order);
  const row = db.query('SELECT * FROM hero_slides WHERE id = ?').get(id) as SlideRow;
  return c.json(formatSlide(row), 201);
});

heroSlides.put('/:id', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json();
  const db = getDb();
  const existing = db.query('SELECT id FROM hero_slides WHERE id = ?').get(c.req.param('id'));
  if (!existing) { c.status(404); return c.json({ error: 'Slide no encontrado' }); }
  const fields: string[] = [];
  const vals: any[] = [];
  if (body.type !== undefined) fields.push('type = ?'), vals.push(body.type);
  if (body.image !== undefined) fields.push('image = ?'), vals.push(body.image);
  if (body.productId !== undefined) fields.push('product_id = ?'), vals.push(body.productId);
  if (body.title !== undefined) fields.push('title = ?'), vals.push(body.title);
  if (body.subtitle !== undefined) fields.push('subtitle = ?'), vals.push(body.subtitle);
  if (body.link !== undefined) fields.push('link = ?'), vals.push(body.link);
  if (fields.length === 0) return c.json({ error: 'Sin cambios' });
  vals.push(c.req.param('id'));
  db.run(`UPDATE hero_slides SET ${fields.join(', ')} WHERE id = ?`, ...vals);
  const row = db.query('SELECT * FROM hero_slides WHERE id = ?').get(c.req.param('id')) as SlideRow;
  return c.json(formatSlide(row));
});

heroSlides.delete('/:id', authMiddleware, adminMiddleware, (c) => {
  const db = getDb();
  db.run('DELETE FROM hero_slides WHERE id = ?', c.req.param('id'));
  return c.json({ ok: true });
});

heroSlides.post('/reorder', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json() as { id: string; order: number }[];
  const db = getDb();
  const stmt = db.prepare('UPDATE hero_slides SET "order" = ? WHERE id = ?');
  for (const item of body) stmt.run(item.order, item.id);
  return c.json({ ok: true });
});

export default heroSlides;
