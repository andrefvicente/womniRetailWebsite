-- ProductAttribute images synced per combination (Womni ProductAttributeImage)
ALTER TABLE product_combinations ADD COLUMN image TEXT;
ALTER TABLE product_combinations ADD COLUMN images TEXT NOT NULL DEFAULT '[]';
