/**
 * Sliding-window counter using Redis INCR + EXPIRE (distributed rate limit).
 */
export async function checkRedisRateLimit(redis, args) {
    const { key, limit, windowSeconds } = args;
    const redisKey = `rl:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) {
        await redis.expire(redisKey, windowSeconds);
    }
    const ttl = await redis.ttl(redisKey);
    const retryAfterSeconds = ttl > 0 ? ttl : windowSeconds;
    if (count > limit) {
        return { allowed: false, remaining: 0, retryAfterSeconds };
    }
    return {
        allowed: true,
        remaining: Math.max(0, limit - count),
        retryAfterSeconds: 0,
    };
}
export function clientIpFromHeaders(headers, scope) {
    const forwarded = headers["x-forwarded-for"];
    const first = typeof forwarded === "string"
        ? forwarded.split(",")[0]?.trim()
        : Array.isArray(forwarded)
            ? forwarded[0]?.split(",")[0]?.trim()
            : "";
    const realIp = typeof headers["x-real-ip"] === "string" ? headers["x-real-ip"].trim() : "";
    const ip = first || realIp || "unknown";
    return `${scope}:${ip}`;
}
