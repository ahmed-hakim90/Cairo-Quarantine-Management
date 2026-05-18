import { Redis } from "ioredis";
export declare function getRedis(redisUrl: string): Redis;
export declare function checkRedisHealth(redisUrl: string): Promise<{
    ok: boolean;
    latencyMs?: number;
    error?: string;
}>;
export declare function closeRedis(): Promise<void>;
//# sourceMappingURL=client.d.ts.map