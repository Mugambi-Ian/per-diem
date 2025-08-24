// lib/auth/csrf.ts
import crypto from "crypto";

export function server_generate_csrf_token() {
    return crypto.randomBytes(24).toString("hex");
}

export function server_verify_double_submit(cookieToken?: string | null, headerToken?: string | null) {
    if (!cookieToken || !headerToken) return false;
    if (cookieToken.length !== headerToken.length) return false;
    // constant-time compare
    return crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
}
