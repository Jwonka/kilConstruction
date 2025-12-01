import type { APIRoute } from "astro";

// Use env var if available, fallback to the correct worker endpoint
// The replace(/\/$/, "") strips trailing slashes
const GALLERY_API =
    import.meta.env.PUBLIC_GALLERY_API?.replace(/\/$/, "") ||
    "https://kilcon.work/api/gallery-api";

export const GET: APIRoute = async ({ request, url }) => {
    const search = url.search; // includes query string e.g. "?list=highlights"
    const target = `${GALLERY_API}${search}`;

    const upstream = await fetch(target, {
        method: "GET",
        headers: {
            Accept: request.headers.get("accept") ?? "*/*",
        },
    });

    return new Response(upstream.body, {
        status: upstream.status,
        headers: {
            "Content-Type":
                upstream.headers.get("content-type") ??
                "application/json; charset=utf-8",
        },
    });
};
