import { closePool, closeRedis, loadServiceConfig } from "@cqm/shared";
import { buildApp } from "./app.js";

const config = loadServiceConfig();
const app = await buildApp(config);

async function shutdown() {
  app.log.info("Shutting down API…");
  await app.close();
  await closePool();
  await closeRedis();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

try {
  await app.listen({ port: config.apiPort, host: config.apiHost });
  app.log.info(`API listening on ${config.apiHost}:${config.apiPort}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
