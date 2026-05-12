import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  MapContainer, TileLayer,
  Marker, Popup, Polyline, Circle, useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { routeAPI, fuelStopAPI, poiAPI, cityAPI } from '../api';
import { fetchWeather, isWeatherUnsafe, getAlertMessage } from '../services/weather';
import { useDriveStore } from '../store/useDriveStore';

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

const TRANSPORT_LABELS = {
  transit: '🚌 Transit',
  bike: '🚴 Bike',
  car: '🚗 Car',
};

// ── Karnataka cities & major tourist anchors (coords ≈ landmark / town centre) ──
const CITIES = {
  'Bengaluru':  [12.9716, 77.5946],
  'Mysuru':     [12.2958, 76.6394],
  'Hubballi':   [15.3647, 75.124],
  'Belagavi':   [15.8596, 75.6245],
  'Mangaluru':  [12.8628, 74.8455],
  'Hassan':     [13.2019, 75.9208],
  'Shivamogga': [13.9299, 75.568],
  'Tumakuru':   [13.217, 77.1141],
  'Davangere':  [14.4644, 75.9217],
  'Kolar':      [13.1373, 78.1288],
  // Tourism & heritage (16 additional presets)
  'Hampi':                    [15.335, 76.459],   // Hampi core / Virupaksha area
  'Badami':                   [15.9202, 75.6984],    // Cave temples town
  'Vijayapura (Bijapur)':     [16.8277, 75.7158],    // Bijapur historic centre / Gol Gumbaz
  'Coorg (Madikeri)':         [12.4244, 75.7382],    // Madikeri hill station
  'Chikmagalur':              [13.3161, 75.772],    // Town centre
  'Bandipur National Park':   [11.6693, 76.6273],    // ~park / NH entry zone
  'Gokarna':                  [14.5479, 74.3188],    // Main beach town
  'Udupi':                    [13.3409, 74.7421],    // Temple town centre
  'Murudeshwar':              [14.0941, 74.489],    // Shiva statue / shore temple
  'Dandeli':                  [15.2492, 74.6297],    // Town (adventure tourism hub)
  'Jog Falls':                [14.2286, 74.7947],    // Sharavathi falls viewpoint area
  'Agumbe':                   [13.5039, 75.0896],    // Sunset point / rainforest village
  'Kabini':                   [11.9575, 76.3673],    // Nagarhole–Kabini backwaters / safari belt
  'Chitradurga':              [14.2259, 76.399],    // Fort town
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

function routeCenter(points = []) {
  if (!points.length) return null;
  const mid = points[Math.floor(points.length / 2)];
  return Array.isArray(mid) ? mid : null;
}

function projectPointToSegment(point, start, end) {
  const [lat, lon] = point;
  const [lat1, lon1] = start;
  const [lat2, lon2] = end;
  const x = lon;
  const y = lat;
  const x1 = lon1;
  const y1 = lat1;
  const x2 = lon2;
  const y2 = lat2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared));
  return [y1 + t * dy, x1 + t * dx];
}

function snapPointToRoute(point, routePoints = []) {
  if (!Array.isArray(routePoints) || routePoints.length < 2 || !point) return point;
  let closest = point;
  let minDistance = Infinity;

  for (let index = 0; index < routePoints.length - 1; index += 1) {
    const candidate = projectPointToSegment(point, routePoints[index], routePoints[index + 1]);
    const distance = haversine(candidate, point);
    if (distance < minDistance) {
      minDistance = distance;
      closest = candidate;
    }
  }

  return closest;
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
  }, [points, map]);
  return null;
}

FitBounds.propTypes = {
  points: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
};

// POI category → icon
function poiIcon(category) {
  if (category === 'Trek')   return greenIcon;
  if (category === 'Picnic') return violetIcon;
  if (category === 'Hotel')  return yellowIcon;
  return orangeIcon; // Temple
}

