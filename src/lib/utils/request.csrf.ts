import { NextRequest } from "next/server";
import { server_generate_csrf_token, server_verify_double_submit } from "@/lib/modules/auth/utils/csrf";
import { server_serialize_cookie } from "@/lib/modules/auth/utils/cookies";

const exclude_csrf_if_missing = ["/auth/login", "/auth/register"];

export function request_csrf(req: NextRequest, enabled?: boolean) {
    if (!enabled || req.method.toLowerCase() === "get") return undefined;

    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
        cookieHeader
            .split(";")
            .map((s) => s.trim().split("="))
            .map(([k, ...v]) => [k, decodeURIComponent(v.join("="))])
    );

    const csrfCookie = cookies["csrf_token"] || null;
    const header = req.headers.get("x-csrf-token");
    const url = new URL(req.url);

    const isExcludedPath = exclude_csrf_if_missing.includes(url.pathname);

    if (!csrfCookie || !header) {
        if (!isExcludedPath) {
            throw new Error("CSRF verification failed: missing token");
        }
    } else if (!server_verify_double_submit(csrfCookie, header)) {
        throw new Error("CSRF verification failed: mismatch");
    }

    // Always generate a new token
    const csrf = server_generate_csrf_token();
    const secure = process.env.NODE_ENV === "production";
    const domain = process.env.COOKIE_DOMAIN;

    return server_serialize_cookie("csrf_token", csrf, {
        httpOnly: false,
        secure,
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30),
        domain,
    });
}
