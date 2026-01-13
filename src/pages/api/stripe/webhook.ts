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
    const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
    const bytes = new Uint8Array(sig);
    return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseStripeSigHeader(header: string) {
    // Stripe-Signature: t=...,v1=...,v0=...
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

    // Optional replay protection: 5 minutes
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
    const r = await fetch(url, {
        headers: { Authorization: `Bearer ${secretKey}` },
    });
    const text = await r.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch { /* ignore */ }
    return { ok: r.ok, status: r.status, data: data ?? {} };
}

export const POST: APIRoute = async ({ request, locals }) => {
    const env = (locals as any).runtime?.env ?? {};
    const db = env.DB;
    const STRIPE_SECRET_KEY: string | undefined = env.STRIPE_SECRET_KEY;
    const STRIPE_WEBHOOK_SECRET: string | undefined = env.STRIPE_WEBHOOK_SECRET;

    if (!db) return text("missing db", 500);
    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) return text("missing stripe secrets", 500);

    const sigHeader = request.headers.get("stripe-signature") || "";
    const rawBody = await request.text(); // MUST be raw text

    const ok = await verifyStripeSignature(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET);
    if (!ok) return text("invalid signature", 400);

    let event: any;
    try {
        event = JSON.parse(rawBody);
    } catch {
        return text("bad json", 400);
    }

    // Handle only what we need
    if (event?.type !== "checkout.session.completed") {
        return text("ignored", 200);
    }

    const session = event?.data?.object;
    const sessionId = session?.id;
    if (!sessionId) return text("missing session id", 400);

    // Fetch line items so we can decrement stock based on Stripe Price IDs
    const li = await stripeGetJson(
        `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}/line_items?limit=100`,
        STRIPE_SECRET_KEY
    );
    if (!li.ok) return text("failed to fetch line_items", 502);

    const lineItems = li.data?.data || [];

    // Build list of {priceId, quantity}
    const purchases: Array<{ priceId: string; quantity: number }> = [];
    for (const it of lineItems) {
        const priceId = it?.price?.id;
        const qty = Number(it?.quantity);
        if (!priceId || !Number.isInteger(qty) || qty < 1) continue;
        purchases.push({ priceId, quantity: qty });
    }

    if (purchases.length === 0) return text("no purchasable items", 200);

    // Decrement stock safely for each purchased variant
    // NOTE: We do an atomic UPDATE with stock >= qty guard.
    // If any update affects 0 rows, we do NOT throw; we respond 200 so Stripe doesn’t retry forever,
    // but you should alert/log for manual follow-up.
    const stmts: any[] = [];
    for (const p of purchases) {
        stmts.push(
            db.prepare(
                `
        UPDATE apparel_variants
        SET stock = stock - ?, updated_at = (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        WHERE stripe_price_id = ? AND active = 1 AND stock >= ?
        `
            ).bind(p.quantity, p.priceId, p.quantity)
        );
    }

    let results: any;
    try {
        results = await db.batch(stmts);
    } catch (e) {
        // If DB is down, let Stripe retry
        return text("db error", 500);
    }

    // Detect any failed decrements (changed_db / meta changes not always exposed, so use batch result counts)
    // D1 returns objects; some include `meta.changes`. We check for 0 changes.
    let failed = 0;
    for (const r of results || []) {
        const changes = r?.meta?.changes ?? 0;
        if (changes === 0) failed++;
    }

    if (failed > 0) {
        console.warn(`[stripe webhook] stock decrement failed for ${failed} line item(s)`, {
            sessionId,
            purchases,
        });
        // Return 200 so Stripe stops retrying; you can add alerting/email later.
        return text("completed_with_warnings", 200);
    }

    return text("ok", 200);
};
