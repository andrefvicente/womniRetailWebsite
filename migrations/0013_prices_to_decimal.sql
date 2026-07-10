-- Revert 0012: store prices as decimal euros again (3099 cents -> 30.99).
-- Every product/combination row reaching this migration was multiplied by 100
-- in 0012, so divide it back to restore the real euro amount.
UPDATE products
SET
  price = price / 100.0,
  original_price = CASE
    WHEN original_price IS NOT NULL THEN original_price / 100.0
    ELSE NULL
  END
WHERE price > 0;

UPDATE product_combinations
SET
  price = price / 100.0,
  original_price = CASE
    WHEN original_price IS NOT NULL THEN original_price / 100.0
    ELSE NULL
  END
WHERE price > 0;
