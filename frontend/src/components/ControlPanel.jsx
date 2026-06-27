import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

export const tabs = [
  { key: 'forecast', label: '预报' },
  { key: 'metar', label: 'METAR' },
  { key: 'historical', label: '历史观测' },
  { key: 'stats', label: '偏差统计' },
  { key: 'logs', label: '抓取日志' },
];

export default function ControlPanel({ activeTab, date, availableDates, onDateChange, onTabChange, sourceStatus }) {
  const dates = availableDates.length ? availableDates : [date].filter(Boolean);
  const currentIndex = dates.indexOf(date);
  const hasPrevious = currentIndex >= 0 && currentIndex < dates.length - 1;
  const hasNext = currentIndex > 0;
  const today = new Date().toISOString().slice(0, 10);
  const todayDate = dates.includes(today) ? today : dates[0] ?? date;

  return (
    <section className="control-panel">
      <div className="source-row">
        {sourceStatus.map((source) => (
          <div className="source-pill" key={source.label}>
            <span className={`health ${source.state}`} />
            <b>{source.label}</b>
            <span>{source.age}</span>
            <em>({source.latency})</em>
          </div>
        ))}
      </div>

      <div className="date-row">
        <button className="square-button" title="前一天" type="button" disabled={!hasPrevious} onClick={() => hasPrevious && onDateChange(dates[currentIndex + 1])}>
          <ChevronLeft size={20} />
        </button>
        <label className="date-picker-label">
          <span>{date}</span>
          <CalendarDays size={16} />
          <select className="date-select" value={date} onChange={(event) => onDateChange(event.target.value)} aria-label="选择日期">
            {dates.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <button className="square-button" title="后一天" type="button" disabled={!hasNext} onClick={() => hasNext && onDateChange(dates[currentIndex - 1])}>
          <ChevronRight size={20} />
        </button>
        <button className="today-button" type="button" onClick={() => onDateChange(todayDate)}>
          今天
        </button>
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button className={tab.key === activeTab ? 'active' : ''} key={tab.key} type="button" onClick={() => onTabChange(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>
    </section>
  );
}
