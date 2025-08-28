// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getSecurityHeadersConfig, securityHeadersMiddleware } from "@/lib/utils/response.headers";
import createMiddleware from "next-intl/middleware";
import { defineRouting } from "next-intl/routing";

// ---- i18n routing ----
export const routing = defineRouting({
    locales: ["en", "fr"],
    defaultLocale: "en",
});

const intlMiddleware = createMiddleware(routing);

// ---- Combined middleware ----
export function middleware(request: NextRequest) {
    // 1. Run intl middleware
    let response = intlMiddleware(request);

    // 2. Ensure we always have a NextResponse
    if (!(response instanceof NextResponse)) {
        response = NextResponse.next();
    }

    // 3. Apply security headers on top
    const config = getSecurityHeadersConfig();
    return securityHeadersMiddleware(request, config, response);
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
