import { fetchJson } from "./http.js";

function parseMetarTime(value) {
  if (!value) return null;
  return String(value).replace(" ", "T");
}

function cloudCoverPercent(row) {
  const cover = row.cover ?? row.clouds?.at(-1)?.cover;
  const map = {
    CLR: 0,
    SKC: 0,
    FEW: 20,
    SCT: 45,
    BKN: 75,
    OVC: 100
  };
  return map[cover] ?? null;
}

export async function fetchMetar(city, date) {
  const params = new URLSearchParams({
    ids: city.airportCode,
    format: "json",
    hours: "36"
  });
  const url = `https://aviationweather.gov/api/data/metar?${params.toString()}`;
  const payload = await fetchJson(url);
  const rows = (Array.isArray(payload) ? payload : [])
    .map((row, index) => {
      const reportTime = parseMetarTime(row.reportTime ?? row.report_time ?? row.obsTime);
      const temp = row.temp ?? row.temp_c ?? row.temperature_c ?? null;
      const dewPoint = row.dewp ?? row.dewpoint_c ?? row.dew_point_c ?? null;
      const windKts = row.wspd ?? row.wind_speed_kt ?? null;
      const localTime = reportTime;
      const hour = reportTime ? Number(reportTime.slice(11, 13)) : index;

      return {
        id: `${city.airportCode}-${reportTime ?? index}`,
        reportTime,
        time: `${String(hour).padStart(2, "0")}:00`,
        tempC: temp,
        temperature_c: temp,
        raw: row.rawOb ?? row.raw_text ?? row.raw_metar ?? "",
        cloudCoverPct: cloudCoverPercent(row),
        windDirDeg: row.wdir ?? row.wind_dir_degrees ?? null,
        windKph: windKts === null ? null : Math.round(Number(windKts) * 1.852),
        pressureHpa: row.altim ?? row.pressure_hpa ?? null,
        dewPointC: dewPoint,
        fetchedAt: new Date().toISOString(),
        localTime,
        sequence: index + 1
      };
    })
    .filter((row) => !date || !row.reportTime || row.reportTime.slice(0, 10) === date);

  return {
    provider: "aviationweather.gov",
    url,
    rows
  };
}