function getStepTarget(instruction) {
  if (Array.isArray(instruction)) return instruction;
  if (instruction?.lat != null && instruction?.lng != null) return [instruction.lat, instruction.lng];
  if (Array.isArray(instruction?.location)) return instruction.location;
  return null;
}

function shouldRecalculateRoute(rawPoint, routePoints) {
  if (!Array.isArray(routePoints) || routePoints.length < 2) return false;
  return haversine(rawPoint, snapPointToRoute(rawPoint, routePoints)) > 0.05;
}

function getSmoothedPoint(position, latFilter, lngFilter) {
  const rawLat = position.coords.latitude;
  const rawLng = position.coords.longitude;
  return {
    rawPoint: [rawLat, rawLng],
    smoothPoint: [latFilter.filter(rawLat), lngFilter.filter(rawLng)],
    heading: position.coords.heading ?? null,
    accuracy: position.coords.accuracy || 0,
    speed: position.coords.speed || 0,
  };
}

class Kalman1D {
  constructor({ r = 0.0001, q = 0.00001, a = 1, b = 0, c = 1 } = {}) {
    this.r = r;
    this.q = q;
    this.a = a;
    this.b = b;
    this.c = c;
    this.cov = Number.NaN;
    this.x = Number.NaN;
  }

  filter(z, u = 0) {
    if (Number.isNaN(this.x)) {
      this.x = (1 / this.c) * z;
      this.cov = (1 / this.c) * this.q * (1 / this.c);
    } else {
      const predX = (this.a * this.x) + (this.b * u);
      const predCov = ((this.a * this.cov) * this.a) + this.r;
      const k = predCov * this.c / ((this.c * predCov * this.c) + this.q);
      this.x = predX + k * (z - (this.c * predX));
      this.cov = predCov - (k * this.c * predCov);
    }
    return this.x;
  }
}

