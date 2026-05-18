import type { Redis } from "ioredis";
export type IdempotencyStatus = "pending" | "completed";
export type IdempotencyRecord<T = unknown> = {
    status: IdempotencyStatus;
    response?: T;
    createdAt: string;
};
/**
 * Returns existing completed response, or null if caller should execute the operation.
 * Use SET NX for pending lock to prevent duplicate writes on retries.
 */
export declare function beginIdempotentRequest<T>(redis: Redis, scope: string, key: string): Promise<{
    kind: "execute";
} | {
    kind: "replay";
    response: T;
} | {
    kind: "in_flight";
}>;
export declare function completeIdempotentRequest<T>(redis: Redis, scope: string, key: string, response: T): Promise<void>;
export declare function abortIdempotentRequest(redis: Redis, scope: string, key: string): Promise<void>;
//# sourceMappingURL=idempotency.d.ts.map