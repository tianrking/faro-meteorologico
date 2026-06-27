import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/apiClient.js';

const defaultDate = new Date().toISOString().slice(0, 10);

const initialState = {
  loading: true,
  error: null,
  realData: false,
  date: defaultDate,
  availableDates: [],
  hourlySeries: [],
  forecastRows: [],
  metarRows: [],
  historicalRows: [],
};

function unwrap(payload) {
  return Array.isArray(payload?.data) ? payload.data : [];
}

function byHour(rows, getHour) {
  return rows.reduce((map, row) => {
    const hour = getHour(row);
    if (hour !== null && hour !== undefined && !map.has(hour)) {
      map.set(hour, row);
    }
    return map;
  }, new Map());
}

function hourFromRow(row) {
  if (typeof row.hour === 'number') return row.hour;
  const value = row.time ?? row.report_time ?? row.reportTime ?? row.valid_time ?? row.validTime ?? row.localTime ?? row.local_time;
  const match = String(value).match(/T?(\d{2}):\d{2}/);
  return match ? Number(match[1]) : null;
}

function readTemp(row) {
  return row.temperature_c ?? row.tempC ?? row.temperature ?? null;
}

function mapSeries(forecast, metar, historical, pws) {
  const metarByHour = byHour(metar, hourFromRow);
  const historicalByHour = byHour(historical, hourFromRow);
  const pwsByHour = byHour(pws, hourFromRow);

  return forecast.map((row) => {
    const hour = hourFromRow(row);
    const metarRow = metarByHour.get(hour);
    const historicalRow = historicalByHour.get(hour);
    const pwsRow = pwsByHour.get(hour);
    return {
      time: row.time ?? `${String(hour).padStart(2, '0')}:00`,
      forecast: readTemp(row),
      metar: metarRow ? readTemp(metarRow) : null,
      history: historicalRow ? readTemp(historicalRow) : null,
      pws: pwsRow ? readTemp(pwsRow) : null,
      cloud: row.cloudCoverPct ?? row.cloud_cover_pct ?? 0,
    };
  });
}

function mapForecastRows(rows) {
  return rows.map((row) => ({
    time: row.time ?? `${String(row.hour ?? 0).padStart(2, '0')}:00`,
    temp: readTemp(row),
    cloud: row.cloudCoverPct ?? row.cloud_cover_pct ?? 0,
    rain: `${row.precipChancePct ?? row.precip_chance_pct ?? 0}% / ${row.precipMm ?? row.precip_mm ?? 0}`,
    wind: `${row.windDirDeg ?? row.wind_dir_deg ?? '-'}° ${row.windKph ?? row.wind_kph ?? '-'} km/h`,
    condition: row.condition ?? row.condition_phrase ?? '-',
    pressure: row.pressureHpa ?? row.pressure_hpa ?? '-',
    dew: row.dewPointC ?? row.dew_point_c ?? '-',
    change: row.snapshotCount ?? row.snapshot_count ? `↻ ${row.snapshotCount ?? row.snapshot_count}` : '-',
    capturedSystem: row.fetchedAt ?? row.fetched_at ?? '-',
    capturedLocal: row.localTime ?? row.local_time ?? '-',
  }));
}

function mapObservationRows(rows, rawField) {
  return rows.map((row) => ({
    time: row.report_time ?? row.reportTime ?? row.valid_time ?? row.validTime ?? row.observation_time ?? row.observationTime ?? row.localTime ?? row.local_time ?? row.time,
    temp: readTemp(row),
    raw: rawField === 'raw' ? row.raw ?? row.raw_metar : undefined,
    condition: rawField === 'condition' ? row.condition ?? row.wx_string : undefined,
    cloud: row.cloudCoverPct ?? row.cloud_cover_pct ?? 0,
    wind: `${row.windDirDeg ?? row.wind_dir_deg ?? '-'}° ${row.windKph ?? row.wind_kph ?? '-'} km/h`,
    pressure: row.pressureHpa ?? row.pressure_hpa ?? '-',
    dew: row.dewPointC ?? row.dew_point_c ?? '-',
  }));
}

function normalizeDateRows(rows) {
  return rows.map((item) => (typeof item === 'string' ? item : item.date)).filter(Boolean);
}

export default function useWeatherRecords(cityId, preferredDate = defaultDate, refreshToken = 0) {
  const hasPreferredDate = Boolean(preferredDate);
  const requestedDate = hasPreferredDate ? preferredDate : defaultDate;
  const [state, setState] = useState({ ...initialState, date: requestedDate });

  useEffect(() => {
    let cancelled = false;

    async function loadRecords() {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const datesPayload = await apiClient.dates(cityId);
        const availableDates = normalizeDateRows(unwrap(datesPayload));
        const date = hasPreferredDate && availableDates.includes(requestedDate) ? requestedDate : availableDates[0] ?? requestedDate;

        const [forecastPayload, metarPayload, pwsPayload, historicalPayload] = await Promise.all([
          apiClient.forecast(cityId, date),
          apiClient.metar(cityId, date),
          apiClient.pws(cityId, date),
          apiClient.historical(cityId, date),
        ]);

        const forecast = unwrap(forecastPayload);
        const metar = unwrap(metarPayload);
        const pws = unwrap(pwsPayload);
        const historical = unwrap(historicalPayload);

        if (cancelled) return;

        setState({
          loading: false,
          error: null,
          date,
          availableDates,
          realData: Boolean(forecastPayload?.meta?.realData || metarPayload?.meta?.realData || pwsPayload?.meta?.realData || historicalPayload?.meta?.realData),
          hourlySeries: forecast.length ? mapSeries(forecast, metar, historical, pws) : [],
          forecastRows: forecast.length ? mapForecastRows(forecast) : [],
          metarRows: metar.length ? mapObservationRows(metar, 'raw') : [],
          historicalRows: historical.length ? mapObservationRows(historical, 'condition') : [],
        });
      } catch (error) {
        if (cancelled) return;
        setState({ ...initialState, loading: false, error, date: requestedDate, availableDates: [] });
      }
    }

    if (cityId) {
      loadRecords();
    }

    return () => {
      cancelled = true;
    };
  }, [cityId, requestedDate, refreshToken]);

  return useMemo(() => state, [state]);
}

