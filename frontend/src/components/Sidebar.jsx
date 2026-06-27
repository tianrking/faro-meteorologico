import { ChevronDown, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

const groupOptions = [
  { value: 'continent', label: '按洲' },
  { value: 'timezone', label: '按时区' },
  { value: 'letter', label: '字母' },
];

function cityGroup(city, mode) {
  if (mode === 'timezone') return city.timezone?.split('/')[0] ?? '其他';
  if (mode === 'letter') return city.name?.[0]?.toUpperCase() ?? '#';
  return city.region ?? '其他';
}

export default function Sidebar({ cities, hidden, onCitySelect }) {
  const [query, setQuery] = useState('');
  const [groupMode, setGroupMode] = useState('continent');

  const cityGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return cities
      .filter((city) => {
        if (!normalizedQuery) return true;
        return [city.name, city.id, city.airportCode, city.timezone].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedQuery));
      })
      .reduce((groups, city) => {
        const region = cityGroup(city, groupMode);
        groups[region] = [...(groups[region] ?? []), city];
        return groups;
      }, {});
  }, [cities, groupMode, query]);

  if (hidden) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-label">城市</div>
        <label className="region-select">
          {groupOptions.find((option) => option.value === groupMode)?.label}
          <ChevronDown size={16} />
          <select value={groupMode} onChange={(event) => setGroupMode(event.target.value)} aria-label="城市分组方式">
            {groupOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="search-box">
        <Search size={15} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索城市或机场" />
      </label>

      {Object.entries(cityGroups).map(([region, regionCities]) => (
        <div className="city-group" key={region}>
          <div className="group-title">{region}</div>
          <nav className="city-list" aria-label={`${region}城市列表`}>
            {regionCities.map((city) => (
              <button className={`city-item ${city.status}`} key={city.id ?? city.name} type="button" onClick={() => onCitySelect(city)}>
                <span className="city-dot" />
                <span className="city-name">{city.name}</span>
                {city.badge && <span className={`city-badge ${city.status}`}>{city.badge}</span>}
              </button>
            ))}
          </nav>
        </div>
      ))}
    </aside>
  );
}
