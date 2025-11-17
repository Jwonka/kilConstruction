import type { APIRoute } from "astro";

// Set your admin credentials securely
const ADMIN_USERNAME = import.meta.env.ADMIN_USER;
const ADMIN_PASSWORD = import.meta.env.ADMIN_PASS;


export const POST: APIRoute = async ({ request, redirect, cookies }) => {
    const formData = await request.formData();
    const username = formData.get("username");
    const password = formData.get("password");

    const valid =
        username === ADMIN_USERNAME && password === ADMIN_PASSWORD;

    if (!valid) {
        return redirect("/admin?error=1");
    }

    // Set a cookie to track session
    cookies.set("admin", "true", {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure: true,
        maxAge: 60 * 60 * 6,
    });

    return redirect("/admin/dashboard");
};
