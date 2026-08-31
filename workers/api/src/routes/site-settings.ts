import type { Env } from '../types';
import { requireAdmin } from '../auth';

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
});

export async function handleSiteSettings(request: Request, env: Env, _ctx: ExecutionContext, path: string, method: string): Promise<Response> {
  // GET /api/site-settings
  if (method === 'GET' && path === '/api/site-settings') {
    const { results } = await env.DB.prepare('SELECT key, value FROM site_settings').all<{ key: string; value: string }>();
    const settings: Record<string, string> = {};
    for (const row of results) {
      settings[row.key] = row.value;
    }
    return json(settings);
  }

  // GET /api/site-settings/:key
  if (method === 'GET' && path.startsWith('/api/site-settings/')) {
    const key = decodeURIComponent(path.replace('/api/site-settings/', ''));
    const row = await env.DB.prepare('SELECT value FROM site_settings WHERE key = ?').bind(key).first<{ value: string }>();
    return json({ key, value: row?.value ?? null });
  }

  // PUT /api/site-settings/:key
  if (method === 'PUT' && path.startsWith('/api/site-settings/')) {
    await requireAdmin(request, env);
    const key = decodeURIComponent(path.replace('/api/site-settings/', ''));
    const body = await request.json() as { value: string };
    if (!body.value && body.value !== '') return json({ error: 'value is required' }, 400);
    await env.DB.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(key, body.value).run();
    return json({ key, value: body.value });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}
