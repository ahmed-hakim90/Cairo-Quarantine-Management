export type { PoolClient } from "pg";
export type { Redis } from "ioredis";
export { loadServiceConfig, type ServiceConfig } from "./config.js";
export { checkDatabaseHealth, closePool, getPool } from "./db/pool.js";
export { checkRedisHealth, closeRedis, getRedis } from "./redis/client.js";
export { CACHE_KEYS, cacheDel, cacheGetJson, cacheSetJson, } from "./redis/cache.js";
export { abortIdempotentRequest, beginIdempotentRequest, completeIdempotentRequest, } from "./redis/idempotency.js";
export { bumpOfficeDayLastQueueNumber, getOfficeDayLastQueueNumberHint, getQueueTicketLiveState, invalidateQueueTicketLiveState, setQueueTicketLiveState, type QueueTicketLiveState, } from "./redis/queue-state.js";
export { checkRedisRateLimit, clientIpFromHeaders, type RateLimitResult, } from "./redis/rate-limit.js";
//# sourceMappingURL=index.d.ts.map