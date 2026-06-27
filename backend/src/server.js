import { buildApp } from "./app.js";

const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 8080);

const app = await buildApp();

const shutdown = async (signal) => {
  app.log.info({ signal }, "shutting down");
  await app.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
