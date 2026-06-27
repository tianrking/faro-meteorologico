export async function fetchJson(url, { timeoutMs = 12000, retries = 1, headers = {} } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          accept: "application/json",
          "user-agent": "weather-website/0.2 (+official weather data research)",
          ...headers
        }
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`${response.status} ${response.statusText}: ${body.slice(0, 180)}`);
      }

      return response.json();
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}
