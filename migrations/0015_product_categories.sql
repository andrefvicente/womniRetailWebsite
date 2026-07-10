-- Many-to-many product ↔ category (products can appear in multiple categories)
CREATE TABLE IF NOT EXISTS product_categories (
  product_slug TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  PRIMARY KEY (product_slug, category_slug),
  FOREIGN KEY (product_slug) REFERENCES products (slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_categories_category_slug
  ON product_categories (category_slug);

INSERT OR IGNORE INTO product_categories (product_slug, category_slug)
SELECT slug, category_slug
FROM products
WHERE category_slug IS NOT NULL AND TRIM(category_slug) != '';
