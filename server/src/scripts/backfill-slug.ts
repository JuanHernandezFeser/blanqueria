import { getDb } from '../db';
import { slugify } from '../utils/slugify';

const db = getDb();

const rows = db.query('SELECT id, name, slug FROM products WHERE slug IS NULL OR slug = \'\'').all() as { id: string; name: string }[];

db.exec('BEGIN');
try {
  for (const row of rows) {
    const slug = slugify(row.name);
    db.run('UPDATE products SET slug = ? WHERE id = ?', slug, row.id);
  }
  db.exec('COMMIT');
  console.log(`Backfill local: ${rows.length} productos actualizados`);
} catch (e) {
  db.exec('ROLLBACK');
  console.error('Backfill falló:', e);
  process.exit(1);
}
