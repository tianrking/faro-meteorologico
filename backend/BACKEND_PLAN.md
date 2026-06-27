# Weather Monitor Backend Plan

## Goal

Build a backend for a Polymarket weather-market assistant: city weather monitoring, forecast-vs-observation accuracy, high-temperature prediction, fetch logs, alerts, feedback, and membership-ready user features.

## Data Source Policy

- Do not depend on `polywx.xyz` or `api.weather.polywx.xyz` as a backend data source.
- Use the reference site only for product comparison, endpoint-shape inspiration, and UI density research.
- Prefer official or reliable public providers and expose provider metadata on every weather response.
- Do not fabricate rows. If no official provider is configured for a resource, return `provider: "not-configured"` and `realData: false`.

## Current Official Providers

- Forecast: Open-Meteo Forecast API.
- Historical hourly observations: Open-Meteo Archive API.
- METAR airport observations: NOAA AviationWeather Data API.
- Derived analytics: computed by this backend from official provider rows.

## API Shape

The frontend uses these stable endpoints:

- `GET /api/cities`
- `GET /api/dates?city=busan-rkpk`
- `GET /api/status`
- `GET /api/recommendations`
- `GET /api/forecast?city=busan-rkpk&date=YYYY-MM-DD`
- `GET /api/metar?city=busan-rkpk&date=YYYY-MM-DD`
- `GET /api/pws?city=busan-rkpk&date=YYYY-MM-DD`
- `GET /api/historical?city=busan-rkpk&date=YYYY-MM-DD`
- `GET /api/weather-cn-live?city=busan-rkpk&date=YYYY-MM-DD`
- `GET /api/diffstats/latest?city=busan-rkpk&date=YYYY-MM-DD`
- `GET /api/accuracy/latest?city=busan-rkpk&date=YYYY-MM-DD`
- `GET /api/historical-metar-match?city=busan-rkpk&date=YYYY-MM-DD`
- `GET /api/peak-marker?city=busan-rkpk&date=YYYY-MM-DD`
- `GET /api/prediction?city=busan-rkpk&date=YYYY-MM-DD`
- `GET /api/fetchlog?city=busan-rkpk&limit=100`

## Recommended Production Stack

- Runtime: Node.js/Fastify is good for the current rapid product loop.
- Go rewrite: reasonable later for polling workers and high-volume ingestion, but not needed before API/data semantics are stable.
- Database: PostgreSQL with TimescaleDB extension if available.
- Query layer: Drizzle ORM or direct SQL for time-series clarity.
- Queue/scheduler: BullMQ + Redis for Node; if rewritten in Go, use cron/worker services plus Redis streams or a durable queue.
- Cache: Redis for hot city/date/status responses.
- Validation: Zod for Node API parameters and provider payload normalization.

## Core Tables

- `cities`: id, name, continent, timezone, airport_code, unit, is_new, enabled, provider_config
- `forecast_hourly`: city_id, local_date, hour, temperature_c, cloud_cover_pct, precip_chance_pct, precip_mm, wind_dir_deg, wind_kph, condition_phrase, pressure_hpa, dew_point_c, fetched_at, snapshot_count
- `metar_observations`: city_id, report_time, temperature_c, raw_metar, cloud_cover_pct, visibility_km, wind_dir_deg, wind_kph, pressure_hpa, dew_point_c, fetched_at
- `historical_observations`: city_id, valid_time, temperature_c, cloud_cover_pct, wind_dir_deg, wind_kph, pressure_hpa, dew_point_c, fetched_at
- `fetch_logs`: source, city_id, ok, message, duration_ms, created_at
- `daily_predictions`: city_id, local_date, method, mu, sigma, buckets_json, generated_at
- `users`: auth_provider, provider_user_id, display_name, avatar_url, created_at
- `feedback_rankings`: client_id, keys_json, custom_text, created_at
- `alerts`: user_id, city_id, type, threshold_json, enabled

## Polling Jobs

- Forecast poller: hourly or provider-specific cadence.
- METAR poller: every 5-10 minutes for airport-backed cities.
- Historical poller: every 30-60 minutes, backfill recent local dates.
- Prediction job: recompute when forecast/observations change.
- Stats job: compute diff stats, Pearson R, overlap.

## First Implementation Milestone

Completed for rapid prototype:

1. Fastify app with `/api/health`, city metadata, weather endpoints, and derived analytics.
2. Frontend hooks call the backend instead of local sample-only state.
3. Official provider adapters for forecast, historical, and METAR.
4. Verification script that rejects `provider=polywx`.

Next production milestone:

1. Add PostgreSQL/TimescaleDB schema and migrations.
2. Add provider pollers and fetch-log persistence.
3. Add market-specific alerting and user feedback persistence.
4. Add provider quality dashboard and per-city source confidence.
