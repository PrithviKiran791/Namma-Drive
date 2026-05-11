import { useState, useEffect } from 'react';
import { routeAPI } from '../api';
import '../styles/History.css';

export default function History({ onLoadRoute, onNavigate }) {
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

  const deleteRoute = async (id) => {
    try {
      await routeAPI.delete(id);
      setRoutes(prev => prev.filter(r => r._id !== id));
    } catch {
      setError('Delete failed. Try again.');
    }
  };

  // Derive stats from the routes array
  const totalKm = routes
    .reduce((sum, r) => sum + parseFloat(r.distance) || 0, 0)
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
        <div className="hst-nav">
          <span
            className="hst-nav-link"
            onClick={() => onNavigate('map')}
          >
            Map
          </span>
          <span className="hst-nav-link active">History</span>
          <span
            className="hst-nav-link"
            onClick={() => onNavigate('landing')}
          >
            Home
          </span>
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
            <p className="hst-stat-label">Fuel stops found</p>
            <p className="hst-stat-val">{totalFuelStops}</p>
          </div>
        </div>

        <p className="hst-section-label">Saved drives</p>

        {loading && <p className="hst-loading">Loading your routes...</p>}
        {error   && <p className="hst-error">{error}</p>}

        {!loading && routes.length === 0 && !error && (
          <p className="hst-empty">
            No routes saved yet.{' '}
            <span
              onClick={() => onNavigate('map')}
              style={{ color: '#1a1040', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Plan one now →
            </span>
          </p>
        )}

        {routes.map(route => (
          <div key={route._id} className="hst-card">
            <div className="hst-card-icon">🗺</div>

            <div className="hst-card-info">
              <p className="hst-card-title">{route.title}</p>
              <p className="hst-card-meta">
                {new Date(route.timestamp).toLocaleDateString('en-IN', {
                  day:   'numeric',
                  month: 'short',
                  year:  'numeric',
                })}
              </p>
              <div className="hst-pill-row">
                {route.distance && (
                  <span className="hst-pill">📏 {route.distance}</span>
                )}
                {route.duration && (
                  <span className="hst-pill">⏱ {route.duration}</span>
                )}
                {route.fuelStopsOnRoute?.length > 0 && (
                  <span className="hst-pill fuel">
                    ⛽ {route.fuelStopsOnRoute.length} fuel stops
                  </span>
                )}
              </div>
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
                onClick={() => deleteRoute(route._id)}
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