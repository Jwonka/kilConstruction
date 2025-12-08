// @ts-nocheck
export interface Env {
    RESEND_API_KEY: string;
    TO_EMAIL: string;
    FROM_EMAIL: string;
    TURNSTILE_SECRET?: string;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);

        // Only handle POST /api/contact
        if (!(request.method === "POST" && url.pathname === "/api/contact")) {
            return new Response("Not found", { status: 404 });
        }

        const ct = request.headers.get("content-type") || "";
        if (!ct.includes("application/x-www-form-urlencoded")) {
            // Let browsers post default <form> content silently as urlencoded.
            // If JSON is sent, reject (we don't expect it).
            if (ct.includes("application/json")) return new Response("Send as form-urlencoded", { status: 415 });
        }

        try {
            const form = await request.formData();

            // Honeypot
            if ((form.get("company") as string)?.trim()) return redirectBack();

            const name = (form.get("name") as string || "").trim();
            const email = (form.get("email") as string || "").trim();
            const phone = (form.get("phone") as string || "").trim();
            const address = (form.get("address") as string || "").trim();
            const message = (form.get("message") as string || "").trim();
            const cfToken = (form.get("cf-turnstile-response") as string) || "";

            // Basic validation
            if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) {
                return new Response("Invalid input", { status: 400 });
            }

            // Optional: Turnstile verify
            if (env.TURNSTILE_SECRET) {
                const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        secret: env.TURNSTILE_SECRET,
                        response: cfToken,
                        remoteip: request.headers.get("CF-Connecting-IP") || undefined,
                    }),
                }).then(r => r.json() as Promise<{ success: boolean }>);
                if (!verify.success) return new Response("Captcha failed", { status: 400 });
            }

            const subject = `New inquiry from ${name}`;
            const html = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${esc(name)}</p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        <p><strong>Phone:</strong> ${esc(phone)}</p>
        <p><strong>Job Address:</strong> ${esc(address)}</p>
        <p><strong>Message:</strong><br>${esc(message).replace(/\n/g, "<br>")}</p>
        <hr>
        <p>Sent: ${new Date().toISOString()}</p>
      `;

            const r = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${env.RESEND_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: env.FROM_EMAIL,
                    to: [env.TO_EMAIL],
                    subject,
                    html,
                    reply_to: email,
                    tags: [{ name: "source", value: "kilcon.work-contact" }],
                }),
            });

            if (!r.ok) {
                const text = await r.text();
                return new Response(`Email provider error: ${text}`, { status: 502 });
            }

            return redirectBack();

        } catch (e: any) {
            return new Response(`Server error: ${e?.message || "unknown"}`, { status: 500 });
        }
    }
} satisfies ExportedHandler<Env>;

function redirectBack() {
    return new Response(null, { status: 303, headers: { Location: "/contact?sent=1" } });
}
function esc(s: string) {
    return s
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
