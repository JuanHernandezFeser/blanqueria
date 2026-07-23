import type { Env } from '../types';
import { requireAdmin } from '../auth';

interface ProductRow {
  id: string; name: string; description: string; brand: string; category: string;
  subcategory: string; price: number; stock: number; image: string;
  images_json: string; variants_json: string; colors_json: string;
  variant_stock_json: string; ambientes_json: string; featured: number; is_new: number;
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

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
});

export async function handleProducts(request: Request, env: Env, path: string, method: string): Promise<Response> {
  // GET /api/products
  if (method === 'GET' && path === '/api/products') {
    const { results } = await env.DB.prepare('SELECT * FROM products ORDER BY id').all<ProductRow>();
    return json(results.map(formatProduct));
  }

  // GET /api/products/:id
  const productMatch = path.match(/^\/api\/products\/([^/]+)$/);
  if (method === 'GET' && productMatch) {
    const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(productMatch[1]).first<ProductRow>();
    if (!row) return json({ error: 'Producto no encontrado' }, 404);
    return json(formatProduct(row));
  }

  // POST /api/products
  if (method === 'POST' && path === '/api/products') {
    await requireAdmin(request, env);
    const body = await request.json() as any;
    const id = String(Date.now());
    await env.DB.prepare(
      `INSERT INTO products (id, name, description, brand, category, subcategory, price, stock, image, images_json, variants_json, colors_json, variant_stock_json, ambientes_json, featured, is_new)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, body.name, body.description || '', body.brand, body.category, body.subcategory || '',
      body.price, body.stock || 0, body.image || '',
      JSON.stringify(body.images || []), JSON.stringify(body.variants || []),
      JSON.stringify(body.colors || []), JSON.stringify(body.variantStock || {}),
      JSON.stringify(body.ambientes || []),
      body.featured ? 1 : 0, body.isNew ? 1 : 0
    ).run();
    const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first<ProductRow>();
    return json(formatProduct(row!), 201);
  }

  // PUT /api/products/:id
  if (method === 'PUT' && productMatch) {
    await requireAdmin(request, env);
    const body = await request.json() as any;
    const existing = await env.DB.prepare('SELECT id FROM products WHERE id = ?').bind(productMatch[1]).first();
    if (!existing) return json({ error: 'Producto no encontrado' }, 404);

    const fields: string[] = [];
    const vals: any[] = [];
    const map: Record<string, any> = {
      name: body.name, description: body.description, brand: body.brand,
      category: body.category, subcategory: body.subcategory, price: body.price,
      stock: body.stock, image: body.image,
    };
    fields.push('images_json = ?'); vals.push(JSON.stringify(body.images ?? []));
    fields.push('variants_json = ?'); vals.push(JSON.stringify(body.variants ?? []));
    fields.push('colors_json = ?'); vals.push(JSON.stringify(body.colors ?? []));
    fields.push('variant_stock_json = ?'); vals.push(JSON.stringify(body.variantStock ?? {}));
    fields.push('ambientes_json = ?'); vals.push(JSON.stringify(body.ambientes ?? []));
    for (const [k, v] of Object.entries(map)) {
      if (v !== undefined) { fields.push(`${k} = ?`); vals.push(v); }
    }
    if (body.featured !== undefined) { fields.push('featured = ?'); vals.push(body.featured ? 1 : 0); }
    if (body.isNew !== undefined) { fields.push('is_new = ?'); vals.push(body.isNew ? 1 : 0); }
    fields.push("updated_at = datetime('now')");
    vals.push(productMatch[1]);
    await env.DB.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).bind(...vals).run();
    const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(productMatch[1]).first<ProductRow>();
    return json(formatProduct(row!));
  }

  // DELETE /api/products/:id
  if (method === 'DELETE' && productMatch) {
    await requireAdmin(request, env);
    await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(productMatch[1]).run();
    return json({ ok: true });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}
