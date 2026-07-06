import { Hono } from 'hono';
import { authMiddleware, adminMiddleware } from '../auth';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '../../uploads');
const MAX_SIZE = 10 * 1024 * 1024;

const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

const upload = new Hono();

upload.post('/', authMiddleware, adminMiddleware, async (c) => {
  if (!existsSync(UPLOADS_DIR)) await mkdir(UPLOADS_DIR, { recursive: true });

  const formData = await c.req.raw.formData();
  const fileEntries = formData.getAll('files') as File[];
  if (!fileEntries || fileEntries.length === 0) { c.status(400); return c.json({ error: 'No se enviaron archivos' }); }

  const saved: string[] = [];

  for (const file of fileEntries) {
    const ext = extname(file.name).toLowerCase();
    if (!ALLOWED.includes(ext)) { c.status(400); return c.json({ error: `Formato no permitido: ${ext}` }); }
    if (file.size > MAX_SIZE) { c.status(400); return c.json({ error: `Archivo demasiado grande: ${file.name}` }); }

    const filename = `${crypto.randomUUID()}${ext}`;
    const buffer = await file.arrayBuffer();
    await writeFile(join(UPLOADS_DIR, filename), Buffer.from(buffer));
    saved.push(`/uploads/${filename}`);
  }

  return c.json({ urls: saved });
});

export default upload;
