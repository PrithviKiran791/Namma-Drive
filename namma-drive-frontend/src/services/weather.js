// ── Open-Meteo Weather Service ─────────────────────────────
// Free & open-source. No API key required.
// Docs: https://open-meteo.com/en/docs
//
// WMO Weather Code → readable condition mapping

const WMO_CODES = {
  0:  { main: 'Clear',        description: 'Clear sky' },
  1:  { main: 'Clear',        description: 'Mainly clear' },
  2:  { main: 'Clouds',       description: 'Partly cloudy' },
  3:  { main: 'Clouds',       description: 'Overcast' },
  45: { main: 'Fog',          description: 'Foggy' },
  48: { main: 'Fog',          description: 'Depositing rime fog' },
  51: { main: 'Drizzle',      description: 'Light drizzle' },
  53: { main: 'Drizzle',      description: 'Moderate drizzle' },
  55: { main: 'Drizzle',      description: 'Dense drizzle' },
  61: { main: 'Rain',         description: 'Slight rain' },
  63: { main: 'Rain',         description: 'Moderate rain' },
  65: { main: 'Rain',         description: 'Heavy rain' },
  71: { main: 'Snow',         description: 'Slight snowfall' },
  73: { main: 'Snow',         description: 'Moderate snowfall' },
  75: { main: 'Snow',         description: 'Heavy snowfall' },
  77: { main: 'Snow',         description: 'Snow grains' },
  80: { main: 'Rain',         description: 'Slight rain showers' },
  81: { main: 'Rain',         description: 'Moderate rain showers' },
  82: { main: 'Rain',         description: 'Violent rain showers' },
  85: { main: 'Snow',         description: 'Slight snow showers' },
  86: { main: 'Snow',         description: 'Heavy snow showers' },
  95: { main: 'Thunderstorm', description: 'Thunderstorm' },
  96: { main: 'Thunderstorm', description: 'Thunderstorm with hail' },
  99: { main: 'Thunderstorm', description: 'Thunderstorm with heavy hail' },
};

// ── Request cache (avoids duplicate API calls for same coords) ──
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function fetchWeather(lat, lon) {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
    `&wind_speed_unit=kmh` +
    `&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  const json = await res.json();

  const c    = json.current;
  const code = c.weather_code ?? 0;
  const { main, description } = WMO_CODES[code] ?? { main: 'Clear', description: 'Clear sky' };

  const data = {
    temp:        Math.round(c.temperature_2m),
    humidity:    Math.round(c.relative_humidity_2m),
    wind:        Math.round(c.wind_speed_10m),
    weatherCode: code,
    main,
    description,
  };

  cache.set(key, { data, ts: Date.now() });
  return data;
}

// ── Safety check: is this weather unsafe for the given category? ──
export function isWeatherUnsafe(weather, category) {
  if (!weather) return false;
  const { main, weatherCode } = weather;

  const isStorm = main === 'Thunderstorm';
  const isHeavyRain = [65, 82, 81].includes(weatherCode);   // heavy/violent rain
  const isRain  = main === 'Rain' || main === 'Drizzle';

  if (category === 'Trek') return isStorm || isHeavyRain || isRain;
  if (category === 'Picnic') return isStorm || isHeavyRain;
  return false;
}

// ── WMO main condition → themed emoji ──
export function weatherEmoji(main) {
  const map = {
    Clear:        '☀️',
    Clouds:       '⛅',
    Rain:         '🌧️',
    Drizzle:      '🌦️',
    Thunderstorm: '⛈️',
    Snow:         '❄️',
    Fog:          '🌫️',
  };
  return map[main] ?? '🌡️';
}

// ── Friendly alert message ──
export function getAlertMessage(weather, locationName, category) {
  const { description } = weather;
  const cond = description.charAt(0).toUpperCase() + description.slice(1);
  return `⚠️ ${cond} at ${locationName} — unfavorable for ${category.toLowerCase()} today. Proceed with caution.`;
}
