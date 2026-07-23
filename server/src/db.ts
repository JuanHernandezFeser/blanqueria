import { Database } from 'bun:sqlite';
import { seed } from './seed';
import { mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = import.meta.dir ? join(import.meta.dir, '../data') : './data';
mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = process.env.DB_PATH || join(DATA_DIR, 'blanqueria.db');

let db: Database;

export function getDb(): Database {
  if (!db) {
    db = new Database(DB_PATH, { create: true });
    initSchema(db);
  }
  return db;
}

function runSilent(db: Database, sql: string) {
  try { db.run(sql); } catch {}
}

function initSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      locality TEXT DEFAULT '',
      province TEXT DEFAULT '',
      postal_code TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  runSilent(db, 'ALTER TABLE users ADD COLUMN phone TEXT DEFAULT \'\'');
  runSilent(db, 'ALTER TABLE users ADD COLUMN address TEXT DEFAULT \'\'');
  runSilent(db, 'ALTER TABLE users ADD COLUMN locality TEXT DEFAULT \'\'');
  runSilent(db, 'ALTER TABLE users ADD COLUMN province TEXT DEFAULT \'\'');
  runSilent(db, 'ALTER TABLE users ADD COLUMN postal_code TEXT DEFAULT \'\'');
  runSilent(db, 'ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0');
  runSilent(db, 'ALTER TABLE users ADD COLUMN verification_token TEXT DEFAULT \'\'');

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      brand TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT DEFAULT '',
      price REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      image TEXT DEFAULT '',
      images_json TEXT DEFAULT '[]',
      variants_json TEXT DEFAULT '[]',
      colors_json TEXT DEFAULT '[]',
      variant_stock_json TEXT DEFAULT '{}',
      featured INTEGER DEFAULT 0,
      is_new INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      name TEXT PRIMARY KEY,
      image TEXT DEFAULT '',
      description TEXT DEFAULT '',
      subcategories_json TEXT DEFAULT '[]'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ambientes (
      name TEXT PRIMARY KEY,
      image TEXT DEFAULT '',
      description TEXT DEFAULT ''
    )
  `);

  runSilent(db, "ALTER TABLE products ADD COLUMN ambientes_json TEXT DEFAULT '[]'");
  runSilent(db, "ALTER TABLE hero_slides ADD COLUMN video_url TEXT DEFAULT ''");
  runSilent(db, "ALTER TABLE orders ADD COLUMN source TEXT DEFAULT 'web'");

  db.run(`
    CREATE TABLE IF NOT EXISTS hero_slides (
      id TEXT PRIMARY KEY,
      type TEXT DEFAULT 'image',
      image TEXT DEFAULT '',
      product_id TEXT,
      title TEXT DEFAULT '',
      subtitle TEXT DEFAULT '',
      link TEXT DEFAULT '',
      "order" INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      date TEXT NOT NULL,
      subtotal REAL NOT NULL,
      shipping_cost REAL DEFAULT 0,
      total REAL NOT NULL,
      order_status TEXT DEFAULT 'Pendiente',
      payment_method TEXT NOT NULL,
      payment_status TEXT DEFAULT 'pendiente',
      items_json TEXT DEFAULT '[]',
      shipping_address_json TEXT DEFAULT '{}',
      source TEXT DEFAULT 'web'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bank_config (
      id INTEGER PRIMARY KEY DEFAULT 1,
      bank_name TEXT DEFAULT 'Banco Ejemplo',
      cbu TEXT DEFAULT '',
      alias TEXT DEFAULT '',
      account_holder TEXT DEFAULT '',
      discount_percentage REAL DEFAULT 0
    )
  `);

  runSilent(db, 'ALTER TABLE bank_config ADD COLUMN discount_percentage REAL DEFAULT 0');

  seed(db);
}
