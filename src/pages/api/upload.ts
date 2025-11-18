import type { APIContext } from "astro";

export async function POST(Astro: APIContext) {
    const env = (Astro.locals as any).runtime?.env ?? {};
    const WORKER_URL = env.UPLOAD_WORKER_URL as string | undefined;
    const UPLOAD_SECRET = env.UPLOAD_SECRET as string | undefined;

    if (!WORKER_URL || !UPLOAD_SECRET) {
        console.error("[upload] Missing UPLOAD_WORKER_URL or UPLOAD_SECRET");
        return new Response("Upload service not configured", { status: 500 });
    }

    // Proxy the multipart/form-data request straight to the worker
    const res = await fetch(WORKER_URL, {
        method: "POST",
        // ⚠️ Node/undici requires this when sending a streamed body
        // Cloudflare ignores it, so it's safe in production too.
        // @ts-expect-error duplex is not in the standard TS lib yet
        duplex: "half",
        headers: {
            // preserve the multipart boundary
            "content-type":
                Astro.request.headers.get("content-type") ?? "application/octet-stream",
            "x-upload-secret": UPLOAD_SECRET,
        },
        body: Astro.request.body, // stream through
    });

    // Stream worker response back to the browser
    return new Response(res.body, {
        status: res.status,
        headers: {
            "content-type":
                res.headers.get("content-type") ?? "text/html; charset=utf-8",
        },
    });
}