import { Bell, LineChart, Target, TrendingUp } from 'lucide-react';

const ideaCards = [
  {
    title: 'Multi-city comparison',
    body: 'Compare several weather markets on one chart and spot regional temperature patterns.',
  },
  {
    title: 'Custom temperature alerts',
    body: 'Set your own threshold and receive an alert when live observations approach it.',
  },
  {
    title: 'Contract price integration',
    body: 'Next step: connect Polymarket prices so model probability can be compared with market odds.',
  },
  {
    title: 'Trend change alerts',
    body: 'Detect when observed temperature starts rising or falling faster than expected.',
  },
];

const icons = [LineChart, Bell, Target, TrendingUp];

function bucketLabel(bucket) {
  if (bucket.label) return bucket.label;
  const lo = bucket.lo ?? bucket.minC;
  const hi = bucket.hi ?? bucket.maxC;
  if (lo === null || lo === undefined) return `< ${hi}°C`;
  if (hi === null || hi === undefined) return `> ${lo}°C`;
  return `${lo}-${hi}°C`;
}

function normalizePrediction(prediction) {
  const mean = prediction?.mu ?? prediction?.meanC ?? 0;
  const sigma = prediction?.sigma ?? prediction?.sigmaC ?? 0;
  const buckets = Array.isArray(prediction?.buckets) ? prediction.buckets : [];
  const sorted = buckets
    .map((bucket) => ({ ...bucket, probability: bucket.p ?? bucket.probability ?? 0 }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 8)
    .sort((a, b) => (a.lo ?? a.minC ?? 0) - (b.lo ?? b.minC ?? 0));

  return {
    method: prediction?.method ?? 'DEB',
    generatedAt: prediction?.generated_at ?? prediction?.generatedAt,
    mean,
    sigma,
    observed: prediction?.observedC,
    observedSource: prediction?.observedSource,
    samples: prediction?.samples,
    buckets: sorted,
  };
}

export default function PredictionPanel({ prediction }) {
  const view = normalizePrediction(prediction);
  const generatedText = view.generatedAt
    ? `Updated ${new Date(view.generatedAt).toLocaleString()}`
    : 'Waiting for prediction data';

  return (
    <section className="prediction-grid">
      <div className="panel prediction-panel">
        <div className="panel-header compact">
          <div>
            <h2>Daily High Temperature Prediction (DEB)</h2>
            <p>{view.method} · {generatedText}</p>
          </div>
          <div className="prediction-summary">
            <strong>{view.mean.toFixed(2)}°C</strong>
            <span>± {view.sigma.toFixed(2)}°C</span>
          </div>
        </div>

        <div className="prediction-body">
          <div className="prediction-copy">
            <span>μ ± σ</span>
            <b>{view.mean.toFixed(2)}°C ± {view.sigma.toFixed(2)}°C</b>
            <em>
              {view.observed === undefined ? 'Observation pending' : `Observed ${Number(view.observed).toFixed(2)}°C`}
              {view.observedSource ? ` · ${view.observedSource}` : ''}
              {view.samples ? ` · ${view.samples} samples` : ''}
            </em>
          </div>

          <div className="bucket-chart" aria-label="Probability buckets">
            {view.buckets.map((bucket) => (
              <div className="bucket" key={bucketLabel(bucket)}>
                <div className="bucket-bar" style={{ height: `${Math.max(10, bucket.probability * 360)}px` }} />
                <span>{bucketLabel(bucket)}</span>
                <b>{Math.round(bucket.probability * 100)}%</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel ideas-panel">
        <div className="panel-header compact">
          <div>
            <h2>Next Capabilities</h2>
            <p>Turn weather monitoring into a market-aware alerting workspace.</p>
          </div>
        </div>

        <div className="idea-list">
          {ideaCards.map((idea, index) => {
            const Icon = icons[index % icons.length];
            return (
              <button
                className="idea-card"
                key={idea.title}
                type="button"
                onClick={() => window.alert(`${idea.title} noted. This can be wired to feedback and alert APIs later.`)}
              >
                <span className="idea-icon">
                  <Icon size={17} />
                </span>
                <span>
                  <b>{idea.title}</b>
                  <em>{idea.body}</em>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
