import { cities, defaultCityId, defaultDate } from "../data/cityMetadata.js";
import { fetchMetar } from "../providers/aviationWeatherProvider.js";
import { fetchForecast, fetchHistorical } from "../providers/openMeteoProvider.js";

const round = (value, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return value;
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
};

const normalizeCity = (city) => {
  if (!city) return defaultCityId;
  const lowered = String(city).toLowerCase();
  return cities.find((item) => item.id.toLowerCase() === lowered || item.slug?.toLowerCase() === lowered || item.name.toLowerCase() === lowered)?.id ?? lowered;
};

const getCity = (city) => cities.find((item) => item.id === normalizeCity(city)) ?? cities.find((item) => item.id === defaultCityId);

const withEnvelope = (resource, city, date, data, meta = {}) => ({
  ok: true,
  resource,
  city: normalizeCity(city),
  date: date ?? defaultDate,
  updatedAt: new Date().toISOString(),
  data,
  meta: {
    rows: Array.isArray(data) ? data.length : undefined,
    ...meta
  }
});

const unavailable = (resource, city, date, reason) => withEnvelope(resource, city, date, Array.isArray(reason?.data) ? reason.data : [], {
  provider: "unavailable",
  realData: false,
  fallbackReason: reason?.message ?? String(reason ?? "provider unavailable")
});

function dateRange() {
  const today = new Date();
  const dates = [today.toISOString().slice(0, 10)];

  for (let offset = 1; offset <= 15; offset += 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() + offset);
    dates.push(date.toISOString().slice(0, 10));
  }

  for (let offset = -1; offset >= -14; offset -= 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() + offset);
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates;
}

function hourFromRow(row) {
  if (typeof row.hour === "number") return row.hour;
  const value = row.time ?? row.reportTime ?? row.report_time ?? row.validTime ?? row.valid_time ?? row.localTime;
  const match = String(value ?? "").match(/T?(\d{2}):\d{2}/);
  return match ? Number(match[1]) : null;
}

function readTemp(row) {
  return row.temperature_c ?? row.tempC ?? row.temperature ?? null;
}

function byHour(rows) {
  return rows.reduce((map, row) => {
    const hour = hourFromRow(row);
    if (hour !== null && hour !== undefined && !map.has(hour)) map.set(hour, row);
    return map;
  }, new Map());
}

function pairs(forecastRows, observedRows) {
  const observedByHour = byHour(observedRows);
  return forecastRows
    .map((forecast) => {
      const observed = observedByHour.get(hourFromRow(forecast));
      return observed ? { hour: hourFromRow(forecast), forecast: readTemp(forecast), observed: readTemp(observed) } : null;
    })
    .filter((row) => row && row.forecast !== null && row.observed !== null && row.observed !== undefined);
}

function meanDiff(forecastRows, observedRows) {
  const rows = pairs(forecastRows, observedRows);
  if (!rows.length) return { averageDiffC: null, sampleCount: 0, latestHour: null };
  const averageDiffC = rows.reduce((sum, row) => sum + row.observed - row.forecast, 0) / rows.length;
  return { averageDiffC: round(averageDiffC), sampleCount: rows.length, latestHour: rows.at(-1)?.hour ?? null };
}

function pearson(forecastRows, observedRows) {
  const rows = pairs(forecastRows, observedRows);
  const n = rows.length;
  if (n < 2) return { pearsonR: null, sampleCount: n };
  const meanForecast = rows.reduce((sum, row) => sum + row.forecast, 0) / n;
  const meanObserved = rows.reduce((sum, row) => sum + row.observed, 0) / n;
  const numerator = rows.reduce((sum, row) => sum + (row.forecast - meanForecast) * (row.observed - meanObserved), 0);
  const denomForecast = Math.sqrt(rows.reduce((sum, row) => sum + (row.forecast - meanForecast) ** 2, 0));
  const denomObserved = Math.sqrt(rows.reduce((sum, row) => sum + (row.observed - meanObserved) ** 2, 0));
  return { pearsonR: denomForecast && denomObserved ? round(numerator / (denomForecast * denomObserved), 2) : null, sampleCount: n };
}

async function officialRows(city, date) {
  const selectedCity = getCity(city);
  const [forecastResult, historicalResult, metarResult] = await Promise.allSettled([
    fetchForecast(selectedCity, date),
    fetchHistorical(selectedCity, date),
    fetchMetar(selectedCity, date)
  ]);
  return {
    selectedCity,
    forecast: forecastResult.status === "fulfilled" ? forecastResult.value.rows : [],
    forecastProvider: forecastResult.status === "fulfilled" ? forecastResult.value.provider : "unavailable",
    historical: historicalResult.status === "fulfilled" ? historicalResult.value.rows : [],
    historicalProvider: historicalResult.status === "fulfilled" ? historicalResult.value.provider : "unavailable",
    metar: metarResult.status === "fulfilled" ? metarResult.value.rows : [],
    metarProvider: metarResult.status === "fulfilled" ? metarResult.value.provider : "unavailable"
  };
}

