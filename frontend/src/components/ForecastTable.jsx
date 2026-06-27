import { Settings2 } from 'lucide-react';
import { useState } from 'react';

const columns = [
  { key: 'time', label: '时间', render: (row) => row.time },
  { key: 'temp', label: '气温', render: (row) => <span className="strong">{row.temp} °C</span> },
  { key: 'cloud', label: '云量', render: (row) => <span className="cloud-pill">{row.cloud}%</span> },
  { key: 'rain', label: '降水', render: (row) => <span className="linkish">{row.rain}</span> },
  { key: 'wind', label: '风', render: (row) => row.wind },
  { key: 'condition', label: '天气状况', render: (row) => row.condition },
  { key: 'pressure', label: '气压', render: (row) => row.pressure },
  { key: 'dew', label: '露点', render: (row) => `${row.dew}.0` },
  { key: 'change', label: '变更', render: (row) => (row.change === '-' ? <span className="muted">-</span> : <span className="change-pill">{row.change}</span>) },
  { key: 'capturedSystem', label: '抓取（系统时）', render: (row) => <span className="mono">{row.capturedSystem}</span> },
  { key: 'capturedLocal', label: '抓取（本地时）', render: (row) => <span className="mono">{row.capturedLocal}</span> },
];

export default function ForecastTable({ cityName, date, forecastRows }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => new Set(columns.map((column) => column.key)));
  const activeColumns = columns.filter((column) => visibleColumns.has(column.key));

  function toggleColumn(key) {
    setVisibleColumns((current) => {
      const next = new Set(current);
      if (next.has(key) && next.size > 1) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <section className="panel table-panel">
      <div className="panel-header">
        <div>
          <h2>预报数据</h2>
          <p>{forecastRows.length} 行 · {cityName} · {date}</p>
        </div>
        <div className="field-menu">
          <button className="ghost-button" type="button" onClick={() => setSettingsOpen((value) => !value)}>
            <Settings2 size={16} />
            字段
          </button>
          {settingsOpen && (
            <div className="field-popover">
              {columns.map((column) => (
                <label key={column.key}>
                  <input type="checkbox" checked={visibleColumns.has(column.key)} onChange={() => toggleColumn(column.key)} />
                  {column.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {activeColumns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {forecastRows.map((row) => (
              <tr key={row.time}>
                {activeColumns.map((column) => (
                  <td key={column.key}>{column.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
