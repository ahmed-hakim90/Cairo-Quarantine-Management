import pg from "pg";
export declare function getPool(databaseUrl: string): pg.Pool;
export declare function checkDatabaseHealth(databaseUrl: string): Promise<{
    ok: boolean;
    latencyMs?: number;
    error?: string;
}>;
export declare function closePool(): Promise<void>;
//# sourceMappingURL=pool.d.ts.map