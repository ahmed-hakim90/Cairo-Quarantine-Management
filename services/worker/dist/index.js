import { checkDatabaseHealth, checkRedisHealth, closePool, closeRedis, loadServiceConfig, } from "@cqm/shared";
import { runQueueNotifyScan } from "./jobs/queue-notify-scan.js";
import { runRetentionJob } from "./jobs/retention.js";
const config = loadServiceConfig();
const tickMs = Number.parseInt(process.env.WORKER_TICK_MS ?? "120000", 10) || 120_000;
const retentionEveryTicks = Number.parseInt(process.env.WORKER_RETENTION_EVERY_TICKS ?? "6", 10) || 6;
let running = false;
let tickCount = 0;
async function tick() {
    if (running)
        return;
    running = true;
    tickCount += 1;
    const started = Date.now();
    try {
        const [db, redis] = await Promise.all([
            checkDatabaseHealth(config.databaseUrl),
            checkRedisHealth(config.redisUrl),
        ]);
        if (!db.ok || !redis.ok) {
            console.warn("[worker] dependencies not ready", { db, redis });
            return;
        }
        await runQueueNotifyScan(config);
        if (tickCount % retentionEveryTicks === 0) {
            await runRetentionJob(config);
        }
    }
    catch (e) {
        console.error("[worker] tick failed", e);
    }
    finally {
        running = false;
        console.info(`[worker] tick #${tickCount} done in ${Date.now() - started}ms`);
    }
}
async function shutdown() {
    console.info("[worker] shutting down…");
    await closePool();
    await closeRedis();
    process.exit(0);
}
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
console.info(`[worker] starting (tick every ${tickMs}ms, retention every ${retentionEveryTicks} ticks)`);
void tick();
setInterval(() => void tick(), tickMs);
