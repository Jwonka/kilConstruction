import type { APIRoute } from "astro";

const UPSTREAM_BASE = "https://kilconstruction.pages.dev/api/gallery/projects";

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const search = url.search; // ?all=1 etc.

        const upstreamUrl = `${UPSTREAM_BASE}${search}`;
        const upstream = await fetch(upstreamUrl, {
            headers: {
                Accept: "application/json",
            },
        });

        const body = await upstream.text();

        return new Response(body, {
            status: upstream.status,
            headers: {
                "Content-Type":
                    upstream.headers.get("content-type") || "application/json; charset=utf-8",
            },
        });
    } catch (err) {
        console.error("[projects-proxy] error", err);
        return new Response(
            JSON.stringify({ projects: [], error: "Proxy failed" }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },
            }
        );
    }
};
