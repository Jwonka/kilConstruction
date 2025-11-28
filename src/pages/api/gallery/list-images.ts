import type { APIRoute } from "astro";
import { requireAdmin } from "../../../utils/adminAuth";
import { sanitizePrefix } from "../../../utils/galleryPaths";


const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i;

export const GET: APIRoute = async ({ request, url, locals }) => {
    const authResp = requireAdmin(request);
    if (authResp) return authResp;

    const rawPrefix = url.searchParams.get("prefix");
    const prefix = sanitizePrefix(rawPrefix);
    if (!prefix) {
        return new Response("Invalid prefix", { status: 400 });
    }

    // Cloudflare Pages → R2 binding is exposed via locals.runtime.env
    const bucket = (locals as any).runtime?.env?.GALLERY_BUCKET;
    if (!bucket) {
        console.error("[list-images] Missing GALLERY_BUCKET binding");
        return new Response(
            JSON.stringify({ objects: [], error: "R2 not configured" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json; charset=utf-8" },
            }
        );
    }

    try {
        console.log("[list-images] listing prefix", prefix);

        type Obj = {
            key: string;
            name: string;
            size: number;
            uploaded: string | null;
        };

        const objects: Obj[] = [];
        let cursor: string | undefined = undefined;

        do {
            // @ts-ignore
            const page = await bucket.list({ prefix, cursor });

            console.log(
                "[list-images] page",
                "objects:", page.objects.length,
                "truncated:", page.truncated,
                "cursor:", page.cursor
            );

            for (const obj of page.objects) {
                if (!IMAGE_EXT.test(obj.key)) continue;

                const name = obj.key.split("/").pop() ?? obj.key;
                objects.push({
                    key: obj.key,
                    name,
                    size: obj.size ?? 0,
                    uploaded: obj.uploaded?.toString?.() ?? null,
                });
            }

            cursor = page.truncated ? page.cursor : undefined;
        } while (cursor);

        return new Response(JSON.stringify({ objects }), {
            status: 200,
            headers: { "Content-Type": "application/json; charset=utf-8" },
        });
    } catch (err) {
        console.error("[list-images] error for prefix", prefix, err);
        return new Response(
            JSON.stringify({ objects: [], error: "Failed to list images" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json; charset=utf-8" },
            }
        );
    }
};
