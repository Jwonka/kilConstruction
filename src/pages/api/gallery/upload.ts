import type { APIContext } from "astro";
import { requireAdmin } from "../../../utils/adminAuth";

export async function POST(Astro: APIContext) {
    const { request, locals } = Astro;

    // 1) Admin-only gate
    const authResp = requireAdmin(request);
    if (authResp) return authResp;

    // 2) Read env from Pages Functions runtime
    const env = (locals as any).runtime?.env ?? {};
    const WORKER_URL = env.UPLOAD_WORKER_URL as string | undefined;
    const UPLOAD_SECRET = env.UPLOAD_SECRET as string | undefined;

    if (!WORKER_URL || !UPLOAD_SECRET) {
        console.error("[upload] Missing UPLOAD_WORKER_URL or UPLOAD_SECRET");
        return new Response("Upload service not configured", { status: 500 });
    }

    // 3) Proxy the multipart/form-data request to the upload worker
    const res = await fetch(WORKER_URL, {
        method: "POST",
        // Node/undici wants this when streaming; Cloudflare will ignore it
        // @ts-expect-error duplex is not in the standard TS lib yet
        duplex: "half",
        headers: {
            // preserve the original multipart boundary
            "content-type":
                request.headers.get("content-type") ?? "application/octet-stream",
            "x-upload-secret": UPLOAD_SECRET,
        },
        body: request.body,
    });

    // 4) Stream worker response back to the browser
    return new Response(res.body, {
        status: res.status,
        headers: {
            "content-type":
                res.headers.get("content-type") ?? "text/html; charset=utf-8",
        },
    });
}
