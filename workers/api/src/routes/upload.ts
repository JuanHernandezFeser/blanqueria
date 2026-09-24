import type { Env } from '../types';
import { requireAdmin } from '../auth';

const R2_PUBLIC_BASE = 'https://img.aikenblanco.com.ar';
const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
const MAX_SIZE = 10 * 1024 * 1024;
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
});

export async function handleUpload(request: Request, env: Env, _ctx: ExecutionContext, path: string, method: string): Promise<Response> {
  if (method === 'POST' && path === '/api/upload') {
    await requireAdmin(request, env);

    if (!env.IMAGES) return json({ error: 'env.IMAGES no configurado' }, 500);

    const formData = await request.formData();
    const fileEntries = formData.getAll('files') as File[];
    if (!fileEntries || fileEntries.length === 0) return json({ error: 'No se enviaron archivos' }, 400);

    const urls: string[] = [];
    for (const file of fileEntries) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED.includes(ext)) return json({ error: `Formato no permitido: ${ext}` }, 400);
      if (file.size > MAX_SIZE) return json({ error: `Archivo demasiado grande: ${file.name}` }, 400);

      try {
        const key = `${Date.now()}-${crypto.randomUUID()}${ext}`;
        await env.IMAGES.put(key, await file.arrayBuffer(), {
          httpMetadata: {
            contentType: MIME_TYPES[ext] || file.type || 'application/octet-stream',
            cacheControl: CACHE_CONTROL,
          },
          cacheControl: CACHE_CONTROL,
        });
        urls.push(`${R2_PUBLIC_BASE}/${key}`);
      } catch (err) {
        console.error('[Upload] r2 error:', err);
        return json({ error: `Error subiendo ${file.name}` }, 502);
      }
    }

    return json({ urls });
  }

  return json({ error: 'Not found' }, 404);
}
