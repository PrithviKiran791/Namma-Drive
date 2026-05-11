import { useState, useEffect } from 'react';
import {
  MapContainer, TileLayer,
  Marker, Popup, Polyline, useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { routeAPI, fuelStopAPI } from '../api';
import '../styles/MapPage.css';

// ── Fix default Leaflet marker icons (Windows path bug) ──
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ── Colored marker icons ──────────────────────────────────
const makeIcon = (color) => new L.Icon({
  iconUrl:       `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize:      [25, 41],
  iconAnchor:    [12, 41],
  popupAnchor:   [1, -34],
  shadowSize:    [41, 41],
});

const greenIcon  = makeIcon('green');
const redIcon    = makeIcon('red');
const yellowIcon = makeIcon('gold');

// ── Karnataka cities ──────────────────────────────────────
const CITIES = {
  'Bengaluru':  [12.9716, 77.5946],
  'Mysore':     [12.2958, 76.6394],
  'Hubli':      [15.3647, 75.1240],
  'Belgaum':    [15.8596, 75.6245],
  'Mangalore':  [12.8628, 74.8455],
  'Hassan':     [13.2019, 75.9208],
  'Shimoga':    [13.9299, 75.5680],
  'Tumkur':     [13.2170, 77.1141],
  'Davangere':  [14.4644, 75.9217],
  'Kolar':      [13.1373, 78.1288],
};

// ── Decode OSRM polyline string → [[lat, lng], ...] ──────
function decodePolyline(encoded) {
  const points = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let shift = 0, result = 0, byte;
    do {
      byte    = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift  += 5;
    } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);

    shift = 0; result = 0;
    do {
      byte    = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift  += 5;
    } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

// ── Haversine distance between two [lat,lng] points (km) ─
function haversine([lat1, lng1], [lat2, lng2]) {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Auto-fit map to route bounds ──────────────────────────
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
}

// ── Main MapPage component ────────────────────────────────
export default function MapPage({ loadedRoute, onNavigate, onClearRoute }) {
  const [originCity, setOriginCity] = useState('Bengaluru');
  const [destCity,   setDestCity]   = useState('Mysore');
  const [geometry,   setGeometry]   = useState([]);
  const [distance,   setDistance]   = useState('');
  const [duration,   setDuration]   = useState('');
  const [fuelNearby, setFuelNearby] = useState([]);
  const [allFuel,    setAllFuel]    = useState([]);
  const [routeTitle, setRouteTitle] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState('');

  // Fetch all fuel stops once on mount
  useEffect(() => {
    fuelStopAPI.getAll()
      .then(res => setAllFuel(res.data.stops))
      .catch(() => console.warn('Could not load fuel stops from backend'));
  }, []);

  // If a saved route was loaded from History, restore it
  useEffect(() => {
    if (!loadedRoute) return;
    setOriginCity(loadedRoute.origin.name);
    setDestCity(loadedRoute.destination.name);
    setGeometry(loadedRoute.geometry || []);
    setDistance(loadedRoute.distance || '');
    setDuration(loadedRoute.duration || '');
    setFuelNearby(loadedRoute.fuelStopsOnRoute || []);
    setSaved(false);
    onClearRoute();
  }, [loadedRoute]);

  // Find fuel stops within 5 km of the route geometry
  const matchFuelStops = (geo) => {
    const nearby = allFuel
      .map(stop => {
        const minDist = geo.reduce(
          (min, pt) => Math.min(min, haversine(pt, stop.coords)),
          Infinity
        );
        return { ...stop, distanceFromRoute: +minDist.toFixed(1) };
      })
      .filter(stop => stop.distanceFromRoute <= 5)
      .sort((a, b) => a.distanceFromRoute - b.distanceFromRoute);
    setFuelNearby(nearby);
  };

  // Call OSRM, decode geometry, update state
  const calculateRoute = async () => {
    if (originCity === destCity) {
      setError('Origin and destination must be different cities.');
      return;
    }
    setLoading(true);
    setError('');
    setSaved(false);
    setGeometry([]);
    setFuelNearby([]);
    setDistance('');
    setDuration('');

    try {
      const [lat1, lng1] = CITIES[originCity];
      const [lat2, lng2] = CITIES[destCity];

      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${lng1},${lat1};${lng2},${lat2}` +
        `?overview=full&geometries=polyline`;

      const res  = await fetch(url);
      const data = await res.json();

      if (!data.routes || data.routes.length === 0) {
        setError('No route found between these cities.');
        return;
      }

      const route   = data.routes[0];
      const geo     = decodePolyline(route.geometry);
      const km      = (route.distance / 1000).toFixed(1);
      const totalM  = Math.round(route.duration / 60);
      const hours   = Math.floor(totalM / 60);
      const mins    = totalM % 60;

      setGeometry(geo);
      setDistance(`${km} km`);
      setDuration(`${hours}h ${mins}m`);
      matchFuelStops(geo);

    } catch (err) {
      setError('Failed to fetch route. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  // Save route to MongoDB via backend
  const saveRoute = async () => {
    if (!geometry.length) return;
    try {
      await routeAPI.save({
        title:           routeTitle.trim() || `${originCity} → ${destCity}`,
        origin:          { name: originCity, coords: CITIES[originCity] },
        destination:     { name: destCity,   coords: CITIES[destCity]   },
        distance,
        duration,
        geometry,
        fuelStopsOnRoute: fuelNearby,
      });
      setSaved(true);
      setRouteTitle('');
    } catch (err) {
      setError('Could not save route. Is the backend running?');
    }
  };

  const originCoords = CITIES[originCity];
  const destCoords   = CITIES[destCity];

  return (
    <div className="map-page">

      {/* ── Left sidebar ──────────────────────────────── */}
      <div className="mp-sidebar">

        <div className="mp-sidebar-top">
          <div className="mp-logo-row">
            <span className="mp-logo-dot" />
            <span className="mp-logo-text">Namma Drive</span>
          </div>

          {/* Origin selector */}
          <div className="mp-field-group">
            <span className="mp-field-label">From</span>
            <div className="mp-field">
              <span className="mp-dot green" />
              <select
                value={originCity}
                onChange={e => {
                  setOriginCity(e.target.value);
                  setGeometry([]);
                  setSaved(false);
                }}
              >
                {Object.keys(CITIES).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mp-connector" />

          {/* Destination selector */}
          <div className="mp-field-group">
            <span className="mp-field-label">To</span>
            <div className="mp-field">
              <span className="mp-dot red" />
              <select
                value={destCity}
                onChange={e => {
                  setDestCity(e.target.value);
                  setGeometry([]);
                  setSaved(false);
                }}
              >
                {Object.keys(CITIES).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="mp-calc-btn"
            onClick={calculateRoute}
            disabled={loading}
          >
            {loading ? 'Calculating route...' : '📍 Calculate route'}
          </button>

          {error && <p className="mp-error">{error}</p>}
        </div>

        {/* Route result + save */}
        <div className="mp-sidebar-body">
          {distance && (
            <div className="mp-route-card">
              <div className="mp-stat-row">
                <span className="mp-stat-pill">📏 {distance}</span>
                <span className="mp-stat-pill">⏱ {duration}</span>
              </div>
              <input
                className="mp-name-input"
                placeholder="Name this route (optional)"
                value={routeTitle}
                onChange={e => setRouteTitle(e.target.value)}
              />
              <button
                className={`mp-save-btn${saved ? ' saved' : ''}`}
                onClick={saveRoute}
                disabled={saved}
              >
                {saved ? '✓ Route saved!' : '💾 Save this drive'}
              </button>
            </div>
          )}

          {/* Fuel stops list */}
          {fuelNearby.length > 0 && (
            <div className="mp-fuel-section">
              <p className="mp-section-label">
                ⛽ Fuel stops near route ({fuelNearby.length})
              </p>
              {fuelNearby.map((stop, i) => (
                <div key={i} className="mp-fuel-item">
                  <div>
                    <p className="mp-fuel-name">{stop.name}</p>
                    <p className="mp-fuel-meta">
                      {stop.type} · {stop.city}
                    </p>
                  </div>
                  <span className="mp-fuel-dist">
                    {stop.distanceFromRoute} km
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div className="mp-bottom-nav">
          <button className="mp-nav-btn active">🗺 Map</button>
          <button className="mp-nav-btn" onClick={() => onNavigate('history')}>
            📋 History
          </button>
          <button className="mp-nav-btn" onClick={() => onNavigate('landing')}>
            🏠 Home
          </button>
        </div>
      </div>

      {/* ── Leaflet map ────────────────────────────────── */}
      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={7}
        className="mp-leaflet"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
        />

        {/* Origin marker */}
        <Marker position={originCoords} icon={greenIcon}>
          <Popup><strong>{originCity}</strong><br />Origin</Popup>
        </Marker>

        {/* Destination marker */}
        <Marker position={destCoords} icon={redIcon}>
          <Popup><strong>{destCity}</strong><br />Destination</Popup>
        </Marker>

        {/* Route polyline */}
        {geometry.length > 0 && (
          <>
            <Polyline
              positions={geometry}
              pathOptions={{
                color: '#38bdf8',
                weight: 12,
                opacity: 0.42,
                lineCap: 'round',
                lineJoin: 'round',
              }}
              className="mp-route-glow"
            />
            <Polyline
              positions={geometry}
              pathOptions={{
                color: '#2563eb',
                weight: 6,
                opacity: 0.98,
                lineCap: 'round',
                lineJoin: 'round',
              }}
              className="mp-route-core"
            />
            <FitBounds points={geometry} />
          </>
        )}

        {/* Fuel stop markers */}
        {fuelNearby.map((stop, i) => (
          <Marker key={i} position={stop.coords} icon={yellowIcon}>
            <Popup>
              <strong>{stop.name}</strong><br />
              {stop.type} · {stop.city}<br />
              <em>{stop.distanceFromRoute} km from route</em>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}