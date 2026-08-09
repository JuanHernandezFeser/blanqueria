import type { Env } from '../types';
import { requireAdmin } from '../auth';

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

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
});

export async function handleSpecials(request: Request, env: Env, _ctx: ExecutionContext, path: string, method: string): Promise<Response> {
  // GET /api/specials
  if (method === 'GET' && path === '/api/specials') {
    const { results } = await env.DB.prepare('SELECT * FROM specials ORDER BY created_at DESC').all<SpecialRow>();
    return json(results.map(formatSpecial));
  }

  // POST /api/specials
  if (method === 'POST' && path === '/api/specials') {
    await requireAdmin(request, env);
    const body = await request.json() as { title?: string; productIds?: string[] };
    if (!body.title?.trim()) return json({ error: 'El título es obligatorio' }, 400);
    const id = `special-${Date.now()}`;
    await env.DB.prepare(
      'INSERT INTO specials (id, title, product_ids_json, active) VALUES (?, ?, ?, 0)'
    ).bind(id, body.title.trim(), JSON.stringify(Array.isArray(body.productIds) ? body.productIds : [])).run();
    const row = await env.DB.prepare('SELECT * FROM specials WHERE id = ?').bind(id).first<SpecialRow>();
    return json(formatSpecial(row!), 201);
  }

  // PUT /api/specials/:id
  const specialMatch = path.match(/^\/api\/specials\/([^/]+)$/);
  if (method === 'PUT' && specialMatch) {
    await requireAdmin(request, env);
    const body = await request.json() as { title?: string; productIds?: string[]; active?: boolean };
    const existing = await env.DB.prepare('SELECT id FROM specials WHERE id = ?').bind(specialMatch[1]).first();
    if (!existing) return json({ error: 'Especial no encontrado' }, 404);

    const fields: string[] = [];
    const vals: (string | number)[] = [];
    if (body.title !== undefined) {
      if (!String(body.title).trim()) return json({ error: 'El título es obligatorio' }, 400);
      fields.push('title = ?');
      vals.push(String(body.title).trim());
    }
    if (body.productIds !== undefined) {
      if (!Array.isArray(body.productIds)) return json({ error: 'productIds debe ser un array' }, 400);
      fields.push('product_ids_json = ?');
      vals.push(JSON.stringify(body.productIds));
    }
    if (fields.length > 0) {
      fields.push('updated_at = datetime(\'now\')');
      vals.push(specialMatch[1]);
      await env.DB.prepare(`UPDATE specials SET ${fields.join(', ')} WHERE id = ?`).bind(...vals).run();
    }
    if (body.active !== undefined) {
      const active = body.active === true || body.active === 1;
      if (active) {
        await env.DB.prepare('UPDATE specials SET active = 0').run();
      }
      await env.DB.prepare('UPDATE specials SET active = ? WHERE id = ?').bind(active ? 1 : 0, specialMatch[1]).run();
    }
    const row = await env.DB.prepare('SELECT * FROM specials WHERE id = ?').bind(specialMatch[1]).first<SpecialRow>();
    return json(formatSpecial(row!));
  }

  // DELETE /api/specials/:id
  if (method === 'DELETE' && specialMatch) {
    await requireAdmin(request, env);
    await env.DB.prepare('DELETE FROM specials WHERE id = ?').bind(specialMatch[1]).run();
    return json({ ok: true });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}
