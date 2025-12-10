import crypto from "node:crypto";

function base64urlToBuffer(base64url: string): Buffer {
    const base64 =
        base64url.replace(/-/g, "+").replace(/_/g, "/") +
        "===".slice((base64url.length + 3) % 4);
    return Buffer.from(base64, "base64");
}

/**
 * Verify an admin auth token created by createAdminToken(ADMIN_SECRET).
 * Returns true if:
 *   - structure is payload.signature
 *   - HMAC-SHA256 signature matches
 *   - exp has not passed
 *   - iat is not wildly in the future
 */
export function verifyAdminToken(
    token: string | null | undefined,
    secret: string | null | undefined,
): boolean {
    if (!token || !secret) return false;

    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const [payloadB64, sigB64] = parts;

    // Recompute signature: HMAC-SHA256(payloadB64, secret), base64url
    const expectedSigB64 = crypto
        .createHmac("sha256", secret)
        .update(payloadB64, "utf8")
        .digest("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");

    // Constant-time-ish compare
    if (expectedSigB64.length !== sigB64.length) return false;
    let diff = 0;
    for (let i = 0; i < expectedSigB64.length; i++) {
        diff |= expectedSigB64.charCodeAt(i) ^ sigB64.charCodeAt(i);
    }
    if (diff !== 0) return false;

    // Decode payload and check exp / iat
    try {
        const payloadBuf = base64urlToBuffer(payloadB64);
        const json = payloadBuf.toString("utf8");
        const payload = JSON.parse(json) as { exp?: number; iat?: number };

        if (!payload || typeof payload !== "object") return false;

        const nowSeconds = Math.floor(Date.now() / 1000);

        if (typeof payload.exp !== "number" || payload.exp < nowSeconds) {
            return false; // expired
        }

        if (
            typeof payload.iat === "number" &&
            payload.iat > nowSeconds + 60
        ) {
            return false; // issued too far in the future
        }

        return true;
    } catch {
        return false;
    }
}
