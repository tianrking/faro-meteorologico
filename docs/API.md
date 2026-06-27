# Weather Website API

后端不依赖 `polywx.xyz` 或 `api.weather.polywx.xyz`。polywx 只作为 UI/字段参考。本项目后端使用官方或可靠公开数据源：Open-Meteo、NOAA AviationWeather，以及由这些数据计算出来的派生指标。

## Base URLs

- Frontend dev: `http://127.0.0.1:5173`
- Backend dev: `http://127.0.0.1:8080`
- Frontend proxy prefix: `/api`

## Providers

| Domain | Provider | Notes |
| --- | --- | --- |
| Forecast | Open-Meteo Forecast API | 全球经纬度 forecast |
| Historical | Open-Meteo Archive API | 历史小时数据 |
| METAR | NOAA AviationWeather Data API | 机场 METAR/SPECI |
| Stats / Prediction | Local derived | 从 forecast/historical/METAR 派生 |
| PWS | not-configured | 没有可靠官方全球 PWS 源时不伪造 |
| China live | not-configured | 没有官方源时不伪造 |

## Endpoints

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
- `GET /api/fetchlog?city=busan-rkpk&limit=20`

## Envelope

```json
{
  "ok": true,
  "resource": "forecast",
  "city": "busan-rkpk",
  "date": "2026-06-27",
  "updatedAt": "2026-06-27T00:00:00.000Z",
  "data": [],
  "meta": {
    "provider": "open-meteo-forecast",
    "realData": true,
    "rows": 24
  }
}
```

## Verification

```bash
node scripts/verify-real-data.mjs
```

The verifier fails if any checked endpoint returns `provider=polywx`.

Latest local verification on 2026-06-27 checked 50 cities and 500 endpoint responses against `http://127.0.0.1:18080/api`: `failed=0`, `polywxResponses=0`.


