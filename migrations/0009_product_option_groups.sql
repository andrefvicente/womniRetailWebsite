-- Generic variant option groups (replaces rug-specific sizes/colors for synced products)
ALTER TABLE products ADD COLUMN option_groups TEXT NOT NULL DEFAULT '[]';

ALTER TABLE product_combinations ADD COLUMN options TEXT NOT NULL DEFAULT '{}';
