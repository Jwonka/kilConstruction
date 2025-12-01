import { requireAdmin } from "../../../src/utils/adminAuth";
import { sanitizeKey } from "../../../src/utils/galleryPaths";

const ALLOWED_TOP = [
    "Furniture",
    "Highlights",
    "New Construction",
    "Projects",
    "Remodels",
    "Services",
    "uploads",
];

type R2ObjectMeta = { httpMetadata?: any };
type R2GetResult = { blob(): Promise<Blob> };

type R2Bucket = {
    head(key: string): Promise<R2ObjectMeta | null>;
    get(key: string): Promise<R2GetResult | null>;
    put(
        key: string,
        value:
            | Blob
            | ArrayBuffer
            | ArrayBufferView
            | ReadableStream
            | string,
        options?: { httpMetadata?: any }
    ): Promise<void>;
    delete(key: string | string[]): Promise<void>;
};

export async function onRequestGet(context: { request: any; env: any; }) {
    const request = context.request;
    const env = context.env;
    const ADMIN_SECRET = env.ADMIN_SECRET as string | undefined;
    const bucket = env.GALLERY_BUCKET as R2Bucket | undefined;

    const authResp = requireAdmin(request, ADMIN_SECRET);
    if (authResp) return authResp;

    if (!bucket) {
        console.error("[rename] Missing GALLERY_BUCKET binding");
        return jsonResponse({ error: "R2 not configured" }, 500);
    }

    let body: any;
    try {
        body = await request.json();
    } catch {
        return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const rawOldKey = body.oldKey as string | undefined;
    const rawNewKey = body.newKey as string | undefined;

    const oldKey = sanitizeKey(rawOldKey ?? null);
    const newKey = sanitizeKey(rawNewKey ?? null);

    if (!oldKey || !newKey) {
        return jsonResponse({ error: "Invalid key(s)" }, 400);
    }

    const oldTop = oldKey.split("/")[0];
    const newTop = newKey.split("/")[0];

    if (!ALLOWED_TOP.includes(oldTop) || !ALLOWED_TOP.includes(newTop)) {
        return jsonResponse({ error: "Invalid top-level folder" }, 400);
    }

    const meta = await bucket.head(oldKey);
    if (!meta) {
        return jsonResponse({ error: "Source object not found" }, 404);
    }

    const src = await bucket.get(oldKey);
    if (!src) {
        return jsonResponse({ error: "Source object not readable" }, 404);
    }

    const blob = await src.blob();

    await bucket.put(newKey, blob, {
        httpMetadata: meta.httpMetadata,
    });

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
