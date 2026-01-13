-- apparel items (album-level)
CREATE TABLE IF NOT EXISTS apparel_items (
                                             id         INTEGER PRIMARY KEY AUTOINCREMENT,
                                             slug       TEXT NOT NULL UNIQUE,     -- coats, cups, flannels, sweatshirts, t-shirts
                                             category   TEXT NOT NULL,            -- e.g. "Apparel"
                                             title      TEXT NOT NULL,            -- human-friendly
                                             active     INTEGER NOT NULL DEFAULT 1,
                                             created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );

-- size variants (contractor-controlled)
CREATE TABLE IF NOT EXISTS apparel_variants (
                                                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                                                item_id         INTEGER NOT NULL,
                                                size            TEXT NOT NULL,
                                                active          INTEGER NOT NULL DEFAULT 0,     -- contractor turns on sizes offered
                                                price_cents     INTEGER NOT NULL DEFAULT 0,     -- display + internal reference
                                                stock           INTEGER NOT NULL DEFAULT 0,
                                                stripe_price_id TEXT,                          -- required to charge
                                                updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

    FOREIGN KEY (item_id) REFERENCES apparel_items(id) ON DELETE CASCADE,
    UNIQUE (item_id, size),
    CHECK (size IN ('S','M','L','XL','XXL','XXXL','XXXXL')),
    CHECK (price_cents >= 0),
    CHECK (stock >= 0),
    CHECK (active IN (0,1))
    );

CREATE INDEX IF NOT EXISTS idx_apparel_variants_item ON apparel_variants(item_id);
