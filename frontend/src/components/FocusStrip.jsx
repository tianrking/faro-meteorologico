import { Sparkles } from 'lucide-react';

export default function FocusStrip({ focusCities, onCitySelect }) {
  return (
    <section className="focus-strip">
      <div className="focus-title">
        <Sparkles size={17} />
        推荐关注
      </div>
      <div className="focus-cards">
        {focusCities.map((city) => (
          <button className="focus-card" key={city.id ?? city.name} type="button" onClick={() => onCitySelect(city)}>
            <strong>{city.name}</strong>
            <span>
              现在 <b>{Number(city.current ?? 0).toFixed(1)}°C</b>
              <em>预计最高 {Number(city.high ?? 0).toFixed(1)}°C</em>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
