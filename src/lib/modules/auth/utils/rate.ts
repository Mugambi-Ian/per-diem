import { RateLimiterMemory } from "rate-limiter-flexible";
export const rate_limit_auth = new RateLimiterMemory({ points: 5, duration: 60 });