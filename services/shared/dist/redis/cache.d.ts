import type { Redis } from "ioredis";
export declare const CACHE_KEYS: {
    readonly publicOffices: "cache:public:offices";
    readonly publicTravelerStates: "cache:public:traveler_states";
    readonly publicVaccines: "cache:public:vaccines";
    readonly bookingSettings: "cache:public:booking_settings";
};
export declare function cacheGetJson<T>(redis: Redis, key: string): Promise<T | null>;
export declare function cacheSetJson(redis: Redis, key: string, value: unknown, ttlSeconds?: number): Promise<void>;
export declare function cacheDel(redis: Redis, ...keys: string[]): Promise<void>;
//# sourceMappingURL=cache.d.ts.map