-- Remove shipping_json from apparel_orders
-- SQLite/D1 requires table rebuild

PRAGMA foreign_keys=off;

BEGIN TRANSACTION;

-- 1) Create a new table without shipping_json
CREATE TABLE apparel_orders_new (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    stripe_session_id TEXT NOT NULL UNIQUE,
                                    stripe_payment_intent_id TEXT,
                                    customer_email TEXT,
                                    customer_name TEXT,
                                    customer_phone TEXT,
                                    total_amount_cents INTEGER,
                                    currency TEXT,
                                    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- 2) Copy data (excluding shipping_json)
INSERT INTO apparel_orders_new (
    id,
    stripe_session_id,
    stripe_payment_intent_id,
    customer_email,
    customer_name,
    customer_phone,
    total_amount_cents,
    currency,
    created_at
)
SELECT
    id,
    stripe_session_id,
    stripe_payment_intent_id,
    customer_email,
    customer_name,
    customer_phone,
    total_amount_cents,
    currency,
    created_at
FROM apparel_orders;

-- 3) Drop old table
DROP TABLE apparel_orders;

-- 4) Rename new table
ALTER TABLE apparel_orders_new RENAME TO apparel_orders;

COMMIT;

PRAGMA foreign_keys=on;
