import type { Env } from '../types';
import { requireAdmin } from '../auth';

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
});

export async function handleAmbientes(request: Request, env: Env, path: string, method: string): Promise<Response> {
  // GET /api/ambientes
  if (method === 'GET' && path === '/api/ambientes') {
    const { results } = await env.DB.prepare('SELECT * FROM ambientes ORDER BY name').all();
    return json(results);
  }

  // POST /api/ambientes
  if (method === 'POST' && path === '/api/ambientes') {
    await requireAdmin(request, env);
    const body = await request.json() as any;
    const existing = await env.DB.prepare('SELECT name FROM ambientes WHERE name = ?').bind(body.name).first();
    if (existing) return json({ error: 'El ambiente ya existe' }, 409);
    await env.DB.prepare('INSERT INTO ambientes (name, image, description) VALUES (?, ?, ?)').bind(
      body.name, body.image || '', body.description || ''
    ).run();
    const row = await env.DB.prepare('SELECT * FROM ambientes WHERE name = ?').bind(body.name).first();
    return json(row, 201);
  }

  // PUT /api/ambientes/:name
  const ambMatch = path.match(/^\/api\/ambientes\/([^/]+)$/);
  if (method === 'PUT' && ambMatch) {
    await requireAdmin(request, env);
    const body = await request.json() as any;
    const oldName = decodeURIComponent(ambMatch[1]);
    const existing = await env.DB.prepare('SELECT name FROM ambientes WHERE name = ?').bind(oldName).first();
    if (!existing) return json({ error: 'Ambiente no encontrado' }, 404);
    const fields: string[] = [];
    const vals: any[] = [];
    if (body.name !== undefined) fields.push('name = ?'), vals.push(body.name);
    if (body.image !== undefined) fields.push('image = ?'), vals.push(body.image);
    if (body.description !== undefined) fields.push('description = ?'), vals.push(body.description);
    if (fields.length === 0) return json({ error: 'Sin cambios' });
    vals.push(oldName);
    await env.DB.prepare(`UPDATE ambientes SET ${fields.join(', ')} WHERE name = ?`).bind(...vals).run();
    const newName = body.name || oldName;
    const row = await env.DB.prepare('SELECT * FROM ambientes WHERE name = ?').bind(newName).first();
    return json(row);
  }

  // DELETE /api/ambientes/:name
  if (method === 'DELETE' && ambMatch) {
    await requireAdmin(request, env);
    await env.DB.prepare('DELETE FROM ambientes WHERE name = ?').bind(decodeURIComponent(ambMatch[1])).run();
    return json({ ok: true });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}
