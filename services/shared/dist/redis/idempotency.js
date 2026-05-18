const IDEMPOTENCY_TTL_SECONDS = 86_400;
function idempotencyKey(scope, key) {
    return `idempotency:${scope}:${key}`;
}
/**
 * Returns existing completed response, or null if caller should execute the operation.
 * Use SET NX for pending lock to prevent duplicate writes on retries.
 */
export async function beginIdempotentRequest(redis, scope, key) {
    const redisKey = idempotencyKey(scope, key);
    const existing = await redis.get(redisKey);
    if (existing) {
        try {
            const parsed = JSON.parse(existing);
            if (parsed.status === "completed" && parsed.response !== undefined) {
                return { kind: "replay", response: parsed.response };
            }
            return { kind: "in_flight" };
        }
        catch {
            return { kind: "in_flight" };
        }
    }
    const pending = {
        status: "pending",
        createdAt: new Date().toISOString(),
    };
    const set = await redis.set(redisKey, JSON.stringify(pending), "EX", IDEMPOTENCY_TTL_SECONDS, "NX");
    if (set !== "OK")
        return { kind: "in_flight" };
    return { kind: "execute" };
}
export async function completeIdempotentRequest(redis, scope, key, response) {
    const record = {
        status: "completed",
        response,
        createdAt: new Date().toISOString(),
    };
    await redis.set(idempotencyKey(scope, key), JSON.stringify(record), "EX", IDEMPOTENCY_TTL_SECONDS);
}
export async function abortIdempotentRequest(redis, scope, key) {
    await redis.del(idempotencyKey(scope, key));
}
