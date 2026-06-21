-- Womni Feature / FeatureProduct → product specs (replaces material/style/room/rating)
ALTER TABLE products ADD COLUMN features TEXT NOT NULL DEFAULT '[]';
