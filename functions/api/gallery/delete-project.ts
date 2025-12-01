import { requireAdmin } from "../../../src/utils/adminAuth";
import { sanitizePrefix } from "../../../src/utils/galleryPaths";

type R2Object = { key: string };
type R2ListOptions = { prefix?: string; cursor?: string; limit?: number };
type R2ListResult = { objects: R2Object[]; truncated: boolean; cursor?: string };
type R2Bucket = {
    list(opts: R2ListOptions): Promise<R2ListResult>;
    delete(keys: string[] | { key: string }[]): Promise<void>;
};

export const onRequestGet = async (context: { request: any; env: any; }) => {
    const request = context.request;
    const env = context.env;
    const ADMIN_SECRET = env.ADMIN_SECRET as string | undefined;
    const bucket = env.GALLERY_BUCKET as R2Bucket | undefined;

    const authResp = requireAdmin(request, ADMIN_SECRET);
    if (authResp) return authResp;

    if (!bucket) {
        console.error("[gallery/delete-project] Missing GALLERY_BUCKET binding");
        return new Response("R2 not configured", { status: 500 });
    }

    let body: any;
    try {
        body = await request.json();
    } catch {
        return new Response("Invalid JSON body", { status: 400 });
    }

    const rawPrefix = body.prefix as string | undefined;
    const prefix = sanitizePrefix(rawPrefix ?? null);
    if (!prefix) {
        return new Response("Invalid prefix", { status: 400 });
    }

    try {
        const allKeys: string[] = [];
        let cursor: string | undefined;

        do {
            const page = await bucket.list({ prefix, cursor, limit: 1000 });
            allKeys.push(...page.objects.map((o) => o.key));
            cursor = page.truncated ? page.cursor : undefined;
        } while (cursor);

        if (allKeys.length > 0) {
            await bucket.delete(allKeys);
        }

        return new Response(
            JSON.stringify({ ok: true, deleted: allKeys.length }),
            { status: 200, headers: { "content-type": "application/json" } }
        );
    } catch (err) {
        console.error("[gallery/delete-project] Failed:", err);
        return new Response("Delete failed", { status: 500 });
    }
};
