function required(name) {
    const value = process.env[name]?.trim();
    if (!value)
        throw new Error(`Missing required environment variable: ${name}`);
    return value;
}
function optional(name, fallback = "") {
    return process.env[name]?.trim() ?? fallback;
}
export function loadServiceConfig() {
    const nodeEnv = optional("NODE_ENV", "development");
    return {
        nodeEnv,
        databaseUrl: required("DATABASE_URL"),
        redisUrl: required("REDIS_URL"),
        apiPort: Number.parseInt(optional("API_PORT", "3001"), 10) || 3001,
        apiHost: optional("API_HOST", "0.0.0.0"),
        adminApiSecret: optional("ADMIN_API_SECRET"),
        corsOrigins: optional("CORS_ORIGINS", "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
    };
}
