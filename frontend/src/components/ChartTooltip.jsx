export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <b>{label}</b>
      {payload
        .filter((item) => item.value !== null && item.value !== undefined)
        .map((item) => (
          <span key={item.dataKey} style={{ color: item.color }}>
            {item.name}: {item.value}
          </span>
        ))}
    </div>
  );
}
