import { RateLimiterMemory } from "rate-limiter-flexible";

// Rate limiter for authentication endpoints
export const rate_limit_auth = new RateLimiterMemory({ 
    points: 5, 
    duration: 60,
    keyGenerator: (req: any) => {
        // Use IP address for rate limiting
        const ip = req.headers?.['x-forwarded-for'] || 
                  req.headers?.['x-real-ip'] || 
                  req.connection?.remoteAddress || 
                  'unknown';
        return Array.isArray(ip) ? ip[0] : ip;
    }
});

// Rate limiter for general API endpoints
export const rate_limit_api = new RateLimiterMemory({ 
    points: 100, 
    duration: 60,
    keyGenerator: (req: any) => {
        const ip = req.headers?.['x-forwarded-for'] || 
                  req.headers?.['x-real-ip'] || 
                  req.connection?.remoteAddress || 
                  'unknown';
        return Array.isArray(ip) ? ip[0] : ip;
    }
});

// Rate limiter for sensitive operations
export const rate_limit_sensitive = new RateLimiterMemory({ 
    points: 3, 
    duration: 300, // 5 minutes
    keyGenerator: (req: any) => {
        const ip = req.headers?.['x-forwarded-for'] || 
                  req.headers?.['x-real-ip'] || 
                  req.connection?.remoteAddress || 
                  'unknown';
        return Array.isArray(ip) ? ip[0] : ip;
    }
});

// Helper function to consume rate limit points
export async function consumeRateLimit(limiter: RateLimiterMemory, key: string) {
    try {
        await limiter.consume(key);
        return { success: true };
    } catch (error: any) {
        if (error.msBeforeNext) {
            return { 
                success: false, 
                retryAfter: Math.ceil(error.msBeforeNext / 1000),
                remainingPoints: error.remainingPoints
            };
        }
        throw error;
    }
}