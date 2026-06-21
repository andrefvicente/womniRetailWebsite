-- Promotion window synced from Womni (start of week → today when on sale)
ALTER TABLE products ADD COLUMN promotion_start TEXT;
ALTER TABLE products ADD COLUMN promotion_end TEXT;

ALTER TABLE product_combinations ADD COLUMN promotion_start TEXT;
ALTER TABLE product_combinations ADD COLUMN promotion_end TEXT;
