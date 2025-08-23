// lib/http/cookies.ts
export function server_serialize_cookie(name: string, value: string, opts: { maxAge?: number; path?: string; httpOnly?: boolean; secure?: boolean; sameSite?: "strict" | "lax" | "none"; domain?: string } = {}) {
    const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
    if (opts.maxAge) parts.push(`Max-Age=${Math.round(opts.maxAge)}`);
    parts.push(`Path=${opts.path ?? "/"}`);
    if (opts.httpOnly) parts.push("HttpOnly");
    if (opts.secure) parts.push("Secure");
    if (opts.sameSite) parts.push(`SameSite=${opts.sameSite ?? "Strict"}`);
    if (opts.domain) parts.push(`Domain=${opts.domain}`);
    return parts.join("; ");
}
