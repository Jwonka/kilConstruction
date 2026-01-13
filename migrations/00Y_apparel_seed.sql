-- Seed apparel items
INSERT OR IGNORE INTO apparel_items (slug, category, title, active)
VALUES
  ('coats', 'Apparel', 'Coats', 1),
  ('cups', 'Apparel', 'Cups', 1),
  ('flannels', 'Apparel', 'Flannels', 1),
  ('sweatshirts', 'Apparel', 'Sweatshirts', 1),
  ('t-shirts', 'Apparel', 'T-Shirts', 1);

-- Seed variants: S..XXXXL for each item (inactive by default)
WITH sizes(size) AS (
    VALUES
        ('S'),
        ('M'),
        ('L'),
        ('XL'),
        ('XXL'),
        ('XXXL'),
        ('XXXXL')
)
INSERT OR IGNORE INTO apparel_variants (item_id, size, active, price_cents, stock)
SELECT i.id, sizes.size, 0, 0, 0
FROM apparel_items i
         JOIN sizes
WHERE i.slug IN ('coats','cups','flannels','sweatshirts','t-shirts');
