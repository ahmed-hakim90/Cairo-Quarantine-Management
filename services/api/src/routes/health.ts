import type { FastifyInstance } from "fastify";
import {
  checkDatabaseHealth,
  checkRedisHealth,
  type ServiceConfig,
} from "@cqm/shared";

export async function registerHealthRoutes(
  app: FastifyInstance,
  config: ServiceConfig,
): Promise<void> {
  app.get("/health", async () => ({
    status: "ok",
    service: "cqm-api",
    timestamp: new Date().toISOString(),
  }));

  app.get("/health/ready", async (_req, reply) => {
    const [db, redis] = await Promise.all([
      checkDatabaseHealth(config.databaseUrl),
      checkRedisHealth(config.redisUrl),
    ]);

    const ready = db.ok && redis.ok;
    const body = {
      status: ready ? "ready" : "degraded",
      checks: { database: db, redis },
      timestamp: new Date().toISOString(),
    };

    return reply.code(ready ? 200 : 503).send(body);
  });
}
