import { NextRequest, NextResponse } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";
import {request_rate} from "@/lib/utils/request.rate";
import { JWTPayload } from "jose";
import { cookie_append } from "@/lib/utils/cookie";
import {ApiResponse, server_response} from "@/lib/utils/response";
import {request_error} from "@/lib/utils/request.error";
import {request_auth} from "@/lib/utils/request.auth";
import {request_csrf} from "@/lib/utils/request.csrf";

interface ServerRequestOptions {
    disableCSRF?: boolean;
    unprotected?: boolean;
    rateLimiter?: RateLimiterMemory;
}

export function server_request<PARAMS>(
    handler: (req: NextRequest, params?: PARAMS, jwt?: JWTPayload) => Promise<ApiResponse>,
    options: ServerRequestOptions = {}
) {
    return async (req: NextRequest, context: { params: Promise<PARAMS> }): Promise<NextResponse> => {
        try {
            await request_rate(options.rateLimiter, req);
            const csrfCookie = request_csrf(req, !options.disableCSRF);
            const jwt = await request_auth(req, options.unprotected);
            const params = await context.params;
            const result = await handler(req, params && Object.keys(params).length > 0 ? params : undefined, jwt);

            if (csrfCookie) result.headers = cookie_append(result.headers, csrfCookie);
            return server_response(result);

        } catch (err) {
            return request_error(err, handler.name);
        }
    };
}
