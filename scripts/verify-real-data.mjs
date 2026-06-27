const base = process.env.API_BASE_URL ?? 'http://127.0.0.1:8080/api';
const timeoutMs = Number(process.env.VERIFY_TIMEOUT_MS ?? 20000);
const concurrency = Number(process.env.VERIFY_CONCURRENCY ?? 6);

const endpointSpecs = [
  ['forecast', (city, date) => `/forecast?city=${city}&date=${date}`],
  ['metar', (city, date) => `/metar?city=${city}&date=${date}`],
  ['historical', (city, date) => `/historical?city=${city}&date=${date}`],
  ['diffstats', (city, date) => `/diffstats/latest?city=${city}&date=${date}`],
  ['accuracy', (city, date) => `/accuracy/latest?city=${city}&date=${date}`],
  ['historical-metar-match', (city, date) => `/historical-metar-match?city=${city}&date=${date}`],
  ['peak-marker', (city, date) => `/peak-marker?city=${city}&date=${date}`],
  ['prediction', (city, date) => `/prediction?city=${city}&date=${date}`],
  ['fetchlog', (city) => `/fetchlog?city=${city}&limit=5`],
];

const allowedProviders = [
  'local-market-metadata',
  'derived-provider-window',
  'official-provider-config',
  'open-meteo-forecast',
  'open-meteo-archive',
  'aviationweather.gov',
  'official-derived',
  'open-meteo-derived',
  'local-request-plan',
  'not-configured',
  'unavailable'
];

async function request(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(base + path, { signal: controller.signal });
    const json = await response.json();
    return { status: response.status, json };
  } finally {
    clearTimeout(timer);
  }
}

function rowCount(data) {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === 'object') return Object.keys(data).length;
  return 0;
}

function latestDate(rows) {
  const first = rows[0];
  return typeof first === 'string' ? first : first?.date;
}

async function pool(items, worker) {
  const results = [];
  let index = 0;
  async function run() {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      results.push(await worker(current));
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

function accepted(payload) {
  const provider = payload.json?.meta?.provider;
  return payload.status === 200 && allowedProviders.includes(provider) && provider !== 'polywx';
}

const citiesPayload = await request('/cities');
if (!accepted(citiesPayload)) {
  throw new Error(`cities endpoint is not an accepted official-source response: ${JSON.stringify(citiesPayload.json?.meta)}`);
}

const cities = citiesPayload.json.data ?? [];
const dateChecks = await pool(cities, async (city) => {
  try {
    const payload = await request(`/dates?city=${city.id}`);
    const rows = Array.isArray(payload.json?.data) ? payload.json.data : [];
    return {
      city: city.id,
      endpoint: 'dates',
      ok: accepted(payload) && Boolean(latestDate(rows)),
      date: latestDate(rows),
      status: payload.status,
      provider: payload.json?.meta?.provider,
      realData: payload.json?.meta?.realData,
      rows: rows.length,
    };
  } catch (error) {
    return { city: city.id, endpoint: 'dates', ok: false, error: error.message };
  }
});

const endpointJobs = dateChecks
  .filter((check) => check.ok)
  .flatMap((check) => endpointSpecs.map(([endpoint, path]) => ({ city: check.city, date: check.date, endpoint, path: path(check.city, check.date) })));

const endpointChecks = await pool(endpointJobs, async (job) => {
  try {
    const payload = await request(job.path);
    return {
      ...job,
      ok: accepted(payload),
      status: payload.status,
      provider: payload.json?.meta?.provider,
      realData: payload.json?.meta?.realData,
      rows: rowCount(payload.json?.data),
    };
  } catch (error) {
    return { ...job, ok: false, error: error.message };
  }
});

const allChecks = [...dateChecks, ...endpointChecks];
const failures = allChecks.filter((check) => !check.ok);
const summary = {
  checkedAt: new Date().toISOString(),
  base,
  cities: cities.length,
  dateChecks: dateChecks.length,
  endpointChecks: endpointChecks.length,
  passed: allChecks.length - failures.length,
  failed: failures.length,
  polywxResponses: allChecks.filter((check) => check.provider === 'polywx').length,
};

console.log(JSON.stringify({ summary, failures }, null, 2));
if (failures.length || summary.polywxResponses) process.exitCode = 1;
