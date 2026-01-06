const ALLOWED_ROOTS = [
    "Highlights",
    "Projects",
    "New Construction",
    "Remodels",
    "Furniture",
    "Apparel",
] as const;

export type AllowedRoot = (typeof ALLOWED_ROOTS)[number];

const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i;

function normalize(raw: string) {
    return raw.replace(/\\/g, "/").trim();
}

/**
 * For folder/prefix operations (list-images, delete-project, rename-prefix).
 * Allows e.g. "Projects/Foo" or "Projects/Foo/".
 */
export function sanitizePrefix(raw: string | null): string | null {
    if (!raw) return null;

    const cleaned = normalize(raw);
    if (!cleaned) return null;

    const parts = cleaned.split("/").filter(Boolean);
    if (!parts.length) return null;

    const root = parts[0];
    if (!ALLOWED_ROOTS.includes(root as AllowedRoot)) return null;

    // disallow traversal and odd segments
    if (parts.some((p) => p === "." || p === "..")) return null;

    return parts.join("/");
}

/**
 * For single-object operations (delete exact key, rename oldKey/newKey, upload fieldName).
 * Must be a file, not a directory marker.
 */
export function sanitizeKey(raw: string | null): string | null {
    const cleaned = sanitizePrefix(raw);
    if (!cleaned) return null;

    // reject directory-marker keys
    if (cleaned.endsWith("/")) return null;

    const parts = cleaned.split("/").filter(Boolean);
    if (parts.length < 2) return null; // must include root + filename at minimum

    const root = parts[0];

    // Highlights must be flat: Highlights/<file>
    if (root === "Highlights") {
        if (parts.length !== 2) return null;
    }

    const file = parts[parts.length - 1];
    if (!file || file === "." || file === "..") return null;

    // enforce image extension for gallery keys
    if (!IMAGE_EXT.test(file)) return null;

    return cleaned;
}
