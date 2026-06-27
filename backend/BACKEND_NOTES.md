# Weather Backend API

Fastify backend for the weather monitoring dashboard. The backend does not use polywx as a data provider. It uses official or reliable public weather sources and computes Polymarket-oriented analytics locally.

## Run

```bash
npm install
npm start
```

The server listens on `http://127.0.0.1:8080`.

## Implemented Endpoints

- `GET /api/health`
- `GET /api/cities`
- `GET /api/status`
- `GET /api/recommendations`
- `GET /api/dates?city=busan-rkpk`
- `GET /api/forecast?city=busan-rkpk&date=2026-06-27`
- `GET /api/metar?city=busan-rkpk&date=2026-06-27`
- `GET /api/historical?city=busan-rkpk&date=2026-06-27`
- `GET /api/pws?city=busan-rkpk&date=2026-06-27`
- `GET /api/weather-cn-live?city=busan-rkpk&date=2026-06-27`
- `GET /api/diffstats/latest?city=busan-rkpk&date=2026-06-27`
- `GET /api/accuracy/latest?city=busan-rkpk&date=2026-06-27`
- `GET /api/historical-metar-match?city=busan-rkpk&date=2026-06-27`
- `GET /api/peak-marker?city=busan-rkpk&date=2026-06-27`
- `GET /api/prediction?city=busan-rkpk&date=2026-06-27`
- `GET /api/fetchlog?city=busan-rkpk&limit=100`

## Data Providers

- Forecast: Open-Meteo Forecast API
- Historical observations: Open-Meteo Archive API
- METAR/SPECI: NOAA AviationWeather Data API
- Diff stats, accuracy, historical/METAR match, peak marker, prediction: locally derived from official provider rows
- PWS and China live weather: explicitly `not-configured` until a reliable official provider is selected

## Verification

From the repository root:

```bash
node scripts/verify-real-data.mjs
```

The verifier rejects `provider=polywx` responses. Latest local verification on 2026-06-27 passed 500/500 checks across 50 cities with `polywxResponses: 0`.

## Provider Layer

- `src/providers/openMeteoProvider.js`
- `src/providers/aviationWeatherProvider.js`
- `src/providers/http.js`

## Structure

- `src/server.js`: process entrypoint and host/port binding
- `src/app.js`: Fastify construction, CORS, error handling
- `src/routes/apiRoutes.js`: route registration and Zod query validation
- `src/services/weatherRepository.js`: official-provider repository and local analytics boundary
- `src/data/cityMetadata.js`: Polymarket weather market city metadata with airport codes, coordinates, and time zones

## Database Direction

Keep the API envelope stable while replacing real-time fetches with durable storage:

- PostgreSQL tables for city metadata, normalized forecast rows, METAR observations, historical observations, fetch logs, predictions, feedback, and alert rules
- TimescaleDB hypertables for `forecast_hourly`, `metar_observations`, and `historical_observations`
- Redis cache for hot `city/date/status` reads
- Worker jobs for provider polling, prediction recomputation, accuracy/diffstat aggregation, and alert evaluation

Provider payloads should be stored raw before normalization so future audits can explain model drift and data quality issues.
