-- Parent/child category hierarchy and optional tile image from Womni
ALTER TABLE categories ADD COLUMN parent_slug TEXT;
ALTER TABLE categories ADD COLUMN image TEXT;

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories (parent_slug);
