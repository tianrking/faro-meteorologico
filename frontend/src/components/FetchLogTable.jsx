export default function FetchLogTable({ fetchLogs = [] }) {
  return (
    <section className="panel table-panel">
      <div className="panel-header">
        <div>
          <h2>抓取日志</h2>
          <p>最近 {fetchLogs.length} 条 · 真实后端抓取记录</p>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>来源</th>
              <th>状态</th>
              <th>消息</th>
              <th>耗时</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {fetchLogs.map((log) => (
              <tr key={log.id}>
                <td className="mono">{log.id}</td>
                <td>{log.source}</td>
                <td>{log.ok ? <span className="ok-pill">OK</span> : <span className="fail-pill">FAIL</span>}</td>
                <td>{log.message}</td>
                <td>{log.duration_ms ?? log.durationMs ?? log.duration}ms</td>
                <td className="mono">{log.created_at ?? log.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
