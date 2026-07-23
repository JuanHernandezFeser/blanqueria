import type { Env } from '../types';
import { requireAdmin } from '../auth';

interface CategoryRow {
  name: string; image: string; description: string; subcategories_json: string;
}

const PLACEHOLDER_CATEGORY = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22750%22 viewBox=%220 0 600 750%22%3E%3Crect width=%22600%22 height=%22750%22 fill=%22%23e5e7eb%22/%3E%3Ctext x=%22300%22 y=%22375%22 text-anchor=%22middle%22 dominant-baseline=%22central%22 font-family=%22sans-serif%22 font-size=%2224%22 fill=%22%23999%22%3EPor definir%3C/text%3E%3C/svg%3E';

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
});

async function formatCategory(db: D1Database, row: CategoryRow) {
  const product = await db.prepare('SELECT image FROM products WHERE category = ? LIMIT 1').bind(row.name).first<{ image?: string }>();
  const image = product?.image || PLACEHOLDER_CATEGORY;
  return { name: row.name, image, description: row.description, subcategories: JSON.parse(row.subcategories_json || '[]') };
}

export async function handleCategories(request: Request, env: Env, path: string, method: string): Promise<Response> {
  // GET /api/categories
  if (method === 'GET' && path === '/api/categories') {
    const { results } = await env.DB.prepare('SELECT * FROM categories ORDER BY name').all<CategoryRow>();
    const formatted = await Promise.all(results.map(r => formatCategory(env.DB, r)));
    return json(formatted);
  }

  // POST /api/categories
  if (method === 'POST' && path === '/api/categories') {
    await requireAdmin(request, env);
    const body = await request.json() as any;
    const existing = await env.DB.prepare('SELECT name FROM categories WHERE name = ?').bind(body.name).first();
    if (existing) return json({ error: 'La categoría ya existe' }, 409);
    await env.DB.prepare('INSERT INTO categories (name, image, description, subcategories_json) VALUES (?, ?, ?, ?)').bind(
      body.name, body.image || '', body.description || '', JSON.stringify(body.subcategories || [])
    ).run();
    const row = await env.DB.prepare('SELECT * FROM categories WHERE name = ?').bind(body.name).first<CategoryRow>();
    return json(await formatCategory(env.DB, row!), 201);
  }

  // PUT /api/categories/:name
  const catMatch = path.match(/^\/api\/categories\/([^/]+)$/);
  if (method === 'PUT' && catMatch) {
    await requireAdmin(request, env);
    const body = await request.json() as any;
    const oldName = decodeURIComponent(catMatch[1]);
    const existing = await env.DB.prepare('SELECT name FROM categories WHERE name = ?').bind(oldName).first();
    if (!existing) return json({ error: 'Categoría no encontrada' }, 404);
    const fields: string[] = [];
    const vals: any[] = [];
    if (body.name !== undefined) fields.push('name = ?'), vals.push(body.name);
    if (body.image !== undefined) fields.push('image = ?'), vals.push(body.image);
    if (body.description !== undefined) fields.push('description = ?'), vals.push(body.description);
    if (body.subcategories !== undefined) fields.push('subcategories_json = ?'), vals.push(JSON.stringify(body.subcategories));
    if (fields.length === 0) return json({ error: 'Sin cambios' });
    vals.push(oldName);
    await env.DB.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE name = ?`).bind(...vals).run();
    const newName = body.name || oldName;
    const row = await env.DB.prepare('SELECT * FROM categories WHERE name = ?').bind(newName).first<CategoryRow>();
    return json(await formatCategory(env.DB, row!));
  }

  // DELETE /api/categories/:name
  if (method === 'DELETE' && catMatch) {
    await requireAdmin(request, env);
    await env.DB.prepare('DELETE FROM categories WHERE name = ?').bind(decodeURIComponent(catMatch[1])).run();
    return json({ ok: true });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}
