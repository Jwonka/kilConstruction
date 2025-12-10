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
