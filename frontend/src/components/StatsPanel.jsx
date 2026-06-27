function formatTemp(value) {
  if (value === null || value === undefined) return '-';
  const number = Number(value);
  return `${number >= 0 ? '+' : ''}${number.toFixed(2)} °C`;
}

function sampleText(item) {
  if (!item) return '无匹配样本';
  const hour = item.hour ?? item.latestHour ?? item.latest_hour;
  return `${item.sample_count ?? item.sampleCount ?? 0} 个匹配小时${hour === undefined ? '' : ` · H${hour}`}`;
}

export default function StatsPanel({ accuracy, diffStats }) {
  const metarDiff = diffStats?.metar;
  const historicalDiff = diffStats?.historical;
  const metarAccuracy = accuracy?.metar;
  const historicalAccuracy = accuracy?.historical;

  return (
    <section className="panel stats-panel">
      <div className="panel-header">
        <div>
          <h2>偏差统计</h2>
          <p>Observed - Forecast · 累计平均与相关性</p>
        </div>
        <div className="panel-meta">实时统计来自后端 accuracy / diffstats</div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <span>METAR 累计平均偏差</span>
          <strong>{formatTemp(metarDiff?.cumulative_avg_diff_c ?? metarDiff?.averageDiffC ?? metarDiff?.average_diff_c)}</strong>
          <em>{sampleText(metarDiff)}</em>
        </div>
        <div className="stat-card">
          <span>历史观测累计平均偏差</span>
          <strong>{formatTemp(historicalDiff?.cumulative_avg_diff_c ?? historicalDiff?.averageDiffC ?? historicalDiff?.average_diff_c)}</strong>
          <em>{sampleText(historicalDiff)}</em>
        </div>
        <div className="stat-card accent">
          <span>METAR Pearson R</span>
          <strong>{metarAccuracy?.pearson_r?.toFixed?.(2) ?? metarAccuracy?.pearsonR ?? '-'}</strong>
          <em>{metarAccuracy?.sample_count ?? metarAccuracy?.sampleCount ?? 0} 个样本</em>
        </div>
        <div className="stat-card success">
          <span>历史观测 Pearson R</span>
          <strong>{historicalAccuracy?.pearson_r?.toFixed?.(2) ?? historicalAccuracy?.pearsonR ?? '-'}</strong>
          <em>{historicalAccuracy?.sample_count ?? historicalAccuracy?.sampleCount ?? 0} 个样本</em>
        </div>
      </div>
    </section>
  );
}
