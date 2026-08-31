import { Hono } from 'hono';
import { getDb } from '../db';
import { authMiddleware, adminMiddleware } from '../auth';

const siteSettings = new Hono();

siteSettings.get('/', (c) => {
  const db = getDb();
  const rows = db.query('SELECT key, value FROM site_settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return c.json(settings);
});

siteSettings.get('/:key', (c) => {
  const key = decodeURIComponent(c.req.param('key'));
  const db = getDb();
  const row = db.query('SELECT value FROM site_settings WHERE key = ?').get(key) as { value: string } | undefined;
  return c.json({ key, value: row?.value ?? null });
});

siteSettings.put('/:key', authMiddleware, adminMiddleware, async (c) => {
  const key = decodeURIComponent(c.req.param('key'));
  const body = await c.req.json();
  const db = getDb();
  db.run('INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, body.value);
  return c.json({ key, value: body.value });
});

export default siteSettings;
