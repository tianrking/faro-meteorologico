import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/apiClient.js';

const defaultCityId = 'busan-rkpk';

const emptySourceStatus = [
  { label: '预报', age: '等待数据', latency: '0ms', state: 'idle' },
  { label: 'METAR', age: '等待数据', latency: '0ms', state: 'idle' },
  { label: '历史观测', age: '等待数据', latency: '0ms', state: 'idle' },
];

const initialState = {
  apiOnline: false,
  loading: true,
  error: null,
  cities: [],
  focusCities: [],
  sourceStatus: emptySourceStatus,
};

function continentName(continent) {
  const names = {
    Asia: '亚洲',
    Europe: '欧洲',
    Africa: '非洲',
    Americas: '美洲',
    America: '美洲',
    Oceania: '大洋洲',
  };
  return names[continent] ?? continent ?? '其他';
}

function regionFromTimezone(timezone) {
  if (!timezone) return '其他';
  if (timezone.startsWith('Asia/')) return '亚洲';
  if (timezone.startsWith('Europe/')) return '欧洲';
  if (timezone.startsWith('Africa/')) return '非洲';
  if (timezone.startsWith('America/')) return '美洲';
  if (timezone.startsWith('Pacific/') || timezone.startsWith('Australia/')) return '大洋洲';
  return '其他';
}

function airportCodeFromId(id) {
  return id?.split('-').at(-1)?.toUpperCase();
}

function mapApiCity(city) {
  return {
    id: city.id,
    slug: city.slug,
    name: city.name,
    region: city.continent ? continentName(city.continent) : regionFromTimezone(city.timezone),
    timezone: city.timezone,
    airportCode: city.airportCode ?? airportCodeFromId(city.id),
    status: city.id === defaultCityId ? 'active' : city.isNew ? 'new' : 'idle',
    badge: city.isNew ? '新增' : 'Poly',
  };
}

function mapRecommendation(item) {
  return {
    id: item.cityId ?? item.city,
    name: item.name,
    current: item.currentTemp ?? item.currentTempC,
    high: item.predictedMax ?? item.expectedHighC,
  };
}

function ageText(seconds) {
  if (seconds === null || seconds === undefined) return '刚刚';
  if (seconds < 60) return `${Math.round(seconds)} 秒前`;
  return `${Math.round(seconds / 60)} 分钟前`;
}

function mapSourceStatus(statusPayload, selectedCityId = defaultCityId) {
  const raw = statusPayload?.data ?? statusPayload;

  if (Array.isArray(raw)) {
    return raw
      .filter((item) => ['forecast', 'metar', 'historical'].includes(item.source))
      .map((item) => ({
        label: item.source === 'forecast' ? '预报' : item.source === 'historical' ? '历史观测' : 'METAR',
        age: ageText(item.ageSeconds),
        latency: `${item.latencyMs ?? item.duration_ms ?? 0}ms`,
        state: item.state ?? 'ok',
      }));
  }

  const cityStatus = raw?.[selectedCityId] ?? raw?.[defaultCityId] ?? raw;
  const sources = [
    ['forecast', '预报'],
    ['metar', 'METAR'],
    ['historical', '历史观测'],
  ];

  return sources.map(([key, label]) => {
    const source = cityStatus?.[key];
    return {
      label,
      age: source?.last?.created_at ? '刚刚' : '等待数据',
      latency: `${source?.last?.duration_ms ?? source?.last?.durationMs ?? 0}ms`,
      state: source?.last?.ok ? 'ok' : 'idle',
    };
  });
}

export default function useWeatherDashboard(selectedCityId = defaultCityId, refreshToken = 0) {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const [health, apiCities, recommendations, status] = await Promise.all([
          apiClient.health(),
          apiClient.cities(),
          apiClient.recommendations(),
          apiClient.status(),
        ]);

        if (cancelled) return;

        const nextCities = Array.isArray(apiCities?.data) ? apiCities.data.map(mapApiCity) : [];

        setState({
          apiOnline: Boolean(health?.ok),
          loading: false,
          error: null,
          cities: nextCities.map((city) => ({
            ...city,
            status: city.id === selectedCityId ? 'active' : city.status === 'active' ? 'idle' : city.status,
          })),
          focusCities: Array.isArray(recommendations?.data) ? recommendations.data.map(mapRecommendation) : [],
          sourceStatus: status ? mapSourceStatus(status, selectedCityId) : emptySourceStatus,
        });
      } catch (error) {
        if (cancelled) return;
        setState({ ...initialState, loading: false, error });
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [selectedCityId, refreshToken]);

  return useMemo(() => state, [state]);
}
