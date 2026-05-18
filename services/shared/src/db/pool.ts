import pg from "pg";

let pool: pg.Pool | null = null;

export function getPool(databaseUrl: string): pg.Pool {
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

export async function checkDatabaseHealth(
  databaseUrl: string,
): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  const client = await getPool(databaseUrl).connect();
  try {
    await client.query("SELECT 1");
    return { ok: true, latencyMs: Date.now() - start };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "unknown",
    };
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
