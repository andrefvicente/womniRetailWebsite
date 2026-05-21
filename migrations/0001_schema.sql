-- Womni Rugs — Cloudflare D1 schema
CREATE TABLE IF NOT EXISTS products (
  slug TEXT PRIMARY KEY NOT NULL,
  price INTEGER NOT NULL,
  original_price INTEGER,
  image TEXT NOT NULL,
  images TEXT NOT NULL,
  sizes TEXT NOT NULL,
  colors TEXT NOT NULL,
  material TEXT NOT NULL,
  style TEXT NOT NULL,
  room TEXT NOT NULL,
  rating REAL NOT NULL,
  review_count INTEGER NOT NULL,
  badge TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_translations (
  slug TEXT NOT NULL,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  care TEXT NOT NULL,
  PRIMARY KEY (slug, locale),
  FOREIGN KEY (slug) REFERENCES products (slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_products_room ON products (room);
CREATE INDEX IF NOT EXISTS idx_products_material ON products (material);
CREATE INDEX IF NOT EXISTS idx_products_style ON products (style);
CREATE INDEX IF NOT EXISTS idx_products_badge ON products (badge);
