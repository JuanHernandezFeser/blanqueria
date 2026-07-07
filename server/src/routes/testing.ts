import { Hono } from 'hono';
import { getDb } from '../db';
import { seed } from '../seed';

const testing = new Hono();

testing.post('/reset', (c) => {
  if (process.env.NODE_ENV === 'production') {
    return c.json({ error: 'Not found' }, 404);
  }

  const resetKey = c.req.header('x-test-reset-key');
  if (!resetKey || resetKey !== process.env.TEST_RESET_KEY) {
    return c.json({ error: 'Not found' }, 404);
  }

  const db = getDb();
  db.run('DELETE FROM orders');
  db.run('DELETE FROM products');
  db.run('DELETE FROM categories');
  db.run('DELETE FROM hero_slides');
  db.run('DELETE FROM bank_config');
  db.run('DELETE FROM users');
  seed(db);

  return c.json({ ok: true });
});

export default testing;
