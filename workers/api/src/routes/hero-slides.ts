import type { Env } from '../types';
import { requireAdmin } from '../auth';

interface SlideRow {
  id: string; type: string; image: string; product_id: string | null;
  title: string; subtitle: string; link: string; order: number; video_url: string;
}

function formatSlide(row: SlideRow) {
  return { id: row.id, type: row.type, image: row.image, videoUrl: row.video_url, productId: row.product_id, title: row.title, subtitle: row.subtitle, link: row.link, order: row.order };
}

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
});

export async function handleHeroSlides(request: Request, env: Env, path: string, method: string): Promise<Response> {
  // GET /api/hero-slides
  if (method === 'GET' && path === '/api/hero-slides') {
    const { results } = await env.DB.prepare('SELECT * FROM hero_slides ORDER BY "order"').all<SlideRow>();
    return json(results.map(formatSlide));
  }

  // POST /api/hero-slides
  if (method === 'POST' && path === '/api/hero-slides') {
    await requireAdmin(request, env);
    const body = await request.json() as any;
    const id = `hero-${Date.now()}`;
    const maxRow = await env.DB.prepare('SELECT MAX("order") as max_order FROM hero_slides').first<{ max_order: number | null }>();
    const order = (maxRow?.max_order ?? -1) + 1;
    await env.DB.prepare(
      'INSERT INTO hero_slides (id, type, image, video_url, product_id, title, subtitle, link, "order") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, body.type || 'image', body.image || '', body.videoUrl || '', body.productId || null, body.title || '', body.subtitle || '', body.link || '', order).run();
    const row = await env.DB.prepare('SELECT * FROM hero_slides WHERE id = ?').bind(id).first<SlideRow>();
    return json(formatSlide(row!), 201);
  }

  // POST /api/hero-slides/reorder (must be before /:id match)
  if (method === 'POST' && path === '/api/hero-slides/reorder') {
    await requireAdmin(request, env);
    const body = await request.json() as { id: string; order: number }[];
    for (const item of body) {
      await env.DB.prepare('UPDATE hero_slides SET "order" = ? WHERE id = ?').bind(item.order, item.id).run();
    }
    return json({ ok: true });
  }

  // PUT /api/hero-slides/:id
  const slideMatch = path.match(/^\/api\/hero-slides\/([^/]+)$/);
  if (method === 'PUT' && slideMatch) {
    await requireAdmin(request, env);
    const body = await request.json() as any;
    const existing = await env.DB.prepare('SELECT id FROM hero_slides WHERE id = ?').bind(slideMatch[1]).first();
    if (!existing) return json({ error: 'Slide no encontrado' }, 404);
    const fields: string[] = [];
    const vals: any[] = [];
    if (body.type !== undefined) fields.push('type = ?'), vals.push(body.type);
    if (body.image !== undefined) fields.push('image = ?'), vals.push(body.image);
    if (body.videoUrl !== undefined) fields.push('video_url = ?'), vals.push(body.videoUrl);
    if (body.productId !== undefined) fields.push('product_id = ?'), vals.push(body.productId);
    if (body.title !== undefined) fields.push('title = ?'), vals.push(body.title);
    if (body.subtitle !== undefined) fields.push('subtitle = ?'), vals.push(body.subtitle);
    if (body.link !== undefined) fields.push('link = ?'), vals.push(body.link);
    if (fields.length === 0) return json({ error: 'Sin cambios' });
    vals.push(slideMatch[1]);
    await env.DB.prepare(`UPDATE hero_slides SET ${fields.join(', ')} WHERE id = ?`).bind(...vals).run();
    const row = await env.DB.prepare('SELECT * FROM hero_slides WHERE id = ?').bind(slideMatch[1]).first<SlideRow>();
    return json(formatSlide(row!));
  }

  // DELETE /api/hero-slides/:id
  if (method === 'DELETE' && slideMatch) {
    await requireAdmin(request, env);
    await env.DB.prepare('DELETE FROM hero_slides WHERE id = ?').bind(slideMatch[1]).run();
    return json({ ok: true });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}
