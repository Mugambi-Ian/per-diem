import { NextRequest, NextResponse } from 'next/server';
import { handleCorsPreflight } from './lib/utils/cors';
import { getSecurityHeaders } from './lib/utils/security.headers';

export function middleware(request: NextRequest) {
    // Handle CORS preflight requests
    const corsResponse = handleCorsPreflight(request);
    if (corsResponse) {
        return corsResponse;
    }

    // Continue with the request
    const response = NextResponse.next();

    // Add security headers to all responses
    const securityHeaders = getSecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
};
