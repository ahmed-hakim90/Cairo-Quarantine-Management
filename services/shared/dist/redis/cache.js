const DEFAULT_TTL_SECONDS = 300;
export const CACHE_KEYS = {
    publicOffices: "cache:public:offices",
    publicTravelerStates: "cache:public:traveler_states",
    publicVaccines: "cache:public:vaccines",
    bookingSettings: "cache:public:booking_settings",
};
export async function cacheGetJson(redis, key) {
    const raw = await redis.get(key);
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export async function cacheSetJson(redis, key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}
export async function cacheDel(redis, ...keys) {
    if (keys.length > 0)
        await redis.del(...keys);
}
