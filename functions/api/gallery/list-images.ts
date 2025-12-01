import type { APIRoute } from "astro";
import { requireAdmin } from "../../../src/utils/adminAuth";
import { sanitizePrefix } from "../../../src/utils/galleryPaths";

const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i;

type R2Object = { key: string; size?: number; uploaded?: string | Date };
type R2ListOptions = { prefix?: string; cursor?: string; limit?: number };
type R2ListResult = { objects: R2Object[]; truncated: boolean; cursor?: string };
type R2Bucket = {
    list(opts: R2ListOptions): Promise<R2ListResult>;
};

export async function onRequestGet(context: { request: any; env: any; }) {
    const request = context.request;
    const env = context.env;
    const ADMIN_SECRET = env.ADMIN_SECRET as string | undefined;
    const bucket = env.GALLERY_BUCKET as R2Bucket | undefined;

    const authResp = requireAdmin(request, ADMIN_SECRET);
    if (authResp) return authResp;

    if (!bucket) {
        console.error("[list-images] Missing GALLERY_BUCKET binding");
        return new Response(
            JSON.stringify({ objects: [], error: "R2 not configured" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    const url = new URL(request.url);
    const rawPrefix = url.searchParams.get("prefix");
    const prefix = sanitizePrefix(rawPrefix);
    if (!prefix) {
        return new Response(
            JSON.stringify({ objects: [], error: "Invalid prefix" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        const result = await bucket.list({ prefix });
        const objects = (result.objects ?? [])
            .filter((obj) => IMAGE_EXT.test(obj.key ?? ""))
            .map((obj) => ({
                key: obj.key,
                size: obj.size,
                uploaded: obj.uploaded,
            }));

        return new Response(JSON.stringify({ objects }), {
            status: 200,
            headers: { "Content-Type": "application/json; charset=utf-8" },
        });
    } catch (err) {
        console.error("[list-images] error for prefix", prefix, err);
        return new Response(
            JSON.stringify({ objects: [], error: "Failed to list images" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
