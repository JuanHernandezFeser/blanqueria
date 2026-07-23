import type { Env } from '../types';
import { requireAdmin } from '../auth';

const IMGBB_API = 'https://api.imgbb.com/1/upload';
const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
const MAX_SIZE = 10 * 1024 * 1024;

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
});

async function uploadToImgbb(file: File, apiKey: string): Promise<string> {
  const buffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

  const form = new FormData();
  form.append('image', base64);
  form.append('name', file.name.replace(/\.[^.]+$/, ''));

  const res = await fetch(`${IMGBB_API}?key=${apiKey}`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`imgbb error: ${res.status}`);

  const data = await res.json() as { data?: { url?: string } };
  if (!data.data?.url) throw new Error('imgbb no devolvió URL');
  return data.data.url;
}

export async function handleUpload(request: Request, env: Env, path: string, method: string): Promise<Response> {
  if (method === 'POST' && path === '/api/upload') {
    await requireAdmin(request, env);

    if (!env.IMGBB_API_KEY) return json({ error: 'IMGBB_API_KEY no configurada' }, 500);

    const formData = await request.formData();
    const fileEntries = formData.getAll('files') as File[];
    if (!fileEntries || fileEntries.length === 0) return json({ error: 'No se enviaron archivos' }, 400);

    const urls: string[] = [];
    for (const file of fileEntries) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED.includes(ext)) return json({ error: `Formato no permitido: ${ext}` }, 400);
      if (file.size > MAX_SIZE) return json({ error: `Archivo demasiado grande: ${file.name}` }, 400);

      try {
        const url = await uploadToImgbb(file, env.IMGBB_API_KEY);
        urls.push(url);
      } catch (err) {
        console.error('[Upload] imgbb error:', err);
        return json({ error: `Error subiendo ${file.name}` }, 502);
      }
    }

    return json({ urls });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}
