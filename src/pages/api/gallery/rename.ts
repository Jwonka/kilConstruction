import type { APIRoute } from "astro";
import { requireAdmin } from "../../../utils/adminAuth";
import { sanitizeKey } from "../../../utils/galleryPaths";

const ALLOWED_TOP = [
    "Furniture",
    "Highlights",
    "New Construction",
    "Projects",
    "Remodels",
    "Services",
    "uploads",
];

export const POST: APIRoute = async ({ request, locals }) => {
    // 1) Admin gate – same pattern as upload/delete
    const authResp = requireAdmin(request);
    if (authResp) return authResp;

    const bucket = (locals as any).runtime?.env?.GALLERY_BUCKET;
    if (!bucket) {
        console.error("[rename] Missing GALLERY_BUCKET binding");
        return jsonResponse({ error: "R2 not configured" }, 500);
    }

    const body = await request.json().catch(() => ({} as any));
    const rawOldKey = body.oldKey as string | undefined;
    const rawNewKey = body.newKey as string | undefined;

    // Sanitize both sides
    const oldKey = sanitizeKey(rawOldKey ?? null);
    const newKey = sanitizeKey(rawNewKey ?? null);

    console.log("[rename] request", { oldKey, newKey });

    if (!oldKey || !newKey) {
        return jsonResponse({ error: "Missing oldKey, newKey" }, 400);
    }

    const topLevel = oldKey.split("/")[0];
    const levelTop = newKey.split("/")[0];
    if (!ALLOWED_TOP.includes(topLevel) || !ALLOWED_TOP.includes(levelTop)) {
        return new Response("Invalid key", { status: 400 });
    }

    if (oldKey === newKey) {
        return jsonResponse({ ok: true, skipped: true }, 200);
    }

    // Load existing object
    const src = await bucket.get(oldKey);
    if (!src) {
        console.error("[rename] source not found", oldKey);
        return jsonResponse({ error: "Source not found" }, 404);
    }

    // Write under the new key, preserving metadata
    await bucket.put(newKey, src.body, {
        httpMetadata: src.httpMetadata,
    });

    // Delete old key
    await bucket.delete(oldKey);

    console.log("[rename] success", { oldKey, newKey });

    return jsonResponse({ ok: true }, 200);
};

function jsonResponse(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
        },
    });
}
