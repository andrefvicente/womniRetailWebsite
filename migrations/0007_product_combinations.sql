-- Womni product attribute combinations synced per product
CREATE TABLE IF NOT EXISTS product_combinations (
  product_slug TEXT NOT NULL,
  external_id TEXT NOT NULL,
  size TEXT,
  color TEXT,
  price INTEGER NOT NULL,
  original_price INTEGER,
  reference TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (product_slug, external_id),
  FOREIGN KEY (product_slug) REFERENCES products (slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_combinations_slug ON product_combinations (product_slug);
CREATE INDEX IF NOT EXISTS idx_product_combinations_size_color ON product_combinations (product_slug, size, color);
