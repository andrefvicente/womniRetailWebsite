-- Parent/child hierarchy by Womni catalog category id (not slug)
ALTER TABLE categories ADD COLUMN parent_external_id TEXT;

CREATE INDEX IF NOT EXISTS idx_categories_parent_external ON categories (parent_external_id);
