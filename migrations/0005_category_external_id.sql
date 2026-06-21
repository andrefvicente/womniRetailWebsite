-- Stable Womni category id (allows duplicate display names / slug disambiguation)
ALTER TABLE categories ADD COLUMN external_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_catalog_external_id
ON categories (catalog_id, external_id)
WHERE external_id IS NOT NULL;
