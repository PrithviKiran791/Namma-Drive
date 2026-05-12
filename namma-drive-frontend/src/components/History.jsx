import { useState, useEffect } from 'react';
import { routeAPI } from '../api';
import { weatherEmoji } from '../services/weather';
import UserAuthBar from './UserAuthBar';
import '../styles/History.css';

const MODE_IMAGES = { car: '/car_icon.jpg', bike: '/cycle_icon.png', transit: '/bus_icon.png' };

export default function History({ onLoadRoute, onNavigate, user }) {
  const [routes,  setRoutes]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchRoutes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await routeAPI.getHistory();
      setRoutes(res.data.routes || []);
    } catch {
      setError('Could not load history. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoutes(); }, []);

  const deleteRoute = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this route?')) return;
    try {
      await routeAPI.delete(id);
      setRoutes(prev => prev.filter(r => r._id !== id));
    } catch {
      setError('Delete failed. Try again.');
    }
  };

  // Fix: operator precedence bug — wrap parseFloat in parentheses
  const totalKm = routes
    .reduce((sum, r) => sum + (parseFloat(r.distance) || 0), 0)
    .toFixed(0);

  const totalFuelStops = routes
    .reduce((sum, r) => sum + (r.fuelStopsOnRoute?.length || 0), 0);

  return (
    <div className="history-page">

      <div className="hst-topbar">
        <div className="hst-logo-row">
          <span className="hst-dot" />
          <span className="hst-logo">Namma Drive</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="hst-nav">
            <span className="hst-nav-link" onClick={() => onNavigate('map')}>Map</span>
            <span className="hst-nav-link active">History</span>
            <span className="hst-nav-link" onClick={() => onNavigate('landing')}>Home</span>
          </div>
          <UserAuthBar user={user} onNavigate={onNavigate} />
        </div>
      </div>

      <div className="hst-body">

        {/* Stats */}
        <div className="hst-stats">
          <div className="hst-stat-card">
            <p className="hst-stat-label">Total routes</p>
            <p className="hst-stat-val">{routes.length}</p>
          </div>
          <div className="hst-stat-card">
            <p className="hst-stat-label">Total km</p>
            <p className="hst-stat-val">{totalKm}</p>
          </div>
          <div className="hst-stat-card">
            <p className="hst-stat-label">Fuel stops</p>
            <p className="hst-stat-val">{totalFuelStops}</p>
          </div>
        </div>

        <p className="hst-section-label">Saved drives</p>

        {loading && <p className="hst-loading">Loading your routes...</p>}

        {error && (
          <div className="hst-error-box">
            <p>{error}</p>
            <button className="hst-retry-btn" onClick={fetchRoutes}>Retry</button>
          </div>
        )}

        {!loading && !error && routes.length === 0 && (
          <p className="hst-empty">
            No routes saved yet.{' '}
            <span
              onClick={() => onNavigate('map')}
              style={{ color: '#ce1126', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Plan one now →
            </span>
          </p>
        )}

        {routes.map(route => (
          <div key={route._id} className="hst-card">
            <div className="hst-card-icon">
              <img 
                src={MODE_IMAGES[route.transportMode] || '/car_icon.jpg'} 
                alt={route.transportMode} 
                style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4 }} 
              />
            </div>

            <div className="hst-card-info">
              <p className="hst-card-title">{route.title}</p>
              <p className="hst-card-meta">
                {new Date(route.timestamp).toLocaleDateString('en-IN', {
                  day:   'numeric',
                  month: 'short',
                  year:  'numeric',
                })}
                {route.origin?.name && route.destination?.name && (
                  <> · {route.origin.name} → {route.destination.name}</>
                )}
              </p>
              <div className="hst-pill-row">
                {route.distance && (
                  <span className="hst-pill">Dist: {route.distance}</span>
                )}
                {route.duration && (
                  <span className="hst-pill">Time: {route.duration}</span>
                )}
                {route.fuelStopsOnRoute?.length > 0 && (
                  <span className="hst-pill fuel">
                    Fuel stops: {route.fuelStopsOnRoute.length}
                  </span>
                )}
                {route.transportMode && (
                  <span className="hst-pill mode" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <img 
                      src={MODE_IMAGES[route.transportMode] || '/car_icon.jpg'} 
                      alt={route.transportMode} 
                      style={{ width: 14, height: 14, objectFit: 'contain' }} 
                    />
                    {route.transportMode}
                  </span>
                )}
              </div>
              {/* Weather snapshot at time of save */}
              {route.weatherAtSave && (
                <div className="hst-weather-snap">
                  <img 
                    src={weatherEmoji(route.weatherAtSave.main)} 
                    alt={route.weatherAtSave.main} 
                    style={{ width: 16, height: 16, objectFit: 'contain' }} 
                  />
                  <span className="hst-weather-temp">{route.weatherAtSave.temp}°C</span>
                  <span className="hst-weather-desc">{route.weatherAtSave.description}</span>
                  <span className="hst-weather-label">when saved</span>
                </div>
              )}
            </div>

            <div className="hst-actions">
              <button
                className="hst-btn load"
                onClick={() => onLoadRoute(route)}
              >
                Load
              </button>
              <button
                className="hst-btn del"
                onClick={(e) => deleteRoute(route._id, e)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}