-- Idempotency: remember Stripe event IDs we've processed
CREATE TABLE IF NOT EXISTS stripe_events (
                                             id TEXT PRIMARY KEY, -- Stripe event id: evt_...
                                             created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );

-- Orders captured from Checkout
CREATE TABLE IF NOT EXISTS apparel_orders (
                                              id INTEGER PRIMARY KEY AUTOINCREMENT,
                                              stripe_session_id TEXT NOT NULL UNIQUE,   -- cs_test_...
                                              stripe_payment_intent_id TEXT,            -- pi_...
                                              customer_email TEXT,
                                              customer_name TEXT,
                                              customer_phone TEXT,
                                              shipping_json TEXT,                       -- JSON string (address, etc.)
                                              total_amount_cents INTEGER,               -- optional
                                              currency TEXT,                            -- optional
                                              created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );

-- Optional but strongly useful: what they bought (by Stripe Price ID)
CREATE TABLE IF NOT EXISTS apparel_order_items (
                                                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                   order_id INTEGER NOT NULL,
                                                   stripe_price_id TEXT NOT NULL,
                                                   quantity INTEGER NOT NULL,
                                                   description TEXT,
                                                   FOREIGN KEY (order_id) REFERENCES apparel_orders(id) ON DELETE CASCADE
    );

CREATE INDEX IF NOT EXISTS idx_order_items_order ON apparel_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_price ON apparel_order_items(stripe_price_id);
