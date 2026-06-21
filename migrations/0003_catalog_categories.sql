-- Catalog metadata and categories synced from Womni
CREATE TABLE IF NOT EXISTS catalogs (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY NOT NULL,
  catalog_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (catalog_id) REFERENCES catalogs (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_categories_catalog ON categories (catalog_id);

ALTER TABLE products ADD COLUMN category_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_products_category_slug ON products (category_slug);
