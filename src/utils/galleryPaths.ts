const ALLOWED_ROOTS = [
    "Highlights",
    "Projects",
    "Services",
    "New Construction",
    "Remodels",
    "Furniture",
    "uploads",
] as const;

export type AllowedRoot = (typeof ALLOWED_ROOTS)[number];

export function sanitizePrefix(raw: string | null): string | null {
    if (!raw) return null;
    // normalize slashes
    const cleaned = raw.replace(/\\/g, "/").trim();
    if (!cleaned) return null;

    const parts = cleaned.split("/").filter(Boolean);

    const root = parts[0];
    if (!ALLOWED_ROOTS.includes(root as AllowedRoot)) return null;

    // disallow traversal and odd segments
    if (parts.some((p) => p === "." || p === "..")) return null;

    // collapse duplicate slashes
    return parts.join("/");
}

/**
 * For single-object operations (delete exact key).
 * You can call this with what the client sends (e.g. prefix + file name).
 */
export function sanitizeKey(raw: string | null): string | null {
    return sanitizePrefix(raw); // for now same semantics
}
