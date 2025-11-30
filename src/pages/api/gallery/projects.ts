import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
    return new Response("hello from /api/gallery/projects", {
        status: 200,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    });
};
