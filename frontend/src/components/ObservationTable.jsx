const config = {
  METAR: {
    title: 'METAR 观测',
    subtitle: '机场例行与特殊天气报文',
    rawHeader: '原始报文',
  },
  历史观测: {
    title: '历史观测',
    subtitle: '天气服务商历史实况数据',
    rawHeader: '天气状况',
  },
};

export default function ObservationTable({ cityName, date, rows, type }) {
  const view = config[type] ?? config.METAR;

  return (
    <section className="panel table-panel">
      <div className="panel-header">
        <div>
          <h2>{view.title}</h2>
          <p>{rows.length} 行 · {cityName} · {date}</p>
        </div>
        <div className="panel-meta">{view.subtitle}</div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>气温</th>
              <th>云量</th>
              <th>风</th>
              <th>气压</th>
              <th>露点</th>
              <th>{view.rawHeader}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.time}-${index}`}>
                <td className="mono">{row.time}</td>
                <td className="strong">{row.temp} °C</td>
                <td>
                  <span className="cloud-pill">{row.cloud}%</span>
                </td>
                <td>{row.wind}</td>
                <td>{row.pressure}</td>
                <td>{row.dew}.0</td>
                <td>{row.raw ?? row.condition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
