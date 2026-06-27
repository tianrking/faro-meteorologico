import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/apiClient.js';

const initialState = {
  loading: true,
  error: null,
  realData: false,
  prediction: null,
  diffStats: null,
  accuracy: null,
  peakMarker: null,
  fetchLogs: [],
};

export default function useWeatherInsights(cityId, date, refreshToken = 0) {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let cancelled = false;

    async function loadInsights() {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const [prediction, diffStats, accuracy, peakMarker, fetchLog] = await Promise.all([
          apiClient.prediction(cityId, date),
          apiClient.diffStats(cityId, date),
          apiClient.accuracy(cityId, date),
          apiClient.peakMarker(cityId, date),
          apiClient.fetchLog(cityId, 100),
        ]);

        if (cancelled) return;

        setState({
          loading: false,
          error: null,
          realData: Boolean(prediction?.meta?.realData || diffStats?.meta?.realData || accuracy?.meta?.realData || peakMarker?.meta?.realData || fetchLog?.meta?.realData),
          prediction: prediction?.data ?? null,
          diffStats: diffStats?.data ?? null,
          accuracy: accuracy?.data ?? null,
          peakMarker: peakMarker?.data ?? null,
          fetchLogs: Array.isArray(fetchLog?.data) ? fetchLog.data : [],
        });
      } catch (error) {
        if (cancelled) return;
        setState({ ...initialState, loading: false, error });
      }
    }

    if (cityId && date) {
      loadInsights();
    }

    return () => {
      cancelled = true;
    };
  }, [cityId, date, refreshToken]);

  return useMemo(() => state, [state]);
}
