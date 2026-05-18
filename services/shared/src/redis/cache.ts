import type { Redis } from "ioredis";

const DEFAULT_TTL_SECONDS = 300;

export const CACHE_KEYS = {
  publicOffices: "cache:public:offices",
  publicTravelerStates: "cache:public:traveler_states",
  publicVaccines: "cache:public:vaccines",
  bookingSettings: "cache:public:booking_settings",
} as const;

export async function cacheGetJson<T>(
  redis: Redis,
  key: string,
): Promise<T | null> {
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSetJson(
  redis: Redis,
  key: string,
  value: unknown,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): Promise<void> {
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

export async function cacheDel(redis: Redis, ...keys: string[]): Promise<void> {
  if (keys.length > 0) await redis.del(...keys);
}
