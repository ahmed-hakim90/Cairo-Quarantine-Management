import type { Redis } from "ioredis";
export type RateLimitResult = {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
};
/**
 * Sliding-window counter using Redis INCR + EXPIRE (distributed rate limit).
 */
export declare function checkRedisRateLimit(redis: Redis, args: {
    key: string;
    limit: number;
    windowSeconds: number;
}): Promise<RateLimitResult>;
export declare function clientIpFromHeaders(headers: Record<string, string | string[] | undefined>, scope: string): string;
//# sourceMappingURL=rate-limit.d.ts.map