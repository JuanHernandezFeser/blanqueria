import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { existsSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import auth from './routes/auth';
import products from './routes/products';
import categories from './routes/categories';
import heroSlides from './routes/hero-slides';
import orders from './routes/orders';
import bankConfig from './routes/bank-config';
import mercadopago from './routes/mercadopago';
import upload from './routes/upload';
import testing from './routes/testing';
import { getDb } from './db';

getDb();

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '../uploads');
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
};

const app = new Hono();

app.use('/api/*', cors({
  origin: ['http://localhost:8080', 'http://localhost:5173'],
  credentials: true,
}));

app.route('/api/auth', auth);
app.route('/api/products', products);
app.route('/api/categories', categories);
app.route('/api/hero-slides', heroSlides);
app.route('/api/orders', orders);
app.route('/api/bank-config', bankConfig);
app.route('/api', mercadopago);
app.route('/api/upload', upload);
app.route('/api/testing', testing);

app.get('/uploads/:file', async (c) => {
  const file = c.req.param('file');
  const filePath = join(UPLOADS_DIR, file);
  if (!filePath.startsWith(UPLOADS_DIR)) return c.notFound();
  if (!existsSync(filePath)) return c.notFound();
  const ext = extname(file).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const blob = Bun.file(filePath);
  return new Response(blob, { headers: { 'Content-Type': contentType } });
});

app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

const port = parseInt(process.env.PORT || '3001');
console.log(`Servidor iniciado en http://localhost:${port}`);
export default { port, fetch: app.fetch };
