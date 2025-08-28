import { RateLimiterMemory } from "rate-limiter-flexible";

// Rate limiter for authentication endpoints
export const rate_limit_auth = new RateLimiterMemory({ 
    points: 5, 
    duration: 60
});

// Rate limiter for general API endpoints
export const rate_limit_api = new RateLimiterMemory({ 
    points: 100, 
    duration: 60
});

// Rate limiter for sensitive operations
export const rate_limit_sensitive = new RateLimiterMemory({ 
    points: 3, 
    duration: 300 // 5 minutes
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