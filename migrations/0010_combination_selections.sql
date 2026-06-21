-- Womni ProductAttributeCombination → Attribute ids per variant
ALTER TABLE product_combinations ADD COLUMN attribute_ids TEXT NOT NULL DEFAULT '[]';
ALTER TABLE product_combinations ADD COLUMN selections TEXT NOT NULL DEFAULT '{}';
