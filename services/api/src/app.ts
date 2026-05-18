import Fastify from "fastify";
import { loadServiceConfig, type ServiceConfig } from "@cqm/shared";
import { registerHealthRoutes } from "./routes/health.js";
import { registerAdminV1Routes } from "./routes/v1/admin.js";
import { registerPublicV1Routes } from "./routes/v1/public.js";

export async function buildApp(config: ServiceConfig = loadServiceConfig()) {
  const app = Fastify({
    logger: {
      level: config.nodeEnv === "production" ? "info" : "debug",
    },
    trustProxy: true,
  });

  if (config.corsOrigins.length > 0) {
    app.addHook("onRequest", async (request, reply) => {
      const origin = request.headers.origin;
      if (!origin || !config.corsOrigins.includes(origin)) return;
      reply.header("Access-Control-Allow-Origin", origin);
      reply.header("Vary", "Origin");
      reply.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PATCH, OPTIONS",
      );
      reply.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Idempotency-Key",
      );
      if (request.method === "OPTIONS") {
        return reply.code(204).send();
      }
    });
  }

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    return reply.code(500).send({ error: "server" });
  });

  await registerHealthRoutes(app, config);
  await registerPublicV1Routes(app, config);
  await registerAdminV1Routes(app, config);

  return app;
}
