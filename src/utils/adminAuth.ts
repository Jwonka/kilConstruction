export function safeEquals(a: string | undefined, b: string | undefined): boolean {
    if (typeof a !== "string" || typeof b !== "string") return false;
    if (a.length !== b.length) return false;

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

// Very simple in-memory login attempt tracking
// (resets when the serverless instance is recycled)
type AttemptInfo = { count: number; last: number };
const attempts = new Map<string, AttemptInfo>();

export function tooManyLoginAttempts(ip: string, limit = 10, windowMs = 15 * 60 * 1000): boolean {
    const info = attempts.get(ip);
    if (!info) return false;

    const now = Date.now();
    if (now - info.last > windowMs) {
        attempts.delete(ip);
        return false;
    }
    return info.count >= limit;
}

export function recordLoginAttempt(ip: string, success: boolean): void {
    const now = Date.now();
    const info = attempts.get(ip) ?? { count: 0, last: now };

    if (success) {
        attempts.delete(ip);
        return;
    }

    info.count += 1;
    info.last = now;
    attempts.set(ip, info);
}

// Extract ADMIN_SECRET from either env object or a direct string
function resolveAdminSecret(envOrSecret: any): string | undefined {
    if (!envOrSecret) return undefined;
    if (typeof envOrSecret === "string") return envOrSecret;
    if (typeof envOrSecret === "object") {
        return envOrSecret.ADMIN_SECRET ?? envOrSecret.ADMIN_KEY;
    }
    return undefined;
}

// Main guard used by API routes
export function requireAdmin(
    request: Request | undefined,
    envOrSecret: any
): Response | null {
    if (!request) {
        return new Response("Unauthorized", { status: 401 });
    }

    const secret = resolveAdminSecret(envOrSecret);
    if (!secret) {
        console.error("[requireAdmin] Missing ADMIN_SECRET/ADMIN_KEY");
        return new Response("Unauthorized", { status: 401 });
    }

    const cookieHeader = request.headers.get("cookie") ?? "";
    const match = cookieHeader.match(/(?:^|;\s*)admin_auth=([^;]+)/i);
    if (!match) {
        return new Response("Unauthorized", { status: 401 });
    }

    const cookieValue = decodeURIComponent(match[1]);

    if (!safeEquals(cookieValue, secret)) {
        return new Response("Unauthorized", { status: 401 });
    }

    return null;
}