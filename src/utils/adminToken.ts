// NOTE: This module is used in both local dev (Node) and Cloudflare Workers.
// It uses Web Crypto (crypto.subtle) for HMAC and a small base64url helper
// that works in both environments.

const TOKEN_TTL_SECONDS = 12 * 60 * 60; // 12 hours

declare const Buffer: any; // for Node; Cloudflare will use the btoa/atob path

function base64FromBytes(bytes: Uint8Array): string {
    if (typeof btoa === "function") {
        // Browser / Cloudflare Workers: use btoa
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    // Node: use Buffer
    return Buffer.from(bytes).toString("base64");
}

function bytesFromBase64(base64: string): Uint8Array {
    if (typeof atob === "function") {
        // Browser / Cloudflare Workers
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    // Node: use Buffer
    const buf = Buffer.from(base64, "base64");
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

function base64urlEncode(bytes: Uint8Array): string {
    return base64FromBytes(bytes)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function base64urlDecodeToBytes(base64url: string): Uint8Array {
    const base64 =
        base64url.replace(/-/g, "+").replace(/_/g, "/") +
        "===".slice((base64url.length + 3) % 4);
    return bytesFromBase64(base64);
}

async function signPayloadB64(payloadB64: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();

    if (typeof crypto === "undefined" || !crypto.subtle) {
        throw new Error("Web Crypto API (crypto.subtle) is required for admin tokens.");
    }

    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );

    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
    return base64urlEncode(new Uint8Array(sig));
}

function generateSessionId(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return base64urlEncode(bytes);
}

// Create a signed admin token using ADMIN_SECRET.
// Token format: "<base64url(payload json)>.<base64url(HMAC-SHA256)>"
export async function createAdminToken(secret: string): Promise<string> {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const payload = {
        sid: generateSessionId(),
        iat: nowSeconds,
        exp: nowSeconds + TOKEN_TTL_SECONDS,
    };

    const payloadJson = JSON.stringify(payload);
    const payloadB64 = base64urlEncode(new TextEncoder().encode(payloadJson));
    const signature = await signPayloadB64(payloadB64, secret);

    return `${payloadB64}.${signature}`;
}

// Verify an admin token created by createAdminToken(ADMIN_SECRET).
export async function verifyAdminToken(
    token: string | null | undefined,
    secret: string | null | undefined,
): Promise<boolean> {
    if (!token || !secret) return false;

    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const [payloadB64, sigB64] = parts;

    let expectedSigB64: string;
    try {
        expectedSigB64 = await signPayloadB64(payloadB64, secret);
    } catch {
        return false;
    }

    // Constant-time-ish compare
    if (expectedSigB64.length !== sigB64.length) return false;
    let diff = 0;
    for (let i = 0; i < expectedSigB64.length; i++) {
        diff |= expectedSigB64.charCodeAt(i) ^ sigB64.charCodeAt(i);
    }
    if (diff !== 0) return false;

    // Decode payload and check exp / iat
    try {
        const payloadBytes = base64urlDecodeToBytes(payloadB64);
        const json = new TextDecoder().decode(payloadBytes);
        const payload = JSON.parse(json) as { exp?: number; iat?: number };

        if (!payload || typeof payload !== "object") return false;

        const nowSeconds = Math.floor(Date.now() / 1000);

        if (typeof payload.exp !== "number" || payload.exp < nowSeconds) {
            return false; // expired
        }

        if (typeof payload.iat === "number" && payload.iat > nowSeconds + 60) {
            return false; // issued too far in the future
        }

        return true;
    } catch {
        return false;
    }
}
