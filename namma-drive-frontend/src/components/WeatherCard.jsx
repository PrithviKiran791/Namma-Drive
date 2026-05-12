import { useState, useEffect } from 'react';
import { fetchWeather, weatherEmoji, isWeatherUnsafe } from '../services/weather';
import './WeatherCard.css';

export default function WeatherCard({ coords, name, category, onRoute, compact = false }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (!coords || coords.length < 2) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    setWeather(null);

    fetchWeather(coords[0], coords[1])
      .then(w  => { if (!cancelled) { setWeather(w); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });

    return () => { cancelled = true; };
  }, [coords?.[0], coords?.[1]]);

  const unsafe = weather && category ? isWeatherUnsafe(weather, category) : false;

  if (compact) {
    // Compact inline pill shown in sidebar
    return (
      <div className={`weather-pill ${unsafe ? 'warn' : ''}`}>
        {loading && <span className="wp-loading">Loading...</span>}
        {error   && <span className="wp-error">Weather unavailable</span>}
        {weather && !loading && (
          <>
            <img 
              src={weatherEmoji(weather.main)} 
              alt={weather.main} 
              style={{ width: 18, height: 18, objectFit: 'contain' }} 
            />
            <span className="wp-temp">{weather.temp}°C</span>
            <span className="wp-desc">{weather.description}</span>
            {unsafe && <span className="wp-warn-tag">Alert</span>}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="weather-card">
      {/* Header */}
      <div className="wc-header">
        <div className="wc-title-group">
          <span className="wc-name">{name}</span>
          {category && <span className="wc-category">{category}</span>}
        </div>
        <span className="wc-powered">Open-Meteo</span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="wc-loading">
          Fetching live weather...
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="wc-error">Could not fetch weather data</div>
      )}

      {/* Weather data */}
      {weather && !loading && (
        <>
          <div className="wc-body">
            <img 
              src={weatherEmoji(weather.main)} 
              alt={weather.main} 
              style={{ width: 36, height: 36, objectFit: 'contain' }} 
            />
            <div className="wc-info">
              <span className="wc-temp">{weather.temp}°C</span>
              <span className="wc-desc">{weather.description}</span>
              <div className="wc-details">
                <span title="Humidity">Hum: {weather.humidity}%</span>
                <span title="Wind speed">Wind: {weather.wind} km/h</span>
              </div>
            </div>
          </div>

          {/* Safety alert banner */}
          {unsafe && (
            <div className="wc-alert">
              <strong>Weather Alert</strong>
              <p>
                <em>{weather.description}</em> at <strong>{name}</strong> is
                unfavorable for {category?.toLowerCase()} today. Consider
                rescheduling.
              </p>
            </div>
          )}
        </>
      )}

      {/* Start Drive button */}
      {onRoute && (
        <button
          className={`wc-route-btn ${unsafe ? 'warn' : ''}`}
          onClick={onRoute}
        >
          {unsafe ? 'Route Anyway' : 'Start Drive'}
        </button>
      )}
    </div>
  );
}
