// src/pages/api/gallery/debug-root.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
    const bucket = (locals as any).runtime?.env?.GALLERY_BUCKET;
    if (!bucket) {
        return new Response("No bucket", { status: 500 });
    }

    const page = await bucket.list({ prefix: "", limit: 50 }); // @ts-ignore if needed

    const keys = page.objects.map((o: any) => o.key);
    return new Response(JSON.stringify({ keys }, null, 2), {
        status: 200,
        headers: { "content-type": "application/json" },
    });
};
