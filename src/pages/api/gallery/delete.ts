import type { APIContext } from "astro";

const ALLOWED_TOP = [
    "Furniture",
    "Highlights",
    "New Construction",
    "Projects",
    "Remodels",
    "Services",
    "uploads",
];

export async function POST(Astro: APIContext) {
    const env = (Astro.locals as any).runtime?.env ?? {};
    const ADMIN_SECRET = env.ADMIN_SECRET as string | undefined;
    const bucket = (env as any).GALLERY_BUCKET;

    // Basic auth: same secret you use for admin pages
    const cookieAuth = Astro.cookies.get("admin_auth")?.value || "";
    if (!ADMIN_SECRET || cookieAuth !== ADMIN_SECRET) {
        return new Response("Unauthorized", { status: 401 });
    }

    if (!bucket) {
        console.error("[gallery/delete] Missing R2_BUCKET binding");
        return new Response("R2 not configured", { status: 500 });
    }

    let body: any;
    try {
        body = await Astro.request.json();
    } catch {
        return new Response("Invalid JSON body", { status: 400 });
    }

    const key = body?.key;
    if (!key || typeof key !== "string") {
        return new Response("Missing 'key' string in body", { status: 400 });
    }

    const topLevel = key.split("/")[0];
    if (!ALLOWED_TOP.includes(topLevel)) {
        return new Response("Invalid key", { status: 400 });
    }

    try {
        await bucket.delete(key);
        return new Response(
            JSON.stringify({ ok: true }),
            { status: 200, headers: { "content-type": "application/json" } },
        );
    } catch (err) {
        console.error("[gallery/delete] Failed:", err);
        return new Response("Delete failed", { status: 500 });
    }
}
