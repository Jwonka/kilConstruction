import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
    try {
        // Cloudflare env from Astro's Cloudflare adapter
        const env: any = (context.locals as any).runtime?.env ?? {};
        const bucket = env.GALLERY_BUCKET;

        if (!bucket) {
            return new Response(
                JSON.stringify({ error: "[list-images] Missing GALLERY_BUCKET binding" }),
                {
                    status: 500,
                    headers: { "content-type": "application/json" },
                },
            );
        }

        const url = new URL(context.request.url);
        const prefix = url.searchParams.get("prefix") ?? "";

        if (!prefix) {
            return new Response(
                JSON.stringify({ error: "Missing prefix" }),
                {
                    status: 400,
                    headers: { "content-type": "application/json" },
                },
            );
        }

        // Ask R2 for objects under this prefix
        const list = await bucket.list({ prefix, limit: 500 });

        const objects = (list.objects || []).map((obj: any) => ({
            key: obj.key,
            name: obj.key.split("/").pop() || obj.key,
            size: obj.size ?? 0,
            uploaded: obj.uploaded ? new Date(obj.uploaded).toISOString() : "",
        }));

        return new Response(JSON.stringify({ objects }), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    } catch (err) {
        console.error("[list-images] error", err);
        return new Response(
            JSON.stringify({ error: "Internal error" }),
            {
                status: 500,
                headers: { "content-type": "application/json" },
            },
        );
    }
};