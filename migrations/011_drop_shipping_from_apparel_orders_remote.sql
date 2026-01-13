-- Remote-safe rebuild of apparel_orders without shipping_json
-- NOTE: no BEGIN/COMMIT; wrangler remote import rejects explicit transactions.

PRAGMA foreign_keys=OFF;

CREATE TABLE IF NOT EXISTS apparel_orders_new (
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

DROP TABLE apparel_orders;

ALTER TABLE apparel_orders_new RENAME TO apparel_orders;

PRAGMA foreign_keys=ON;
