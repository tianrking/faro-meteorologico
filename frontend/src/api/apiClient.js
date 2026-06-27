const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`API ${response.status} ${path}: ${message}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

const withQuery = (path, params) => {
  const query = new URLSearchParams(params);
  return `${path}?${query.toString()}`;
};

export const apiClient = {
  health: () => request('/health'),
  cities: () => request('/cities'),
  status: () => request('/status'),
  recommendations: () => request('/recommendations'),
  dates: (city) => request(withQuery('/dates', { city })),
  forecast: (city, date) => request(withQuery('/forecast', { city, date })),
  metar: (city, date) => request(withQuery('/metar', { city, date })),
  pws: (city, date) => request(withQuery('/pws', { city, date })),
  historical: (city, date) => request(withQuery('/historical', { city, date })),
  weatherCnLive: (city, date) => request(withQuery('/weather-cn-live', { city, date })),
  diffStats: (city, date) => request(withQuery('/diffstats/latest', { city, date })),
  accuracy: (city, date) => request(withQuery('/accuracy/latest', { city, date })),
  historicalMetarMatch: (city, date) => request(withQuery('/historical-metar-match', { city, date })),
  peakMarker: (city, date) => request(withQuery('/peak-marker', { city, date })),
  prediction: (city, date) => request(withQuery('/prediction', { city, date })),
  fetchLog: (city, limit = 100) => request(withQuery('/fetchlog', { city, limit: String(limit) })),
};
