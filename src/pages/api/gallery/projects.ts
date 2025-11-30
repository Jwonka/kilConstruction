import type { APIRoute } from "astro";

type R2Object = { key: string };
type R2ListOptions = { prefix?: string; cursor?: string; limit?: number };
type R2ListResult = { objects: R2Object[]; truncated: boolean; cursor?: string };
type R2Bucket = {
    list(opts: R2ListOptions): Promise<R2ListResult>;
};

const TOP_LEVELS = [
    "Projects/",
    "Furniture/",
    "Highlights/",
    "New Construction/",
    "Remodels/",
    "Services/",
];

/**
 * Very simple slugifier – matches what you use elsewhere.
 */
function slugify(name: string): string {
    return (
        (name || "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/gi, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "") || "project"
    );
}

export const GET: APIRoute = async ({ locals }) => {
    const env = (locals as any).runtime?.env ?? {};
    const bucket = env.GALLERY_BUCKET as R2Bucket | undefined;

    // In local dev with plain "npm run dev", GALLERY_BUCKET won't exist.
    // Just return an empty list instead of blowing up.
    if (!bucket) {
        console.warn("[projects] No GALLERY_BUCKET in env; returning empty list");
        return new Response(JSON.stringify({ projects: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json; charset=utf-8" },
        });
    }

    try {
        const folders = new Map<
            string,
            { slug: string; name: string; prefix: string }
        >();

        for (const topPrefix of TOP_LEVELS) {
            let cursor: string | undefined;

            do {
                const page = await bucket.list({ prefix: topPrefix, cursor, limit: 1000 });

                for (const obj of page.objects ?? []) {
                    const key = obj.key || "";
                    const parts = key.split("/");
                    if (parts.length < 3) continue; // need at least top/folder/file

                    const topLevel = parts[0];
                    const folder = parts[1];
                    if (!topLevel || !folder) continue;

                    const prefix = `${topLevel}/${folder}/`; // e.g. "Furniture/Cabinets/"
                    const name = `${topLevel}/${folder}`;    // label shown in the list

                    if (!folders.has(prefix)) {
                        folders.set(prefix, {
                            slug: slugify(name),
                            name,
                            prefix,
                        });
                    }
                }

                cursor = page.truncated ? page.cursor : undefined;
            } while (cursor);
        }

        const projects = Array.from(folders.values()).sort((a, b) =>
            a.name.localeCompare(b.name, "en", { sensitivity: "base" })
        );

        return new Response(JSON.stringify({ projects }), {
            status: 200,
            headers: { "Content-Type": "application/json; charset=utf-8" },
        });
    } catch (err) {
        console.error("[projects] error", err);
        return new Response(
            JSON.stringify({ projects: [], error: "Failed to list projects" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json; charset=utf-8" },
            }
        );
    }
};

