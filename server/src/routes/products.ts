import { Hono } from 'hono';
import { getDb } from '../db';
import { authMiddleware, adminMiddleware } from '../auth';

const products = new Hono();

interface ProductRow {
  id: string; name: string; description: string; brand: string; category: string;
  subcategory: string; price: number; stock: number; image: string;
  images_json: string; variants_json: string; colors_json: string;
  variant_stock_json: string; featured: number; is_new: number;
  ambientes_json: string;
}

function formatProduct(row: ProductRow) {
  return {
    id: row.id, name: row.name, description: row.description, brand: row.brand,
    category: row.category, subcategory: row.subcategory || undefined,
    price: row.price, stock: row.stock, image: row.image,
    images: JSON.parse(row.images_json || '[]'),
    variants: JSON.parse(row.variants_json || '[]'),
    colors: JSON.parse(row.colors_json || '[]'),
    variantStock: JSON.parse(row.variant_stock_json || '{}'),
    ambientes: JSON.parse(row.ambientes_json || '[]'),
    featured: !!row.featured, isNew: !!row.is_new,
  };
}

products.get('/', (c) => {
  const db = getDb();
  const rows = db.query('SELECT * FROM products ORDER BY id').all() as ProductRow[];
  return c.json(rows.map(formatProduct));
});

products.get('/:id', (c) => {
  const db = getDb();
  const row = db.query('SELECT * FROM products WHERE id = ?').get(c.req.param('id')) as ProductRow | undefined;
  if (!row) { c.status(404); return c.json({ error: 'Producto no encontrado' }); }
  return c.json(formatProduct(row));
});

products.post('/', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json();
  const db = getDb();
  const id = String(Date.now());
  db.run(
    'INSERT INTO products (id, name, description, brand, category, subcategory, price, stock, image, images_json, variants_json, colors_json, variant_stock_json, ambientes_json, featured, is_new) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    id, body.name, body.description || '', body.brand, body.category, body.subcategory || '',
    body.price, body.stock || 0, body.image || '',
    JSON.stringify(body.images || []), JSON.stringify(body.variants || []),
    JSON.stringify(body.colors || []), JSON.stringify(body.variantStock || {}),
    JSON.stringify(body.ambientes || []),
    body.featured ? 1 : 0, body.isNew ? 1 : 0
  );
  const row = db.query('SELECT * FROM products WHERE id = ?').get(id) as ProductRow;
  return c.json(formatProduct(row), 201);
});

products.put('/:id', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json();
  const db = getDb();
  const existing = db.query('SELECT id FROM products WHERE id = ?').get(c.req.param('id'));
  if (!existing) { c.status(404); return c.json({ error: 'Producto no encontrado' }); }
  const fields: string[] = [];
  const vals: any[] = [];
  const map: Record<string, any> = {
    name: body.name, description: body.description, brand: body.brand,
    category: body.category, subcategory: body.subcategory, price: body.price,
    stock: body.stock, image: body.image, featured: body.featured,
    is_new: body.isNew,
  };
  fields.push('images_json = ?'); vals.push(JSON.stringify(body.images ?? []));
  fields.push('variants_json = ?'); vals.push(JSON.stringify(body.variants ?? []));
  fields.push('colors_json = ?'); vals.push(JSON.stringify(body.colors ?? []));
  fields.push('variant_stock_json = ?'); vals.push(JSON.stringify(body.variantStock ?? {}));
  fields.push('ambientes_json = ?'); vals.push(JSON.stringify(body.ambientes ?? []));
  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined) {
      if (k === 'featured' || k === 'is_new') { fields.push(`${k} = ?`); vals.push(v ? 1 : 0); }
      else { fields.push(`${k} = ?`); vals.push(v); }
    }
  }
  fields.push("updated_at = datetime('now')");
  vals.push(c.req.param('id'));
  db.run(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, ...vals);
  const row = db.query('SELECT * FROM products WHERE id = ?').get(c.req.param('id')) as ProductRow;
  return c.json(formatProduct(row));
});

products.delete('/:id', authMiddleware, adminMiddleware, (c) => {
  const db = getDb();
  db.run('DELETE FROM products WHERE id = ?', c.req.param('id'));
  return c.json({ ok: true });
});

export default products;
