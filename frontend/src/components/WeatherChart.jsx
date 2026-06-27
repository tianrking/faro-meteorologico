import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartTooltip from './ChartTooltip.jsx';

const countValues = (rows, key) => rows.filter((row) => row[key] !== null && row[key] !== undefined).length;

const metricValue = (value, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  return Number(value).toFixed(digits);
};

const signedTemp = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  const number = Number(value);
  return `${number >= 0 ? '+' : ''}${number.toFixed(2)} °C`;
};

function diffMetric(stats, key) {
  const item = stats?.[key];
  return {
    value: item?.cumulative_avg_diff_c ?? item?.averageDiffC ?? item?.average_diff_c,
    count: item?.sample_count ?? item?.sampleCount ?? 0,
    hour: item?.latest_hour ?? item?.latestHour,
  };
}

function accuracyMetric(accuracy, key) {
  const item = accuracy?.[key];
  return {
    r: item?.pearson_r ?? item?.pearsonR,
    count: item?.sample_count ?? item?.sampleCount ?? 0,
  };
}

function peakTime(marker) {
  const value = Array.isArray(marker) ? marker[0] : marker;
  return value?.local_time?.slice?.(11, 16) ?? value?.localTime?.slice?.(11, 16) ?? value?.time ?? value?.hour ?? '-';
}

export default function WeatherChart({ cityName, date, hourlySeries, accuracy, diffStats, peakMarker }) {
  const metarDiff = diffMetric(diffStats, 'metar');
  const historicalDiff = diffMetric(diffStats, 'historical');
  const metarAccuracy = accuracyMetric(accuracy, 'metar');
  const historicalAccuracy = accuracyMetric(accuracy, 'historical');
  const peak = peakTime(peakMarker);

  return (
    <section className="panel chart-panel">
      <div className="panel-header">
        <div>
          <h2>逐小时气温</h2>
          <p>{cityName} · {date} · 本地时间</p>
        </div>
        <div className="panel-meta">
          预报 {countValues(hourlySeries, 'forecast')} 点 · METAR {countValues(hourlySeries, 'metar')} 点 · 历史 {countValues(hourlySeries, 'history')} 点 · PWS {countValues(hourlySeries, 'pws')} 点
        </div>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={hourlySeries} margin={{ top: 22, right: 36, left: 8, bottom: 8 }}>
            <CartesianGrid stroke="#263247" vertical={false} />
            <XAxis dataKey="time" stroke="#74839c" tickLine={false} axisLine={false} />
            <YAxis yAxisId="temp" domain={['dataMin - 1', 'dataMax + 1']} stroke="#74839c" tickLine={false} axisLine={false} unit="°C" />
            <YAxis yAxisId="cloud" orientation="right" domain={[0, 100]} stroke="#74839c" tickLine={false} axisLine={false} unit="%" />
            <Tooltip content={<ChartTooltip />} />
            <Area yAxisId="cloud" type="monotone" dataKey="cloud" name="云量" fill="#64748b" fillOpacity={0.24} stroke="#64748b" strokeWidth={1.5} />
            <Line yAxisId="temp" type="monotone" dataKey="forecast" name="预报" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} connectNulls />
            <Line yAxisId="temp" type="monotone" dataKey="metar" name="METAR" stroke="#f97316" strokeWidth={2.5} dot={{ r: 6, fill: '#f97316' }} connectNulls />
            <Line yAxisId="temp" type="monotone" dataKey="history" name="历史" stroke="#22c55e" strokeWidth={2.5} dot={false} connectNulls />
            <Line yAxisId="cloud" type="stepAfter" dataKey="pws" name="PWS" stroke="#a855f7" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="peak-marker">峰值 {peak}</div>
      </div>

      <div className="metrics-grid">
        <div className="metric">
          <span>平均 Δ（实测 - 预报）</span>
          <strong>METAR {signedTemp(metarDiff.value)}</strong>
          <em>n={metarDiff.count}{metarDiff.hour === undefined ? '' : ` @H${metarDiff.hour}`}</em>
        </div>
        <div className="metric">
          <span>历史观测</span>
          <strong>{signedTemp(historicalDiff.value)}</strong>
          <em>n={historicalDiff.count}{historicalDiff.hour === undefined ? '' : ` @H${historicalDiff.hour}`}</em>
        </div>
        <div className="metric warning">
          <span>准确度 PEARSON R</span>
          <strong>METAR r {metricValue(metarAccuracy.r)}</strong>
          <em>{metarAccuracy.count} 个样本</em>
        </div>
        <div className="metric success">
          <span>历史观测 Pearson R</span>
          <strong>{metricValue(historicalAccuracy.r)}</strong>
          <em>{historicalAccuracy.count} 个样本</em>
        </div>
      </div>
    </section>
  );
}
