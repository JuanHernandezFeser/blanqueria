CREATE TABLE IF NOT EXISTS combos (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price REAL NOT NULL,
  image TEXT DEFAULT '',
  slug TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS combo_items (
  id TEXT PRIMARY KEY,
  combo_id TEXT NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant TEXT,
  color TEXT,
  quantity INTEGER NOT NULL DEFAULT 1
);