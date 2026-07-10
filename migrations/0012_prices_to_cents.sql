-- Store prices as euro cents (1999 = €19.99). Legacy rows used whole euros (189 = €189).
UPDATE products
SET
  price = price * 100,
  original_price = CASE
    WHEN original_price IS NOT NULL THEN original_price * 100
    ELSE NULL
  END
WHERE price > 0 AND price < 100000;

UPDATE product_combinations
SET
  price = price * 100,
  original_price = CASE
    WHEN original_price IS NOT NULL THEN original_price * 100
    ELSE NULL
  END
WHERE price > 0 AND price < 100000;