function gaussianBuckets(mean, sigma) {
  const width = Math.max(1, Math.round(sigma || 1));
  const start = Math.floor(mean - 3 * width);
  return Array.from({ length: 7 }, (_, index) => {
    const lo = start + index * width;
    const hi = lo + width;
    const center = (lo + hi) / 2;
    const weight = Math.exp(-((center - mean) ** 2) / (2 * Math.max(0.8, sigma) ** 2));
    return { lo, hi, p: weight };
  }).map((bucket, _, all) => ({ ...bucket, p: round(bucket.p / all.reduce((sum, item) => sum + item.p, 0), 4) }));
}

export function getHealth() {
  return {
    ok: true,
    service: "weather-website-backend",
    version: "0.2.0",
    uptimeSeconds: round(process.uptime(), 3),
    timestamp: new Date().toISOString(),
    dependencies: {
      primaryForecastProvider: "open-meteo.com",
      primaryHistoricalProvider: "open-meteo.com archive",
      primaryMetarProvider: "aviationweather.gov",
      referenceOnly: "polywx.xyz is not used as a backend data provider"
    }
  };
}

export async function listCities() {
  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    data: cities,
    meta: { provider: "local-market-metadata", realData: true, count: cities.length, defaultCity: defaultCityId }
  };
}

export async function getDates(city) {
  return withEnvelope("dates", city, null, dateRange(), { provider: "derived-provider-window", realData: true, timezone: getCity(city).timezone });
}

export async function getStatus() {
  const data = cities.map((city) => ({
    city: city.id,
    forecast: { provider: "open-meteo-forecast", state: "configured" },
    metar: { provider: "aviationweather.gov", station: city.airportCode, state: "configured" },
    historical: { provider: "open-meteo-archive", state: "configured" }
  }));
  return { ok: true, updatedAt: new Date().toISOString(), data, meta: { provider: "official-provider-config", realData: true, rows: data.length } };
}

export async function getRecommendations() {
  const focusIds = ["busan-rkpk", "munich-eddm", "milan-liml", "cape-town-fact", "tokyo-rjtt", "london-eglc"];
  const data = await Promise.all(focusIds.map(async (id) => {
    const city = getCity(id);
    try {
      const result = await fetchForecast(city, defaultDate);
      const temps = result.rows.map(readTemp).filter((value) => value !== null && value !== undefined);
      return { cityId: city.id, name: city.name, currentTemp: temps[0] ?? null, predictedMax: temps.length ? Math.max(...temps) : null, provider: result.provider };
    } catch {
      return { cityId: city.id, name: city.name, currentTemp: null, predictedMax: null, provider: "unavailable" };
    }
  }));
  return { ok: true, updatedAt: new Date().toISOString(), data, meta: { provider: "open-meteo-derived", realData: true, rows: data.length } };
}

export async function getForecast(city, date) {
  const selectedCity = getCity(city);
  try {
    const result = await fetchForecast(selectedCity, date ?? defaultDate);
    return withEnvelope("forecast", selectedCity.id, date, result.rows, { provider: result.provider, realData: true, unit: "celsius", sourceUrl: result.url });
  } catch (error) {
    return unavailable("forecast", selectedCity.id, date, error);
  }
}

export async function getHistorical(city, date) {
  const selectedCity = getCity(city);
  try {
    const result = await fetchHistorical(selectedCity, date ?? defaultDate);
    return withEnvelope("historical", selectedCity.id, date, result.rows, { provider: result.provider, realData: true, sourceUrl: result.url });
  } catch (error) {
    return unavailable("historical", selectedCity.id, date, error);
  }
}

export async function getMetar(city, date) {
  const selectedCity = getCity(city);
  try {
    const result = await fetchMetar(selectedCity, date ?? defaultDate);
    return withEnvelope("metar", selectedCity.id, date, result.rows, { provider: result.provider, realData: true, station: selectedCity.airportCode, sourceUrl: result.url });
  } catch (error) {
    return unavailable("metar", selectedCity.id, date, error);
  }
}

export async function getPws(city, date) {
  return withEnvelope("pws", city, date, [], {
    provider: "not-configured",
    realData: false,
    reason: "No reliable official global PWS provider is configured. Use METAR and Open-Meteo official observations instead."
  });
}

