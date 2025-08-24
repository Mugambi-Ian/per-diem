import { NextRequest } from "next/server";
import { server_generate_csrf_token, server_verify_double_submit } from "@/lib/modules/auth/utils/csrf";
import { server_serialize_cookie } from "@/lib/modules/auth/utils/cookies";

const exclude_csrf_if_missing = ["/api/v1/auth/login", "/api/v1/auth/register"];

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

    // If both token and header are missing, generate a new token
    if (!csrfCookie && !header) {
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

    // If only one of token or header is missing, generate a new token
    if (!csrfCookie || !header) {
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

    // Both token and header exist, verify them
    if (!server_verify_double_submit(csrfCookie, header)) {
        // For excluded paths, generate a new token even if verification fails
        if (isExcludedPath) {
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
        
        throw new Error("CSRF verification failed: mismatch");
    }

    // Always generate a new token after successful verification
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
