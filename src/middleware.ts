// middleware.ts
import { NextRequest } from "next/server";
import {getSecurityHeadersConfig, securityHeadersMiddleware} from "@/lib/utils/response.headers"; // adjust path to where your file lives

export function middleware(request: NextRequest) {
    // Get env-aware config (e.g., only enable HSTS in production)
    const config = getSecurityHeadersConfig();

    // Apply security headers
    return securityHeadersMiddleware(request, config);
}

// Optional: Limit middleware to specific routes
export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
