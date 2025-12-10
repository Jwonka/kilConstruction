// Simple in-memory admin session store.
// NOTE: This is per-worker-instance and will reset on deploy
// It keeps session IDs server-side and opaque to clients.
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const ADMIN_SESSIONS = new Map<string, number>(); // sessionId -> createdAt

function generateSessionId(): string {
    // Use crypto if available (Cloudflare Workers have crypto)
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    // Convert to hex
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Create a new admin session and return the opaque session ID.
 * This will be set as the value of the `admin_auth` cookie by the login handler.
 */
export function createAdminSession(): string {
    const id = generateSessionId();
    ADMIN_SESSIONS.set(id, Date.now());
    return id;
}

/**
 * Validate an incoming request's admin session.
 * Returns true if the `admin_auth` cookie maps to a known, non-expired session.
 */
export function hasValidAdminSession(request: Request): boolean {
    const cookie = request.headers.get("Cookie") || "";
    const match = /admin_auth=([^;]+)/.exec(cookie);
    const sessionId = match ? decodeURIComponent(match[1]) : "";

    if (!sessionId) return false;

    const createdAt = ADMIN_SESSIONS.get(sessionId);
    if (!createdAt) return false;

    // Expire old sessions
    if (Date.now() - createdAt > ADMIN_SESSION_TTL_MS) {
        ADMIN_SESSIONS.delete(sessionId);
        return false;
    }

    return true;
}

export function requireAdmin(request: Request): Response | null {
    // If there is no valid admin session, block access.
    if (!hasValidAdminSession(request)) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Auth OK; allow the caller to proceed.
    return null;
}

export function safeEquals(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

// simple in-memory rate limit (per instance) for login attempts
const LOGIN_ATTEMPTS = new Map<string, { count: number; last: number }>();

export function tooManyLoginAttempts(ip: string, max = 20, windowMs = 10 * 60 * 1000): boolean {
    const now = Date.now();
    const rec = LOGIN_ATTEMPTS.get(ip);
    if (!rec) return false;

    // reset window after windowMs
    if (now - rec.last > windowMs) {
        LOGIN_ATTEMPTS.delete(ip);
        return false;
    }
    return rec.count >= max;
}

export function recordLoginAttempt(ip: string, success: boolean) {
    const now = Date.now();
    const rec = LOGIN_ATTEMPTS.get(ip) || { count: 0, last: now };
    if (!success) {
        rec.count++;
        rec.last = now;
        LOGIN_ATTEMPTS.set(ip, rec);
    } else {
        LOGIN_ATTEMPTS.delete(ip);
    }
}
