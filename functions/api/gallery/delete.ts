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

type R2Bucket = {
    delete(key: string | string[]): Promise<void>;
};

export const onRequestGet = async (context: { request: any; env: any; }) => {
    const request = context.request;
    const env = context.env;
    const ADMIN_SECRET = env.ADMIN_SECRET as string | undefined;
    const bucket = env.GALLERY_BUCKET as R2Bucket | undefined;

    const authError = requireAdmin(request, env);
    if (authError) return authError;

    if (!bucket) {
        console.error("[gallery/delete] Missing GALLERY_BUCKET binding");
        return new Response("R2 not configured", { status: 500 });
    }

    let body: any;
    try {
        body = await request.json();
    } catch {
        return new Response("Invalid JSON body", { status: 400 });
    }

    const rawKey = body.key as string | undefined;
    const key = sanitizeKey(rawKey ?? null);
    if (!key) {
        return new Response("Invalid key", { status: 400 });
    }

    const topLevel = key.split("/")[0];
    if (!ALLOWED_TOP.includes(topLevel)) {
        return new Response("Invalid key", { status: 400 });
    }

    try {
        await bucket.delete(key);
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    } catch (err) {
        console.error("[gallery/delete] Failed:", err);
        return new Response("Delete failed", { status: 500 });
    }
}
