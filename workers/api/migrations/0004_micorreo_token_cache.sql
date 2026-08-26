CREATE TABLE micorreo_token_cache (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
