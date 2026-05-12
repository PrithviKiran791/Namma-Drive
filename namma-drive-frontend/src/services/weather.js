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
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function cacheKey(lat, lon) {
  return `${Number(lat).toFixed(2)},${Number(lon).toFixed(2)}`;
}

function loadLocalCache(key) {
  try {
    const raw = localStorage.getItem(`namma-drive:weather:${key}`);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (cached?.ts && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;
  } catch {
    // ignore localStorage failures
  }
  return null;
}

function saveLocalCache(key, data) {
  try {
    localStorage.setItem(`namma-drive:weather:${key}`, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // ignore localStorage failures
  }
}

async function fetchOpenWeatherMap(lat, lon) {
  const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;
  if (!apiKey) return null;

  const url = new URL('https://api.openweathermap.org/data/2.5/weather');
  url.searchParams.set('lat', lat);
  url.searchParams.set('lon', lon);
  url.searchParams.set('appid', apiKey);
  url.searchParams.set('units', 'metric');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`OpenWeatherMap error: ${res.status}`);
  const json = await res.json();

  const weather = json.weather?.[0] || {};
  return {
    temp: Math.round(json.main?.temp ?? 0),
    humidity: Math.round(json.main?.humidity ?? 0),
    wind: Math.round(json.wind?.speed ?? 0),
    weatherCode: weather.id ?? 0,
    main: weather.main ?? 'Clear',
    description: weather.description ?? 'Clear sky',
    source: 'OpenWeatherMap',
  };
}

async function fetchOpenMeteo(lat, lon) {
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

  return {
    temp:        Math.round(c.temperature_2m),
    humidity:    Math.round(c.relative_humidity_2m),
    wind:        Math.round(c.wind_speed_10m),
    weatherCode: code,
    main,
    description,
    source: 'Open-Meteo',
  };
}

export async function fetchWeather(lat, lon) {
  const key = cacheKey(lat, lon);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const localCached = loadLocalCache(key);
  if (localCached) {
    cache.set(key, { data: localCached, ts: Date.now() });
    return localCached;
  }

  let data = null;
  try {
    data = await fetchOpenWeatherMap(lat, lon);
  } catch {
    data = await fetchOpenMeteo(lat, lon);
  }

  cache.set(key, { data, ts: Date.now() });
  saveLocalCache(key, data);
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

// ── WMO main condition → image path ──
export function weatherEmoji(main) {
  const map = {
    Clear:        '/scenic.png',
    Clouds:       '/scenic.png',
    Rain:         '/photo4jpg.jpg',
    Drizzle:      '/photo4jpg.jpg',
    Thunderstorm: '/halasi-belgaum-karnataka-city-hero.jpg',
    Snow:         '/istockphoto-1382384282-612x612.jpg',
    Fog:          '/istockphoto-1004667282-612x612.jpg',
  };
  return map[main] ?? '/scenic.png';
}

// ── Friendly alert message ──
export function getAlertMessage(weather, locationName, category) {
  const { description } = weather;
  const cond = description.charAt(0).toUpperCase() + description.slice(1);
  return `Alert: ${cond} at ${locationName} — unfavorable for ${category.toLowerCase()} today. Proceed with caution.`;
}
