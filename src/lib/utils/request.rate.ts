// lib/utils/request.rate.ts
import { NextRequest } from "next/server";
import {RateLimiterMemory} from "rate-limiter-flexible";

function get_client_Ip(req: NextRequest): string {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) {
        // First in the list is always the client IP
        const ip = forwardedFor.split(",")[0].trim();
        if (ip) return ip;
    }

    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp;

    // 3. Fallback to localhost (useful in dev)
    return "127.0.0.1";
}

/** Handle rate limiting */
export async function request_rate(rateLimiter: RateLimiterMemory | undefined, req: NextRequest) {
    if (!rateLimiter) return;
    await rateLimiter.consume(get_client_Ip(req));
}
