CREATE TABLE IF NOT EXISTS specials (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  product_ids_json TEXT DEFAULT '[]',
  active INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
