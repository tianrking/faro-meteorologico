import { fetchJson } from "./http.js";

const forecastHourly = [
  "temperature_2m",
  "cloud_cover",
  "precipitation_probability",
  "precipitation",
  "wind_direction_10m",
  "wind_speed_10m",
  "surface_pressure",
  "dew_point_2m",
  "weather_code"
];

const historicalHourly = [
  "temperature_2m",
  "cloud_cover",
  "precipitation",
  "wind_direction_10m",
  "wind_speed_10m",
  "surface_pressure",
  "dew_point_2m",
  "weather_code"
];

function buildUrl(baseUrl, city, date, hourly) {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    timezone: city.timezone,
    start_date: date,
    end_date: date,
    hourly: hourly.join(","),
    wind_speed_unit: "kmh",
    temperature_unit: "celsius",
    precipitation_unit: "mm"
  });
  return `${baseUrl}?${params.toString()}`;
}

function hourFromLocalTime(value) {
  return Number(String(value).slice(11, 13));
}

function weatherCodeToCondition(code) {
  const conditions = {
    0: "Clear",
    1: "Mostly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime Fog",
    51: "Light Drizzle",
    53: "Drizzle",
    55: "Heavy Drizzle",
    61: "Light Rain",
    63: "Rain",
    65: "Heavy Rain",
    71: "Light Snow",
    73: "Snow",
    75: "Heavy Snow",
    80: "Rain Showers",
    81: "Showers",
    82: "Heavy Showers",
    95: "Thunderstorm"
  };
  return conditions[code] ?? `Weather code ${code}`;
}

function rowAt(hourly, index) {
  const localTime = hourly.time[index];
  const hour = hourFromLocalTime(localTime);
  const temp = hourly.temperature_2m?.[index] ?? null;
  const cloud = hourly.cloud_cover?.[index] ?? null;
  const precipProbability = hourly.precipitation_probability?.[index] ?? null;
  const precipMm = hourly.precipitation?.[index] ?? null;
  const windDir = hourly.wind_direction_10m?.[index] ?? null;
  const windSpeed = hourly.wind_speed_10m?.[index] ?? null;
  const pressure = hourly.surface_pressure?.[index] ?? null;
  const dewPoint = hourly.dew_point_2m?.[index] ?? null;
  const weatherCode = hourly.weather_code?.[index] ?? null;

  return {
    time: `${String(hour).padStart(2, "0")}:00`,
    hour,
    tempC: temp,
    temperature_c: temp,
    cloudCoverPct: cloud,
    precipChancePct: precipProbability,
    precipMm,
    windDirDeg: windDir,
    windKph: windSpeed,
    condition: weatherCodeToCondition(weatherCode),
    pressureHpa: pressure,
    dewPointC: dewPoint,
    weatherCode,
    fetchedAt: new Date().toISOString(),
    localTime,
    snapshotCount: 1
  };
}

function normalizeHourly(payload) {
  const hourly = payload.hourly ?? {};
  const length = hourly.time?.length ?? 0;
  return Array.from({ length }, (_, index) => rowAt(hourly, index));
}

export async function fetchForecast(city, date) {
  const url = buildUrl("https://api.open-meteo.com/v1/forecast", city, date, forecastHourly);
  const payload = await fetchJson(url);
  return {
    provider: "open-meteo-forecast",
    url,
    rows: normalizeHourly(payload)
  };
}

export async function fetchHistorical(city, date) {
  const url = buildUrl("https://archive-api.open-meteo.com/v1/archive", city, date, historicalHourly);
  const payload = await fetchJson(url);
  return {
    provider: "open-meteo-archive",
    url,
    rows: normalizeHourly(payload).map((row) => ({
      validTime: row.localTime,
      time: row.time,
      tempC: row.tempC,
      temperature_c: row.temperature_c,
      cloudCoverPct: row.cloudCoverPct,
      windDirDeg: row.windDirDeg,
      windKph: row.windKph,
      pressureHpa: row.pressureHpa,
      dewPointC: row.dewPointC,
      condition: row.condition,
      fetchedAt: row.fetchedAt
    }))
  };
}
