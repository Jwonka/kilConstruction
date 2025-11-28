import type { APIRoute } from "astro";

const GALLERY_API =
    import.meta.env.PUBLIC_GALLERY_API?.replace(/\/$/, "") ||
    "https://kilcon.work/api/gallery"; // fallback so dev doesn't explode

export const GET: APIRoute = async ({ request, url }) => {
    // query string: ?all=1 / ?list=projects / ?project=...
    const search = url.search; // includes leading "?"
    const targetUrl = `${GALLERY_API}${search}`;

    const upstream = await fetch(targetUrl, {
        method: "GET",
        headers: {
            // Pass through accept
            Accept: request.headers.get("accept") ?? "*/*",
        },
    });

    return new Response(upstream.body, {
        status: upstream.status,
        headers: {
            "Content-Type":
                upstream.headers.get("content-type") ?? "application/json; charset=utf-8",
        },
    });
};
