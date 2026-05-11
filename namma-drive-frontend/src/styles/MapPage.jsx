import { useState, useEffect, useRef } from 'react';
import {
  MapContainer, TileLayer,
  Marker, Popup, Polyline, useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { routeAPI, fuelStopAPI, poiAPI, cityAPI } from '../api';
import { fetchWeather, isWeatherUnsafe, weatherEmoji, getAlertMessage } from '../services/weather';
import { useAuth } from '@clerk/react';
import TransportSwitcher from '../components/TransportSwitcher';
import POIPanel from '../components/POIPanel';
import UserAuthBar from '../components/UserAuthBar';
import WeatherCard from '../components/WeatherCard';
import MetroLaunchpad from '../components/MetroLaunchpad';
import TrendingRoutes from '../components/TrendingRoutes';
import GeoSearch from '../components/GeoSearch';
import RoutingMachine from '../components/RoutingMachine';
import DirectionsPanel from '../components/DirectionsPanel';
import '../styles/MapPage.css';

// ── Fix Leaflet default icons ──────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const makeIcon = (color) => new L.Icon({
  iconUrl:    `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl:  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize:   [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const greenIcon  = makeIcon('green');
const redIcon    = makeIcon('red');
const yellowIcon = makeIcon('gold');
const orangeIcon = makeIcon('orange');
const violetIcon = makeIcon('violet');

// ── Karnataka cities & major tourist anchors (coords ≈ landmark / town centre) ──
const CITIES = {
  'Bengaluru':  [12.9716, 77.5946],
  'Mysuru':     [12.2958, 76.6394],
  'Hubballi':   [15.3647, 75.1240],
  'Belagavi':   [15.8596, 75.6245],
  'Mangaluru':  [12.8628, 74.8455],
  'Hassan':     [13.2019, 75.9208],
  'Shivamogga': [13.9299, 75.5680],
  'Tumakuru':   [13.2170, 77.1141],
  'Davangere':  [14.4644, 75.9217],
  'Kolar':      [13.1373, 78.1288],
  // Tourism & heritage (16 additional presets)
  'Hampi':                    [15.3350, 76.4590],   // Hampi core / Virupaksha area
  'Badami':                   [15.9202, 75.6984],    // Cave temples town
  'Vijayapura (Bijapur)':     [16.8277, 75.7158],    // Bijapur historic centre / Gol Gumbaz
  'Coorg (Madikeri)':         [12.4244, 75.7382],    // Madikeri hill station
  'Chikmagalur':              [13.3161, 75.7720],    // Town centre
  'Bandipur National Park':   [11.6693, 76.6273],    // ~park / NH entry zone
  'Gokarna':                  [14.5479, 74.3188],    // Main beach town
  'Udupi':                    [13.3409, 74.7421],    // Temple town centre
  'Murudeshwar':              [14.0941, 74.4890],    // Shiva statue / shore temple
  'Dandeli':                  [15.2492, 74.6297],    // Town (adventure tourism hub)
  'Jog Falls':                [14.2286, 74.7947],    // Sharavathi falls viewpoint area
  'Agumbe':                   [13.5039, 75.0896],    // Sunset point / rainforest village
  'Kabini':                   [11.9575, 76.3673],    // Nagarhole–Kabini backwaters / safari belt
  'Chitradurga':              [14.2259, 76.3990],    // Fort town
  'Nandi Hills':              [13.3702, 77.6835],    // Popular viewpoint / hill station
  'Shravanabelagola':         [12.8574, 76.4891],    // Gommateshwara / Jain pilgrimage hill
};

function normalizeCityName(name = '') {
  const n = String(name || '').trim();
  const map = {
    Mysore: 'Mysuru',
    Hubli: 'Hubballi',
    'Hubballi-Dharwad': 'Hubballi',
    Belgaum: 'Belagavi',
    Mangalore: 'Mangaluru',
    Shimoga: 'Shivamogga',
    Tumkur: 'Tumakuru',
    Bijapur: 'Vijayapura (Bijapur)',
    Vijayapura: 'Vijayapura (Bijapur)',
    Madikeri: 'Coorg (Madikeri)',
    Coorg: 'Coorg (Madikeri)',
    'Madikeri, Coorg': 'Coorg (Madikeri)',
  };
  return map[n] || n;
}

function haversine([lat1, lng1], [lat2, lng2]) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
  }, [points, map]);
  return null;
}

// POI category → icon
function poiIcon(category) {
  if (category === 'Trek')   return greenIcon;
  if (category === 'Picnic') return violetIcon;
  return orangeIcon; // Temple
}

export default function MapPage({ loadedRoute, onNavigate, onClearRoute }) {
  const { isSignedIn } = useAuth();
  const [originCity,     setOriginCity]     = useState('Bengaluru');
  const [destCity,       setDestCity]       = useState('Mysuru');
  const [transportMode,  setTransportMode]  = useState('car');
  const [geometry,       setGeometry]       = useState([]);
  const [distance,       setDistance]       = useState('');
  const [duration,       setDuration]       = useState('');
  const [fuelNearby,     setFuelNearby]     = useState([]);
  const [allFuel,        setAllFuel]        = useState([]);
  const [pois,           setPois]           = useState([]);
  const [routeTitle,     setRouteTitle]     = useState('');
  const [loading,        setLoading]        = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [error,          setError]          = useState('');

  // Actual coordinates (supports POI coords beyond CITIES dict)
  const [originCoords, setOriginCoords] = useState(CITIES['Bengaluru']);
  const [destCoords,   setDestCoords]   = useState(CITIES['Mysuru']);
  // Current POI category for safety check (if destination is a POI)
  const [destCategory, setDestCategory] = useState(null);

  // Weather state
  const [destWeather,  setDestWeather]  = useState(null);
  const [weatherAlert, setWeatherAlert] = useState('');

  const [activeHub, setActiveHub] = useState(null);
  const [map, setMap] = useState(null);
  const geoSearchRef = useRef(null);

  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [navSummary, setNavSummary] = useState(null);
  const [navSteps, setNavSteps] = useState([]);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [routeKey, setRouteKey] = useState(0);

  const hasRoute            = useRef(false);
  const modeInitialRender   = useRef(true);

  // ── On mount: load fuel stops, POIs ──
  useEffect(() => {
    fuelStopAPI.getAll().then(r => setAllFuel(r.data.stops)).catch(() => {});
    poiAPI.getAll().then(r => setPois(r.data.pois)).catch(() => {});
  }, []);

  // ── Restore route from History ──
  useEffect(() => {
    if (!loadedRoute) return;
    const orig = normalizeCityName(loadedRoute.origin?.name  || 'Bengaluru');
    const dest = normalizeCityName(loadedRoute.destination?.name || 'Mysuru');
    setOriginCity(orig);
    setDestCity(dest);
    setOriginCoords(loadedRoute.origin?.coords  || CITIES[orig] || CITIES['Bengaluru']);
    setDestCoords(loadedRoute.destination?.coords || CITIES[dest] || CITIES['Mysuru']);
    setTransportMode(loadedRoute.transportMode || 'car');
    setGeometry(loadedRoute.geometry || []);
    setDistance(loadedRoute.distance || '');
    setDuration(loadedRoute.duration || '');
    setFuelNearby(loadedRoute.fuelStopsOnRoute || []);
    setDestCategory(null);
    setSaved(false);
    hasRoute.current = true;
    onClearRoute();
  }, [loadedRoute]);

  const applyCityViewport = async (hub) => {
    if (!hub) return;
    setActiveHub(hub);
    setOriginCity(hub.name);
    setOriginCoords(hub.coords);
    setGeometry([]);
    hasRoute.current = false;

    try {
      const { data } = await cityAPI.getById(hub.id);
      const center = data?.city?.center || hub.coords;
      const bounds = data?.city?.bounds || null; // [[south, west], [north, east]]

      setOriginCoords(center);
      if (map) {
        if (bounds?.length === 2) {
          map.fitBounds(bounds, { padding: [40, 40] });
        } else {
          map.flyTo(center, hub.zoom || 12, { duration: 1.2 });
        }
      }
    } catch {
      if (map) map.flyTo(hub.coords, hub.zoom || 12, { duration: 1.2 });
    } finally {
      // Focus destination search for “Where to?” flow
      geoSearchRef.current?.focus?.();
    }
  };

  // ── Re-calc route on transport mode change (skip first render) ──
  useEffect(() => {
    if (modeInitialRender.current) { modeInitialRender.current = false; return; }
    if (hasRoute.current && originCoords && destCoords) {
      runCalculate(originCoords, destCoords, transportMode);
    }
  }, [transportMode]);

  // Close turn-by-turn when endpoints change without a new “Calculate” (avoids stale overlay)
  useEffect(() => {
    setDirectionsOpen(false);
  }, [originCoords, destCoords]);

  // ── Fetch weather whenever destCoords changes ──
  useEffect(() => {
    if (!destCoords) return;
    fetchWeather(destCoords[0], destCoords[1])
      .then(w => {
        setDestWeather(w);
        if (destCategory && isWeatherUnsafe(w, destCategory)) {
          setWeatherAlert(getAlertMessage(w, destCity, destCategory));
        } else {
          setWeatherAlert('');
        }
      })
      .catch(() => setDestWeather(null));
  }, [destCoords, destCategory]);

  // ── Helpers ──
  const matchFuelStops = (geo, fuel) => {
    const nearby = (fuel || allFuel)
      .map(s => {
        const d = geo.reduce((m, pt) => Math.min(m, haversine(pt, s.coords)), Infinity);
        return { ...s, distanceFromRoute: +d.toFixed(1) };
      })
      .filter(s => s.distanceFromRoute <= 5)
      .sort((a, b) => a.distanceFromRoute - b.distanceFromRoute);
    setFuelNearby(nearby);
  };

  const runCalculate = async (oC, dC, mode) => {
    setLoading(true);
    setError('');
    setSaved(false);
    setGeometry([]);
    setFuelNearby([]);
    setDistance('');
    setDuration('');
    setDirectionsOpen(false);
    setNavSteps([]);
    setNavSummary(null);
    try {
      // Trigger Leaflet Routing Machine to compute a route + instructions
      setRouteKey(k => k + 1);
    } catch {
      setError('Failed to calculate route. Check your internet connection.');
      hasRoute.current = false;
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateRoute = () => {
    if (JSON.stringify(originCoords) === JSON.stringify(destCoords)) {
      setError('Origin and destination must be different.');
      return;
    }
    setDestCategory(null);
    runCalculate(originCoords, destCoords, transportMode);
  };

  const handleRouteToPOI = (coords, name, category) => {
    setDestCity(name);
    setDestCoords(coords);
    setDestCategory(category || null);
    runCalculate(originCoords, coords, transportMode);
  };

  const saveRoute = async () => {
    if (!isSignedIn) { setError('Please sign in to save routes.'); return; }
    if (!geometry.length) return;
    try {
      await routeAPI.save({
        title:            routeTitle.trim() || `${originCity} → ${destCity}`,
        originCity, // CO2/CO4: analytics like “Most popular from Bengaluru”
        origin:           { name: originCity, coords: originCoords },
        destination:      { name: destCity,   coords: destCoords   },
        transportMode,
        distance,
        duration,
        geometry,
        fuelStopsOnRoute: fuelNearby,
        // CO2 Data persistence: snapshot weather at time of save
        ...(destWeather ? { weatherAtSave: destWeather } : {}),
      });
      setSaved(true);
      setRouteTitle('');
    } catch {
      setError('Could not save route. Is the backend running?');
    }
  };

  const getRouteColor = () => {
    if (transportMode === 'bike')    return '#22c55e';
    if (transportMode === 'transit') return '#a855f7';
    return '#2563eb';
  };

  const displayOriginCoords = originCoords || CITIES['Bengaluru'];
  const displayDestCoords   = destCoords   || CITIES['Mysuru'];

  const handleGeoDestinationSelect = (item) => {
    setDestCity(item.shortName || item.name);
    setDestCoords([item.lat, item.lon]);
    setDestCategory(null);
    setGeometry([]);
    hasRoute.current = false;
    if (item.boundingbox?.length === 4 && map) {
      const [minLat, maxLat, minLon, maxLon] = item.boundingbox;
      map.fitBounds([[minLat, minLon], [maxLat, maxLon]], { padding: [40, 40] });
    } else if (map) {
      map.flyTo([item.lat, item.lon], 12, { duration: 1.1 });
    }
  };

  return (
    <div className="map-page">

      {/* ── Sidebar ────────────────────────────────────── */}
      <div className="mp-sidebar">
        <div className="mp-sidebar-header">
          <div className="mp-logo-row">
            <span className="mp-logo-dot" />
            <span className="mp-logo-text">Namma Drive V2</span>
          </div>
          <UserAuthBar onNavigate={onNavigate} />
        </div>

        <div className="mp-sidebar-scroll">

          <div className="mp-section">
            <TrendingRoutes
              hub={activeHub}
              onSelectDestination={(route) => {
                setDestCity(route.name);
                setDestCoords(route.coords);
                setDestCategory(null);
                setGeometry([]);
                hasRoute.current = false;
                geoSearchRef.current?.setValue?.(route.name);
                geoSearchRef.current?.focus?.();
                if (map) map.flyTo(route.coords, 12, { duration: 1.1 });
              }}
            />
          </div>

          {/* Transport + Route inputs */}
          <div className="mp-section">
            <TransportSwitcher mode={transportMode} onChange={setTransportMode} />

            <div className="mp-field-group">
              <span className="mp-field-label">From</span>
              <div className="mp-field">
                <span className="mp-dot green" />
                <select value={originCity} onChange={e => {
                  const c = e.target.value;
                  setOriginCity(c);
                  setOriginCoords(CITIES[c]);
                  setGeometry([]);
                  hasRoute.current = false;
                }}>
                  {Object.keys(CITIES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="mp-field-group">
              <span className="mp-field-label">To</span>
              <div className="mp-field">
                <span className="mp-dot red" />
                <select
                  value={CITIES[destCity] ? destCity : ''}
                  onChange={e => {
                    const c = e.target.value;
                    if (!c) return;
                    setDestCity(c);
                    setDestCoords(CITIES[c]);
                    setDestCategory(null);
                    setGeometry([]);
                    hasRoute.current = false;
                    geoSearchRef.current?.setValue?.(c);
                    if (map) map.flyTo(CITIES[c], 11, { duration: 0.9 });
                  }}
                >
                  <option value="">— Pick from list or search below —</option>
                  {Object.keys(CITIES).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mp-field-group">
              <span className="mp-field-label">Or search destination</span>
              <GeoSearch
                ref={geoSearchRef}
                placeholder="Type a place in Karnataka…"
                onSelect={handleGeoDestinationSelect}
              />
            </div>

            <button className="mp-calc-btn" onClick={handleCalculateRoute} disabled={loading}>
              {loading ? '⏳ Calculating...' : '📍 Calculate Route'}
            </button>
            {error && <p className="mp-error">{error}</p>}
          </div>

          {/* ── Destination Weather Panel ── */}
          <div className="mp-section">
            <p className="mp-section-label">🌤 Destination Weather</p>
            <WeatherCard
              coords={destCoords}
              name={destCity}
              category={destCategory}
              onRoute={geometry.length > 0 ? null : handleCalculateRoute}
            />
          </div>

          {/* Route result + save */}
          {distance && (
            <div className="mp-section">
              <div className="mp-route-card">
                <div className="mp-stat-row">
                  <span className="mp-stat-pill">📏 {distance}</span>
                  <span className="mp-stat-pill">⏱ {duration}</span>
                  <span className="mp-stat-pill mode">
                    {transportMode === 'transit' ? '🚌 Transit' : transportMode === 'bike' ? '🚴 Bike' : '🚗 Car'}
                  </span>
                </div>
                <input
                  className="mp-name-input"
                  placeholder="Route name (optional)"
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
                {!isSignedIn && <p className="mp-auth-hint">🔒 Sign in above to save routes</p>}
              </div>

              {/* Fuel stops */}
              {fuelNearby.length > 0 && (
                <div className="mp-fuel-section">
                  <p className="mp-section-label">⛽ Fuel stops near route ({fuelNearby.length})</p>
                  {fuelNearby.map((s, i) => (
                    <div key={i} className="mp-fuel-item">
                      <div>
                        <p className="mp-fuel-name">{s.name}</p>
                        <p className="mp-fuel-meta">{s.type} · {s.city}</p>
                      </div>
                      <span className="mp-fuel-dist">{s.distanceFromRoute} km</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* POI Discovery */}
          <div className="mp-section">
            <p className="mp-section-label">🗺 Explore Karnataka</p>
            <POIPanel onRouteToPOI={handleRouteToPOI} />
          </div>

        </div>{/* end sidebar-scroll */}

        <div className="mp-bottom-nav">
          <button className="mp-nav-btn active">🗺 Map</button>
          <button className="mp-nav-btn" onClick={() => onNavigate('history')}>📋 History</button>
          <button className="mp-nav-btn" onClick={() => onNavigate('landing')}>🏠 Home</button>
        </div>
      </div>

      {/* ── Map container ── */}
      <div className="mp-map-container">

        <div className="mp-map-topbar">
          <div className="mp-map-card">
            <MetroLaunchpad activeHub={activeHub} onSelectHub={applyCityViewport} />
          </div>
        </div>

        {/* Floating weather alert banner */}
        {weatherAlert && (
          <div className="weather-banner">
            {weatherAlert}
          </div>
        )}

        <MapContainer center={[13.5, 76.5]} zoom={7} className="mp-leaflet" whenCreated={setMap}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          />

          {/* Leaflet Routing Machine: only after user requests a route (routeKey > 0) */}
          {originCoords && destCoords && routeKey > 0 && (
            <RoutingMachine
              origin={originCoords}
              destination={destCoords}
              mode={transportMode}
              routeKey={routeKey}
              onRouteFound={({ coordinates, summary, instructions }) => {
                setGeometry(coordinates || []);
                setNavSummary(summary || null);
                setNavSteps(instructions || []);
                setActiveStepIdx(0);

                const km = summary?.totalDistance ? `${(summary.totalDistance / 1000).toFixed(1)} km` : '';
                const dur = summary?.totalTime ? (() => {
                  const totalM = Math.round(summary.totalTime / 60);
                  const h = Math.floor(totalM / 60);
                  const m = totalM % 60;
                  return `${h}h ${m}m`;
                })() : '';
                setDistance(km);
                setDuration(dur);

                if (coordinates?.length) matchFuelStops(coordinates, allFuel);
                hasRoute.current = true;
                setDirectionsOpen(true);
              }}
            />
          )}

          {/* Origin marker */}
          <Marker position={displayOriginCoords} icon={greenIcon}>
            <Popup>
              <div className="poi-popup">
                <strong>📍 {originCity}</strong>
                <p style={{ color: '#6b7280', fontSize: '11px' }}>Origin</p>
                <WeatherCard coords={displayOriginCoords} name={originCity} compact />
              </div>
            </Popup>
          </Marker>

          {/* Destination marker */}
          <Marker position={displayDestCoords} icon={redIcon}>
            <Popup>
              <div className="poi-popup">
                <strong>🏁 {destCity}</strong>
                <p style={{ color: '#6b7280', fontSize: '11px' }}>Destination</p>
                <WeatherCard coords={displayDestCoords} name={destCity} category={destCategory} compact />
              </div>
            </Popup>
          </Marker>

          {/* Route polylines */}
          {geometry.length > 0 && (
            <>
              <Polyline positions={geometry}
                pathOptions={{ color: getRouteColor(), weight: 14, opacity: 0.3, lineCap: 'round', lineJoin: 'round' }} />
              <Polyline positions={geometry}
                pathOptions={{ color: getRouteColor(), weight: 5,  opacity: 1,   lineCap: 'round', lineJoin: 'round' }} />
              <FitBounds points={geometry} />
            </>
          )}

          {/* POI markers with weather in popups */}
          {pois.map(poi => (
            <Marker key={poi._id} position={poi.coords} icon={poiIcon(poi.category)}>
              <Popup minWidth={240}>
                <div className="poi-popup">
                  <strong>{poi.name}</strong>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 6px' }}>
                    {poi.category} · ⭐ {poi.rating}
                  </p>
                  <p style={{ fontSize: '11px', color: '#374151', marginBottom: '8px' }}>{poi.description}</p>
                  {/* Live weather for this POI */}
                  <WeatherCard
                    coords={poi.coords}
                    name={poi.name}
                    category={poi.category}
                    onRoute={() => handleRouteToPOI(poi.coords, poi.name, poi.category)}
                  />
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Fuel stop markers */}
          {fuelNearby.map((s, i) => (
            <Marker key={`fuel-${i}`} position={s.coords} icon={yellowIcon}>
              <Popup>
                <strong>⛽ {s.name}</strong><br />
                {s.type} · {s.city}<br />
                <em style={{ fontSize: '11px' }}>{s.distanceFromRoute} km from route</em>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <DirectionsPanel
          open={directionsOpen && navSteps.length > 0}
          onClose={() => setDirectionsOpen(false)}
          summary={navSummary}
          steps={navSteps}
          activeIndex={activeStepIdx}
          onSelectStep={(idx) => {
            setActiveStepIdx(idx);
            const step = navSteps?.[idx];
            const ll = step?.latLng || step?.latlng;
            if (ll && map) map.panTo(ll, { animate: true, duration: 0.5 });
          }}
          onSpeakStep={(text) => {
            try {
              window.speechSynthesis?.cancel?.();
              const u = new SpeechSynthesisUtterance(text);
              u.rate = 1.02;
              u.pitch = 1;
              u.lang = 'en-IN';
              window.speechSynthesis?.speak?.(u);
            } catch {
              // no-op
            }
          }}
        />
      </div>
    </div>
  );
}