export async function getWeatherCnLive(city, date) {
  return withEnvelope("weather-cn-live", city, date, [], {
    provider: "not-configured",
    realData: false,
    reason: "No official China live weather provider has been configured yet."
  });
}

export async function getDiffStats(city, date) {
  const rows = await officialRows(city, date ?? defaultDate);
  const metar = meanDiff(rows.forecast, rows.metar);
  const historical = meanDiff(rows.forecast, rows.historical);
  return withEnvelope("diffstats/latest", rows.selectedCity.id, date, { metar, historical, latest: { source: "metar", ...metar } }, {
    provider: "official-derived",
    realData: Boolean(rows.forecast.length && (rows.metar.length || rows.historical.length)),
    sources: [rows.forecastProvider, rows.metarProvider, rows.historicalProvider]
  });
}

export async function getAccuracy(city, date) {
  const rows = await officialRows(city, date ?? defaultDate);
  const metar = pearson(rows.forecast, rows.metar);
  const historical = pearson(rows.forecast, rows.historical);
  return withEnvelope("accuracy/latest", rows.selectedCity.id, date, { metar, historical }, {
    provider: "official-derived",
    realData: Boolean(rows.forecast.length && (rows.metar.length || rows.historical.length)),
    sources: [rows.forecastProvider, rows.metarProvider, rows.historicalProvider]
  });
}

export async function getHistoricalMetarMatch(city, date) {
  const rows = await officialRows(city, date ?? defaultDate);
  const metarByHour = byHour(rows.metar);
  const data = rows.historical.map((historical) => {
    const metar = metarByHour.get(hourFromRow(historical));
    return metar ? { hour: hourFromRow(historical), historical, metar, deltaC: round(readTemp(metar) - readTemp(historical)) } : null;
  }).filter(Boolean);
  return withEnvelope("historical-metar-match", rows.selectedCity.id, date, data, { provider: "official-derived", realData: true });
}

export async function getPeakMarker(city, date) {
  const selectedCity = getCity(city);
  try {
    const result = await fetchForecast(selectedCity, date ?? defaultDate);
    const peak = result.rows.reduce((winner, row) => (readTemp(row) > readTemp(winner) ? row : winner), result.rows[0]);
    const data = peak ? { time: peak.time, hour: peak.hour, forecastHighC: readTemp(peak), source: result.provider, label: `Peak ${peak.time}` } : null;
    return withEnvelope("peak-marker", selectedCity.id, date, data, { provider: "open-meteo-derived", realData: Boolean(data) });
  } catch (error) {
    return withEnvelope("peak-marker", selectedCity.id, date, null, { provider: "unavailable", realData: false, fallbackReason: error.message });
  }
}

export async function getPrediction(city, date) {
  const selectedCity = getCity(city);
  try {
    const result = await fetchForecast(selectedCity, date ?? defaultDate);
    const temps = result.rows.map(readTemp).filter((value) => value !== null && value !== undefined);
    const max = temps.length ? Math.max(...temps) : null;
    const mean = temps.length ? temps.reduce((sum, value) => sum + value, 0) / temps.length : 0;
    const sigma = temps.length ? Math.sqrt(temps.reduce((sum, value) => sum + (value - mean) ** 2, 0) / temps.length) : 1;
    const data = {
      method: "Open-Meteo hourly max baseline",
      generatedAt: new Date().toISOString(),
      mu: round(max ?? mean),
      sigma: round(Math.max(0.8, sigma)),
      observedC: null,
      observedSource: null,
      samples: temps.length,
      buckets: gaussianBuckets(max ?? mean, Math.max(0.8, sigma))
    };
    return withEnvelope("prediction", selectedCity.id, date, data, { provider: "open-meteo-derived", realData: true });
  } catch (error) {
    return withEnvelope("prediction", selectedCity.id, date, null, { provider: "unavailable", realData: false, fallbackReason: error.message });
  }
}

export async function getFetchLog(city, limit) {
  const selectedCity = getCity(city);
  const cappedLimit = Math.max(1, Math.min(Number(limit ?? 100), 500));
  const now = new Date().toISOString();
  const rows = [
    { id: `${selectedCity.id}-forecast`, source: "forecast", ok: true, message: "Configured Open-Meteo forecast request", duration_ms: null, created_at: now },
    { id: `${selectedCity.id}-metar`, source: "metar", ok: true, message: `Configured AviationWeather METAR station ${selectedCity.airportCode}`, duration_ms: null, created_at: now },
    { id: `${selectedCity.id}-historical`, source: "historical", ok: true, message: "Configured Open-Meteo archive request", duration_ms: null, created_at: now }
  ].slice(0, cappedLimit);
  return withEnvelope("fetchlog", selectedCity.id, null, rows, { provider: "local-request-plan", realData: true, limit: cappedLimit });
}

