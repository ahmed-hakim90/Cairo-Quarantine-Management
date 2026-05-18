import type { Redis } from "ioredis";

const IDEMPOTENCY_TTL_SECONDS = 86_400;

function idempotencyKey(scope: string, key: string): string {
  return `idempotency:${scope}:${key}`;
}

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
export async function beginIdempotentRequest<T>(
  redis: Redis,
  scope: string,
  key: string,
): Promise<
  | { kind: "execute" }
  | { kind: "replay"; response: T }
  | { kind: "in_flight" }
> {
  const redisKey = idempotencyKey(scope, key);
  const existing = await redis.get(redisKey);
  if (existing) {
    try {
      const parsed = JSON.parse(existing) as IdempotencyRecord<T>;
      if (parsed.status === "completed" && parsed.response !== undefined) {
        return { kind: "replay", response: parsed.response };
      }
      return { kind: "in_flight" };
    } catch {
      return { kind: "in_flight" };
    }
  }

  const pending: IdempotencyRecord = {
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const set = await redis.set(
    redisKey,
    JSON.stringify(pending),
    "EX",
    IDEMPOTENCY_TTL_SECONDS,
    "NX",
  );
  if (set !== "OK") return { kind: "in_flight" };
  return { kind: "execute" };
}

export async function completeIdempotentRequest<T>(
  redis: Redis,
  scope: string,
  key: string,
  response: T,
): Promise<void> {
  const record: IdempotencyRecord<T> = {
    status: "completed",
    response,
    createdAt: new Date().toISOString(),
  };
  await redis.set(
    idempotencyKey(scope, key),
    JSON.stringify(record),
    "EX",
    IDEMPOTENCY_TTL_SECONDS,
  );
}

export async function abortIdempotentRequest(
  redis: Redis,
  scope: string,
  key: string,
): Promise<void> {
  await redis.del(idempotencyKey(scope, key));
}
