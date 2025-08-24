import {NextResponse} from "next/server";
import { addSecurityHeaders, getSecurityHeadersConfig } from "./response.headers";

export interface ApiResponse<T = unknown> {
    data?: T;
    status?: number;
    success: boolean;
    headers?: Record<string, string>;
    error?: any;
}


function response_serialize(obj: any) {
    return JSON.parse(
        JSON.stringify(obj, (_, value) => (typeof value === "bigint" ? value.toString() : value))
    );
}

/** Send a standardized JSON response with security headers */
export function server_response<T>(payload: ApiResponse<T>, status?: number): NextResponse {
    const {success, data, error, headers = {}, status: payloadStatus} = payload;
    let result: typeof data;
    if (data) result = response_serialize(data);
    
    const response = NextResponse.json(
        {success, data: result, error},
        {
            status: status ?? payloadStatus ?? (success ? 200 : 400),
            headers: {"Content-Type": "application/json", ...headers},
        }
    );

    // Add security headers to all responses
    const securityConfig = getSecurityHeadersConfig();
    return addSecurityHeaders(response, securityConfig);
}

/** Add security headers to any NextResponse */
export function server_set_security_headers(response: NextResponse): NextResponse {
    const securityConfig = getSecurityHeadersConfig();
    return addSecurityHeaders(response, securityConfig);
}
