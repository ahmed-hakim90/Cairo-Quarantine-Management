import pg from "pg";
let pool = null;
export function getPool(databaseUrl) {
    if (!pool) {
        pool = new pg.Pool({
            connectionString: databaseUrl,
            max: Number.parseInt(process.env.PG_POOL_MAX ?? "20", 10) || 20,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 10_000,
        });
    }
    return pool;
}
export async function checkDatabaseHealth(databaseUrl) {
    const start = Date.now();
    const client = await getPool(databaseUrl).connect();
    try {
        await client.query("SELECT 1");
        return { ok: true, latencyMs: Date.now() - start };
    }
    catch (e) {
        return {
            ok: false,
            error: e instanceof Error ? e.message : "unknown",
        };
    }
    finally {
        client.release();
    }
}
export async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}
