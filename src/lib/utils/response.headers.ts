import { NextResponse } from "next/server";

export interface SecurityHeadersConfig {
    enableHSTS?: boolean;
    enableCSP?: boolean;
    cspDirectives?: string[];
    enableXFrameOptions?: boolean;
    enableXContentTypeOptions?: boolean;
    enableReferrerPolicy?: boolean;
    enablePermissionsPolicy?: boolean;
    enableXDNSPrefetchControl?: boolean;
    enableXDownloadOptions?: boolean;
    enableXPermittedCrossDomainPolicies?: boolean;
}

export function addSecurityHeaders(
    response: NextResponse,
    config: SecurityHeadersConfig = {}
): NextResponse {
    const {
        enableHSTS = true,
        enableCSP = true,
        cspDirectives = [],
        enableXFrameOptions = true,
        enableXContentTypeOptions = true,
        enableReferrerPolicy = true,
        enablePermissionsPolicy = true,
        enableXDNSPrefetchControl = true,
        enableXDownloadOptions = true,
        enableXPermittedCrossDomainPolicies = true,
    } = config;

    // --- HSTS ---
    if (enableHSTS) {
        response.headers.set(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains; preload"
        );
    }

    // --- CSP ---
    if (enableCSP) {
        response.headers.set("Content-Security-Policy", cspDirectives.join("; "));
    }

    // --- Other headers ---
    if (enableXFrameOptions) {
        response.headers.set("X-Frame-Options", "DENY");
    }
    if (enableXContentTypeOptions) {
        response.headers.set("X-Content-Type-Options", "nosniff");
    }
    if (enableReferrerPolicy) {
        response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    }
    if (enablePermissionsPolicy) {
        response.headers.set(
            "Permissions-Policy",
            [
                "camera=()",
                "microphone=()",
                "geolocation=()",
                "payment=()",
                "usb=()",
                "magnetometer=()",
                "gyroscope=()",
                "accelerometer=()",
            ].join(", ")
        );
    }
    if (enableXDNSPrefetchControl) {
        response.headers.set("X-DNS-Prefetch-Control", "off");
    }
    if (enableXDownloadOptions) {
        response.headers.set("X-Download-Options", "noopen");
    }
    if (enableXPermittedCrossDomainPolicies) {
        response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
    }

    // Extra
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");

    return response;
}

// Middleware entrypoint
export function securityHeadersMiddleware(
    request: Request,
    config?: SecurityHeadersConfig,
    existingResponse?: NextResponse
) {
    // Use existing response if provided, otherwise create a fresh one
    const response = existingResponse ?? NextResponse.next();
    return addSecurityHeaders(response, config);
}


// Environment configs
export function getSecurityHeadersConfig(): SecurityHeadersConfig {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        enableHSTS: isProduction, // Only prod
        enableCSP: true,
        cspDirectives: isProduction
            ? [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: https:",
                "connect-src 'self' https:",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "upgrade-insecure-requests",
            ]
            :[
                "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:",
                "script-src * 'unsafe-inline' 'unsafe-eval'",
                "style-src * 'unsafe-inline' blob: data:",
                "img-src * data: blob:",
                "connect-src *",
            ],
        enableXFrameOptions: true,
        enableXContentTypeOptions: true,
        enableReferrerPolicy: true,
        enablePermissionsPolicy: true,
        enableXDNSPrefetchControl: true,
        enableXDownloadOptions: true,
        enableXPermittedCrossDomainPolicies: true,
    };
}
