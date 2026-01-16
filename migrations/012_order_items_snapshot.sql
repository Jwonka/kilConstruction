-- migrations/012_order_items_snapshot.sql

-- Add snapshot columns to order items
ALTER TABLE apparel_order_items ADD COLUMN item_id INTEGER;
ALTER TABLE apparel_order_items ADD COLUMN size TEXT;
ALTER TABLE apparel_order_items ADD COLUMN price_cents INTEGER;

-- Optional: if you want faster lookups
CREATE INDEX IF NOT EXISTS idx_apparel_order_items_order_id ON apparel_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_apparel_order_items_item_size ON apparel_order_items(item_id, size);

-- Optional backfill for existing rows that only had stripe_price_id
-- This assumes apparel_variants has stripe_price_id, item_id, size, price_cents.
UPDATE apparel_order_items
SET
    item_id = (SELECT v.item_id FROM apparel_variants v WHERE v.stripe_price_id = apparel_order_items.stripe_price_id LIMIT 1),
    size    = (SELECT v.size    FROM apparel_variants v WHERE v.stripe_price_id = apparel_order_items.stripe_price_id LIMIT 1),
    price_cents = (SELECT v.price_cents FROM apparel_variants v WHERE v.stripe_price_id = apparel_order_items.stripe_price_id LIMIT 1)
WHERE item_id IS NULL OR size IS NULL OR price_cents IS NULL;
