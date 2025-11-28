import type { APIRoute } from "astro";
import { requireAdmin } from "../../../utils/adminAuth";
import { sanitizePrefix } from "../../../utils/galleryPaths";

type R2Object = { key: string };
type R2ListOptions = { prefix?: string; cursor?: string; limit?: number };
type R2ListResult = { objects: R2Object[]; truncated: boolean; cursor?: string };
type R2Bucket = {
    list: (opts: R2ListOptions) => Promise<R2ListResult>;
    delete: (keys: string[] | { key: string }[]) => Promise<void>;
};

export const POST: APIRoute = async ({ request, locals }) => {
    const authResp = requireAdmin(request);
    if (authResp) return authResp;

    try {
        const body: any = await request.json().catch(() => ({}));
        const rawPrefix = typeof body?.prefix === "string" ? body.prefix.trim() : null;
        const prefix = sanitizePrefix(rawPrefix);
        if (!prefix) return new Response("Invalid prefix", { status: 400 });

        const env = (locals as any).runtime?.env ?? (locals as any).env ?? {};
        const bucket = env.GALLERY_BUCKET as R2Bucket | undefined;

        if (!bucket) {
            console.error("[gallery/delete-project] Missing GALLERY_BUCKET binding");
            return new Response("R2 not configured", { status: 500 });
        }

        // Make sure prefix ends with a slash so we only hit that "folder"
        const normalizedPrefix = prefix.endsWith("/") ? prefix : prefix + "/";

        let cursor: string | undefined;
        const keys: string[] = [];

        do {
            const page = await bucket.list({ prefix: normalizedPrefix, cursor, limit: 1000 });
            for (const obj of page.objects) {
                keys.push(obj.key);
            }
            cursor = page.truncated ? page.cursor : undefined;
        } while (cursor);

        if (keys.length > 0) {
            // R2 delete can take an array of keys
            await bucket.delete(keys);
        }

        return new Response(
            JSON.stringify({ ok: true, deleted: keys.length }),
            { status: 200, headers: { "content-type": "application/json" } },
        );
    } catch (err) {
        console.error("[gallery/delete-project] Failed:", err);
        return new Response("Delete failed", { status: 500 });
    }
};
