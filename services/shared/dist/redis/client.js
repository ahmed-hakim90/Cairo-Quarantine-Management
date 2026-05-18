import { Redis } from "ioredis";
let redis = null;
export function getRedis(redisUrl) {
    if (!redis) {
        redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 2,
            lazyConnect: true,
        });
    }
    return redis;
}
export async function checkRedisHealth(redisUrl) {
    const start = Date.now();
    const client = getRedis(redisUrl);
    try {
        if (client.status !== "ready")
            await client.connect();
        const pong = await client.ping();
        if (pong !== "PONG") {
            return { ok: false, error: `unexpected ping: ${pong}` };
        }
        return { ok: true, latencyMs: Date.now() - start };
    }
    catch (e) {
        return {
            ok: false,
            error: e instanceof Error ? e.message : "unknown",
        };
    }
}
export async function closeRedis() {
    if (redis) {
        redis.disconnect();
        redis = null;
    }
}
