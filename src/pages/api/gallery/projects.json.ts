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

    if (!bucket) {
        console.error("[projects.json] Missing GALLERY_BUCKET binding");
        return new Response(JSON.stringify({ projects: [], error: "R2 not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json; charset=utf-8" },
        });
    }

    try {
        // Map of folderPrefix -> project info
        const folders = new Map<
            string,
            { slug: string; name: string; prefix: string }
        >();

        for (const top of TOP_LEVELS) {
            let cursor: string | undefined;

            do {
                const page = await bucket.list({ prefix: top, cursor, limit: 1000 });
                for (const obj of page.objects ?? []) {
                    const parts = obj.key.split("/");
                    if (parts.length < 3) continue; // need at least top/folder/file

                    const topLevel = parts[0]; // e.g. "Furniture"
                    const folder = parts[1];   // e.g. "Cabinets"

                    if (!topLevel || !folder) continue;

                    const prefix = `${topLevel}/${folder}/`;      // e.g. "Furniture/Cabinets/"
                    const name = `${topLevel}/${folder}`;         // what you display in the list
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
        console.error("[projects.json] error", err);
        return new Response(JSON.stringify({ projects: [], error: "Failed to list projects" }), {
            status: 500,
            headers: { "Content-Type": "application/json; charset=utf-8" },
        });
    }
};
