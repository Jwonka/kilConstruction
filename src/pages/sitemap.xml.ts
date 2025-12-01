// noinspection SpellCheckingInspection

import type { APIRoute } from "astro";

export const prerender = true; // generate at build time

export const GET: APIRoute = async ({ site }) => {
    // Canonical site origin (from astro.config.mjs `site`, or fallback)
    const origin = site ?? new URL("https://kilcon.work");

    // Core static pages
    const staticPaths = ["/", "/services/", "/projects/", "/contact/"];

    // Collect dynamic project slugs from the gallery API
    let projectSlugs: string[] = [];

    try {
        const api = new URL("/api/gallery-api", origin);
        api.searchParams.set("list", "projects");

        const res = await fetch(api.toString(), { cache: "no-store" });

        if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
            const json = (await res.json()) as { projects?: { slug?: string }[] };

            projectSlugs = (json.projects ?? [])
                .map((p) => p.slug)
                .filter((s): s is string => typeof s === "string" && s.length > 0);
        } else {
            console.warn("sitemap: gallery API returned non-OK or non-JSON response");
        }
    } catch (err) {
        console.error("sitemap: failed to load projects", err);
    }

    // Build full URL list
    const urls = [
        ...staticPaths,
        ...projectSlugs.map((slug) => `/projects/${slug}/`),
    ];

    const xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        urls
            .map((path) => {
                const loc = new URL(path, origin).toString();

                // simple priority / changefreq rules
                const isHome = path === "/";
                const isProjectsIndex = path === "/projects/";
                const isProjectDetail = path.startsWith("/projects/") && path !== "/projects/";

                const priority = isHome
                    ? "1.0"
                    : isProjectsIndex || isProjectDetail
                        ? "0.9"
                        : "0.8";

                const changefreq =
                    isHome || isProjectsIndex || isProjectDetail ? "weekly" : "monthly";

                return [
                    "  <url>",
                    `    <loc>${loc}</loc>`,
                    `    <changefreq>${changefreq}</changefreq>`,
                    `    <priority>${priority}</priority>`,
                    "  </url>",
                ].join("\n");
            })
            .join("\n") +
        `\n</urlset>\n`;

    return new Response(xml, {
        status: 200,
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
        },
    });
};
