import type { APIRoute } from "astro";

function text(body: string, status = 200) {
    return new Response(body, {
        status,
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
}

async function hmacSHA256Hex(secret: string, message: string) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
        "sign",
    ]);
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
    const bytes = new Uint8Array(sig);
    return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseStripeSigHeader(header: string) {
    const parts = header.split(",").map((p) => p.trim());
    const out: Record<string, string[]> = {};
    for (const p of parts) {
        const [k, v] = p.split("=");
        if (!k || !v) continue;
        (out[k] ||= []).push(v);
    }
    return out;
}

async function verifyStripeSignature(rawBody: string, sigHeader: string, webhookSecret: string) {
    const parsed = parseStripeSigHeader(sigHeader);
    const t = parsed["t"]?.[0];
    const v1s = parsed["v1"] || [];
    if (!t || v1s.length === 0) return false;

    // 5 minute replay window
    const ts = Number(t);
    if (!Number.isFinite(ts)) return false;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > 5 * 60) return false;

    const signedPayload = `${t}.${rawBody}`;
    const expected = await hmacSHA256Hex(webhookSecret, signedPayload);

    const expectedBytes = new TextEncoder().encode(expected);
    for (const cand of v1s) {
        const candBytes = new TextEncoder().encode(cand);
        if (timingSafeEqual(expectedBytes, candBytes)) return true;
    }
    return false;
}

async function stripeGetJson(url: string, secretKey: string) {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${secretKey}` } });
    const t = await r.text();
    let data: any = null;
    try {
        data = JSON.parse(t);
    } catch {
        /* ignore */
    }
    return { ok: r.ok, status: r.status, data: data ?? {} };
}

async function getVariantSnapshotByPriceId(db: any, priceId: string) {
    return await db
        .prepare(
            `
                SELECT
                    v.item_id     AS itemId,
                    v.size        AS size,
        v.price_cents AS priceCents
                FROM apparel_variants v
                WHERE v.stripe_price_id = ?
                    LIMIT 1
            `,
        )
        .bind(priceId)
        .first();
}

export const POST: APIRoute = async ({ request, locals }) => {
    const env = (locals as any).runtime?.env ?? {};
    const db = env.DB;
    const STRIPE_SECRET_KEY: string | undefined = env.STRIPE_SECRET_KEY;
    const STRIPE_WEBHOOK_SECRET: string | undefined = env.STRIPE_WEBHOOK_SECRET;

    if (!db) return text("missing db", 500);
    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) return text("missing stripe secrets", 500);

    const sigHeader = request.headers.get("stripe-signature") || "";
    const rawBody = await request.text(); // MUST be raw

    const sigOk = await verifyStripeSignature(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET);
    if (!sigOk) return text("invalid signature", 400);

    let event: any;
    try {
        event = JSON.parse(rawBody);
    } catch {
        return text("bad json", 400);
    }

    const eventId = event?.id;
    if (!eventId) return text("missing event id", 400);

    // Only this event may mutate state
    if (event?.type !== "checkout.session.completed") return text("ignored", 200);

    const session = event?.data?.object;
    const sessionId = session?.id;
    if (!sessionId) return text("missing session id", 400);

    if (session?.mode !== "payment" || session?.payment_status !== "paid") {
        return text("not_paid", 200);
    }

    // Canonical session details
    const sess = await stripeGetJson(
        `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
        STRIPE_SECRET_KEY,
    );
    if (!sess.ok) return text("failed to fetch session", 502);

    const s = sess.data;

    const customerEmail = s?.customer_details?.email ?? null;
    const customerName = s?.customer_details?.name ?? null;
    const customerPhone = s?.customer_details?.phone ?? null;
    const paymentIntent = s?.payment_intent ?? null;
    const amountTotal = Number.isInteger(s?.amount_total) ? s.amount_total : null;
    const currency = s?.currency ?? null;

    // Line items (price ids + qty)
    const li = await stripeGetJson(
        `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}/line_items?limit=100`,
        STRIPE_SECRET_KEY,
    );
    if (!li.ok) return text("failed to fetch line_items", 502);

    const lineItems = li.data?.data || [];
    const purchases: Array<{ priceId: string; quantity: number }> = [];

    for (const it of lineItems) {
        const priceId = it?.price?.id;
        const qty = Number(it?.quantity);
        if (!priceId || !Number.isInteger(qty) || qty < 1) continue;
        purchases.push({ priceId, quantity: qty });
    }
    if (purchases.length === 0) return text("no purchasable items", 200);

    // ---- TRANSACTION STARTS HERE ----
    try {
        await db.prepare("BEGIN").run();

        // 1) Idempotency first
        try {
            await db.prepare(`INSERT INTO stripe_events (id) VALUES (?)`).bind(eventId).run();
        } catch {
            await db.prepare("ROLLBACK").run();
            return text("duplicate", 200);
        }

        // 2) Create order (unique on stripe_session_id should prevent duplicates)
        let orderId: number | null = null;
        try {
            const r = await db
                .prepare(
                    `
                        INSERT INTO apparel_orders
                        (stripe_session_id, stripe_payment_intent_id, customer_email, customer_name, customer_phone, total_amount_cents, currency)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `,
                )
                .bind(sessionId, paymentIntent, customerEmail, customerName, customerPhone, amountTotal, currency)
                .run();

            orderId = (r as any)?.meta?.last_row_id ?? null;
        } catch {
            await db.prepare("ROLLBACK").run();
            return text("order_exists", 200);
        }

        // 3) Snapshot order items (item_id, size, price_cents) + stripe_price_id + quantity
        if (orderId) {
            const itemStmts = [];
            for (const p of purchases) {
                const snap = await getVariantSnapshotByPriceId(db, p.priceId);
                itemStmts.push(
                    db
                        .prepare(
                            `
              INSERT INTO apparel_order_items
                (order_id, stripe_price_id, quantity, item_id, size, price_cents)
              VALUES (?, ?, ?, ?, ?, ?)
            `,
                        )
                        .bind(
                            orderId,
                            p.priceId,
                            p.quantity,
                            snap?.itemId ?? null,
                            snap?.size ?? null,
                            snap?.priceCents ?? null,
                        ),
                );
            }
            await db.batch(itemStmts);
        }

        // 4) Atomic decrement(s) with guard
        const decStmts = purchases.map((p) =>
            db
                .prepare(
                    `
                        UPDATE apparel_variants
                        SET stock = stock - ?, updated_at = (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                        WHERE stripe_price_id = ?
                          AND active = 1
                          AND stock >= ?
                    `,
                )
                .bind(p.quantity, p.priceId, p.quantity),
        );

        const results = await db.batch(decStmts);

        let failed = 0;
        for (const r of results || []) {
            const changes = r?.meta?.changes ?? 0;
            if (changes === 0) failed++;
        }

        await db.prepare("COMMIT").run();
        // ---- TRANSACTION ENDS HERE ----

        if (failed > 0) {
            // Oversold or variant inactive; stock will NOT go negative due to guard.
            return text("completed_with_warnings", 200);
        }

        return text("ok", 200);
    } catch {
        try {
            await db.prepare("ROLLBACK").run();
        } catch {}
        return text("db error", 500);
    }
};