export default function MapPage({ loadedRoute, onNavigate, onClearRoute, user }) {
  const { setActiveHub: setActiveHubInStore, setCurrentLocation, setRouteSnapshot } = useDriveStore();
  const [originCity,     setOriginCity]     = useState('Bengaluru');
  const [destCity,       setDestCity]       = useState('Mysuru');
  const [transportMode,  setTransportMode]  = useState('car');
  const [geometry,       setGeometry]       = useState([]);
  const [distance,       setDistance]       = useState('');
  const [duration,       setDuration]       = useState('');
  const [fuelNearby,     setFuelNearby]     = useState([]);
  const [allFuel,        setAllFuel]        = useState([]);
  const [pois,           setPois]           = useState([]);
  const [nearRoutePois, setNearRoutePois] = useState([]);
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
  const gpsWatchRef = useRef(null);
  const kalmanLatRef = useRef(new Kalman1D({ r: 0.00005, q: 0.00001 }));
  const kalmanLngRef = useRef(new Kalman1D({ r: 0.00005, q: 0.00001 }));
  const userMarkerRef = useRef(null);
  const [gpsPoint, setGpsPoint] = useState(null);
  const [gpsHeading, setGpsHeading] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(0);
  const [followUser, setFollowUser] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [distanceToNext, setDistanceToNext] = useState(null);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);

  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [navSummary, setNavSummary] = useState(null);
  const [navSteps, setNavSteps] = useState([]);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [routeKey, setRouteKey] = useState(0);

  const hasRoute            = useRef(false);
  const modeInitialRender   = useRef(true);
  const transportLabel = TRANSPORT_LABELS[transportMode] || TRANSPORT_LABELS.car;

  // ── On mount: load fuel stops, POIs ──
  useEffect(() => {
    fuelStopAPI.getAll().then(r => setAllFuel(r.data.stops)).catch(() => {});
    poiAPI.getAll().then(r => setPois(r.data.pois)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!navigator?.geolocation) return undefined;

    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { rawPoint, smoothPoint, heading, accuracy, speed } = getSmoothedPoint(position, kalmanLatRef.current, kalmanLngRef.current);
        const snappedPoint = geometry.length > 1 ? snapPointToRoute(smoothPoint, geometry) : smoothPoint;
        const nextTarget = getStepTarget(navSteps[activeStepIdx]);

        setGpsPoint(snappedPoint);
        setGpsHeading(heading);
        setGpsAccuracy(accuracy);
        setCurrentSpeedKmh(Math.max(0, speed * 3.6));
        setCurrentLocation(snappedPoint);

        if (followUser && map && snappedPoint) {
          map.flyTo(snappedPoint, 16, { duration: 0.6 });
        }

        if (nextTarget) {
          const dKm = haversine(snappedPoint, nextTarget);
          setDistanceToNext((dKm * 1000).toFixed(0));
          if (dKm <= 0.02) {
            setActiveStepIdx(i => Math.min((navSteps.length - 1), i + 1));
          }
        }

        if (shouldRecalculateRoute(rawPoint, geometry)) {
          setGeometry([]);
          setFuelNearby([]);
          setNearRoutePois([]);
          setDistance('');
          setDuration('');
          setDirectionsOpen(false);
          setNavSteps([]);
          setNavSummary(null);
          setRouteKey(k => k + 1);
        }
      },
      () => {
        // handle permission or other geolocation errors silently
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    return () => {
      if (gpsWatchRef.current != null && navigator?.geolocation?.clearWatch) {
        navigator.geolocation.clearWatch(gpsWatchRef.current);
      }
    };
  }, [geometry, setCurrentLocation, followUser, map, destCoords, transportMode, navSteps, activeStepIdx]);


  // ── Restore route from History ──
  useEffect(() => {
    if (!loadedRoute) return undefined;
    const timer = setTimeout(() => {
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
    }, 0);
    return () => clearTimeout(timer);
  }, [loadedRoute, onClearRoute]);

  const applyCityViewport = async (hub) => {
    if (!hub) return;
    setActiveHub(hub);
    setActiveHubInStore(hub);
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
      setGeometry([]);
      setFuelNearby([]);
      setNearRoutePois([]);
      setDistance('');
      setDuration('');
      setDirectionsOpen(false);
      setNavSteps([]);
      setNavSummary(null);
      setRouteKey(k => k + 1);
    }
  }, [transportMode, originCoords, destCoords]);

  // Close turn-by-turn when endpoints change without a new “Calculate” (avoids stale overlay)
  useEffect(() => {
    if (!originCoords || !destCoords) return undefined;
    const timer = setTimeout(() => setDirectionsOpen(false), 0);
    return () => clearTimeout(timer);
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
  }, [destCoords, destCategory, destCity]);

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

  const fetchRoutePois = async (routePoints) => {
    const center = routeCenter(routePoints);
    if (!center) {
      setNearRoutePois([]);
      return;
    }

    try {
      const { data } = await poiAPI.nearRoute({
        center,
        radiusKm: 35,
        categories: ['Hotel', 'Trek', 'Temple', 'Picnic'],
      });
      setNearRoutePois(data?.pois || []);
    } catch {
      setNearRoutePois([]);
    }
  };

  const runCalculate = () => {
    setLoading(true);
    setError('');
    setSaved(false);
    setGeometry([]);
    setFuelNearby([]);
    setNearRoutePois([]);
    setDistance('');
    setDuration('');
    setDirectionsOpen(false);
    setNavSteps([]);
    setNavSummary(null);
    hasRoute.current = false;
    setRouteKey(k => k + 1);
  };


  const handleCalculateRoute = () => {
    if (JSON.stringify(originCoords) === JSON.stringify(destCoords)) {
      setError('Origin and destination must be different.');
      return;
    }
    setDestCategory(null);
    runCalculate();
  };

  const handleRouteToPOI = (coords, name, category) => {
    setDestCity(name);
    setDestCoords(coords);
    setDestCategory(category || null);
    runCalculate();
  };

  const saveRoute = async () => {
    if (!user) { setError('Please sign in to save routes.'); return; }
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

  const handleNavigate = (destination) => {
    console.log('[MapPage] Navigating to:', destination);
    onNavigate(destination);
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
          <UserAuthBar user={user} onNavigate={handleNavigate} />
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
                  <span className="mp-stat-pill mode">{transportLabel}</span>
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
                {!user && <p className="mp-auth-hint">🔒 Sign in above to save routes</p>}
              </div>

              {/* Fuel stops */}
              {fuelNearby.length > 0 && (
                <div className="mp-fuel-section">
                  <p className="mp-section-label">⛽ Fuel stops near route ({fuelNearby.length})</p>
                  {fuelNearby.map((s, i) => (
                    <div key={`${s.name}-${s.city}-${s.coords?.join(',') || i}`} className="mp-fuel-item">
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
            {nearRoutePois.length > 0 && (
              <p className="mp-auth-hint" style={{ textAlign: 'left', marginBottom: 8 }}>
                {nearRoutePois.length} POIs are near your current route
              </p>
            )}
            <POIPanel onRouteToPOI={handleRouteToPOI} />
          </div>

        </div>{/* end sidebar-scroll */}

        <div className="mp-bottom-nav">
          <button type="button" className="mp-nav-btn active">🗺 Map</button>
          <button type="button" className="mp-nav-btn" onClick={() => handleNavigate('history')}>📋 History</button>
          <button type="button" className="mp-nav-btn" onClick={() => handleNavigate('landing')}>🏠 Home</button>
        </div>
      </div>

      {/* ── Map container ── */}
      <div className="mp-map-container">

        <div className="mp-map-topbar">
          <div className="mp-map-card">
            <MetroLaunchpad activeHub={activeHub} onSelectHub={applyCityViewport} />
            <button
              className={`mp-follow-btn${followUser ? ' active' : ''}`}
              onClick={() => {
                if (!navigator?.geolocation) { setShowLocationModal(true); return; }
                if (!navigator?.permissions?.query) {
                  setFollowUser(f => !f);
                  return;
                }
                navigator.permissions.query({ name: 'geolocation' })
                  .then((p) => {
                    if (p.state === 'denied') {
                      setShowLocationModal(true);
                      return;
                    }
                    setFollowUser(f => !f);
                  })
                  .catch(() => {
                    setFollowUser(f => !f);
                  });
              }}
              style={{ marginLeft: 8 }}
            >
              {followUser ? '📍 Following' : '📌 Center on me'}
            </button>
          </div>
        </div>

        {/* GPS HUD overlay */}
        <div style={{ position: 'absolute', right: 16, top: 84, zIndex: 520, background: 'rgba(26,26,26,0.8)', color: '#fff', padding: '8px 12px', borderRadius: 8, minWidth: 160, fontSize: 13 }}>
          <div style={{ fontWeight: 600, color: '#FFD700' }}>Live GPS</div>
          <div style={{ marginTop: 6 }}>
            <div>Speed: <strong>{currentSpeedKmh ? `${currentSpeedKmh.toFixed(0)} km/h` : '—'}</strong></div>
            <div>To next: <strong>{distanceToNext ? `${distanceToNext} m` : '—'}</strong></div>
            <div>Accuracy: <strong>{gpsAccuracy ? `${Math.round(gpsAccuracy)} m` : '—'}</strong></div>
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

          {/* User marker + accuracy circle */}
          {gpsPoint && (
            <>
              <Marker position={gpsPoint} icon={userIcon(gpsHeading)} ref={userMarkerRef}>
                <Popup>{currentSpeedKmh ? `${currentSpeedKmh.toFixed(0)} km/h` : 'You are here'}</Popup>
              </Marker>
              <Circle center={gpsPoint} radius={gpsAccuracy || 20} pathOptions={{ color: '#f9d616', weight: 2, fillColor: '#f9d616', fillOpacity: 0.12 }} />
            </>
          )}

          {/* Leaflet Routing Machine: only after user requests a route (routeKey > 0) */}
          {originCoords && destCoords && routeKey > 0 && (
            <RoutingMachine
              origin={originCoords}
              destination={destCoords}
              mode={transportMode}
              routeKey={routeKey}
              onRouteFound={({ coordinates, summary, instructions }) => {
                const coords = Array.isArray(coordinates) ? coordinates : [];
                setGeometry(coords);
                setNavSummary(summary || null);
                setNavSteps(instructions || []);
                setActiveStepIdx(0);
                setRouteSnapshot({ summary, geometry: coords });

                const km = summary?.totalDistance ? `${(summary.totalDistance / 1000).toFixed(1)} km` : '';
                const dur = summary?.totalTime ? (() => {
                  const totalM = Math.round(summary.totalTime / 60);
                  const h = Math.floor(totalM / 60);
                  const m = totalM % 60;
                  return `${h}h ${m}m`;
                })() : '';
                setDistance(km);
                setDuration(dur);

                if (coords.length) matchFuelStops(coords, allFuel);
                if (coords.length) fetchRoutePois(coords);
                hasRoute.current = true;
                setLoading(false);
                setDirectionsOpen(true);
              }}
              onRouteError={(msg) => {
                setError(msg || 'Could not calculate route.');
                setLoading(false);
                hasRoute.current = false;
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
            <Marker key={`${s.name}-${s.city}-${s.coords?.join(',') || i}`} position={s.coords} icon={yellowIcon}>
              <Popup>
                <strong>⛽ {s.name}</strong><br />
                {s.type} · {s.city}<br />
                <em style={{ fontSize: '11px' }}>{s.distanceFromRoute} km from route</em>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {showLocationModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(26,26,26,0.96)', color: '#fff', padding: 24, borderRadius: 10, maxWidth: 520, boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }}>
              <h3 style={{ margin: 0, color: '#FFD700' }}>Location Access Needed</h3>
              <p style={{ marginTop: 8, color: '#e5e7eb' }}>Namma Drive uses your device GPS to provide turn-by-turn guidance, snap-to-road, and safety alerts. Please enable location access in your browser or device settings.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => { setShowLocationModal(false); }} style={{ padding: '8px 12px', borderRadius: 6 }}>Dismiss</button>
                <button onClick={() => { setShowLocationModal(false); globalThis.open('about:preferences#privacy','_blank'); }} style={{ padding: '8px 12px', borderRadius: 6, background: '#ce1126', color: '#fff' }}>How to enable</button>
              </div>
            </div>
          </div>
        )}

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
              globalThis.speechSynthesis?.cancel?.();
              const u = new SpeechSynthesisUtterance(text);
              u.rate = 1.02;
              u.pitch = 1;
              u.lang = 'en-IN';
              globalThis.speechSynthesis?.speak?.(u);
            } catch {
              // no-op
            }
          }}
        />
      </div>
    </div>
  );
}

function userIcon(heading = 0) {
  const rot = (heading || 0) % 360;
  const svg = `
    <svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${rot}deg);">
      <g transform="translate(12,12)">
        <path d="M0,-10 L4,6 L0,2 L-4,6 Z" fill="#ce1126" stroke="#f9d616" stroke-width="1.2" />
      </g>
    </svg>`;
  return L.divIcon({ html: svg, className: 'user-arrow-icon', iconSize: [40, 40], iconAnchor: [20, 20] });
}

MapPage.propTypes = {
  loadedRoute: PropTypes.shape({
    origin: PropTypes.shape({
      name: PropTypes.string,
      coords: PropTypes.arrayOf(PropTypes.number),
    }),
    destination: PropTypes.shape({
      name: PropTypes.string,
      coords: PropTypes.arrayOf(PropTypes.number),
    }),
    transportMode: PropTypes.string,
    geometry: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    distance: PropTypes.string,
    duration: PropTypes.string,
    fuelStopsOnRoute: PropTypes.array,
  }),
  onNavigate: PropTypes.func.isRequired,
  onClearRoute: PropTypes.func.isRequired,
  user: PropTypes.object,
};