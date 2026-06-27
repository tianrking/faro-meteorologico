import { z } from "zod";
import {
  getAccuracy,
  getDates,
  getDiffStats,
  getFetchLog,
  getForecast,
  getHealth,
  getHistorical,
  getHistoricalMetarMatch,
  getMetar,
  getPeakMarker,
  getPrediction,
  getPws,
  getRecommendations,
  getStatus,
  getWeatherCnLive,
  listCities
} from "../services/weatherRepository.js";

const cityDateQuerySchema = z.object({
  city: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

const cityQuerySchema = z.object({
  city: z.string().min(1).optional()
});

const fetchLogQuerySchema = z.object({
  city: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().max(500).optional()
});

function parseQuery(schema, request) {
  const parsed = schema.safeParse(request.query ?? {});
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    const err = new Error(message);
    err.statusCode = 400;
    throw err;
  }
  return parsed.data;
}

export async function registerApiRoutes(fastify) {
  fastify.get("/api/health", async () => getHealth());
  fastify.get("/api/cities", async () => listCities());
  fastify.get("/api/status", async () => getStatus());
  fastify.get("/api/recommendations", async () => getRecommendations());

  fastify.get("/api/dates", async (request) => {
    const { city } = parseQuery(cityQuerySchema, request);
    return getDates(city);
  });

  fastify.get("/api/forecast", async (request) => {
    const { city, date } = parseQuery(cityDateQuerySchema, request);
    return getForecast(city, date);
  });

  fastify.get("/api/metar", async (request) => {
    const { city, date } = parseQuery(cityDateQuerySchema, request);
    return getMetar(city, date);
  });

  fastify.get("/api/pws", async (request) => {
    const { city, date } = parseQuery(cityDateQuerySchema, request);
    return getPws(city, date);
  });

  fastify.get("/api/historical", async (request) => {
    const { city, date } = parseQuery(cityDateQuerySchema, request);
    return getHistorical(city, date);
  });

  fastify.get("/api/weather-cn-live", async (request) => {
    const { city, date } = parseQuery(cityDateQuerySchema, request);
    return getWeatherCnLive(city, date);
  });

  fastify.get("/api/diffstats/latest", async (request) => {
    const { city, date } = parseQuery(cityDateQuerySchema, request);
    return getDiffStats(city, date);
  });

  fastify.get("/api/accuracy/latest", async (request) => {
    const { city, date } = parseQuery(cityDateQuerySchema, request);
    return getAccuracy(city, date);
  });

  fastify.get("/api/historical-metar-match", async (request) => {
    const { city, date } = parseQuery(cityDateQuerySchema, request);
    return getHistoricalMetarMatch(city, date);
  });

  fastify.get("/api/peak-marker", async (request) => {
    const { city, date } = parseQuery(cityDateQuerySchema, request);
    return getPeakMarker(city, date);
  });

  fastify.get("/api/prediction", async (request) => {
    const { city, date } = parseQuery(cityDateQuerySchema, request);
    return getPrediction(city, date);
  });

  fastify.get("/api/fetchlog", async (request) => {
    const { city, limit } = parseQuery(fetchLogQuerySchema, request);
    return getFetchLog(city, limit);
  });
}
