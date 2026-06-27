import cors from "@fastify/cors";
import Fastify from "fastify";
import { registerApiRoutes } from "./routes/apiRoutes.js";

export async function buildApp(options = {}) {
  const app = Fastify({
    logger: options.logger ?? true
  });

  await app.register(cors, {
    origin: true,
    methods: ["GET", "OPTIONS"]
  });

  app.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode ?? 500;
    request.log.warn({ err: error, statusCode }, "request failed");
    reply.status(statusCode).send({
      ok: false,
      error: {
        code: statusCode === 400 ? "BAD_REQUEST" : "INTERNAL_ERROR",
        message: error.message
      }
    });
  });

  await registerApiRoutes(app);

  return app;
}
