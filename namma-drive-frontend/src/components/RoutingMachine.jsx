import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.js';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

function modeToOsrmProfile(mode) {
  if (mode === 'bike') return 'bike';
  if (mode === 'transit') return 'foot';
  if (mode === 'scenic') return 'car';
  return 'car';
}

export default function RoutingMachine({
  origin,
  destination,
  mode = 'car',
  routeKey,
  onRouteFound,
  onRouteError,
}) {
  const map = useMap();
  const originRef = useRef(origin);
  const destRef = useRef(destination);
  const onRouteFoundRef = useRef(onRouteFound);
  const onRouteErrorRef = useRef(onRouteError);

  useLayoutEffect(() => {
    originRef.current = origin;
    destRef.current = destination;
    onRouteFoundRef.current = onRouteFound;
    onRouteErrorRef.current = onRouteError;
  });

  const router = useMemo(() => {
    return L.Routing.osrmv1({
      serviceUrl: 'https://router.project-osrm.org/route/v1',
      profile: modeToOsrmProfile(mode),
      timeout: 30 * 1000,
    });
  }, [mode]);

  // Only re-fetch when `routeKey` changes (user tapped Calculate / POI route / mode recalc).
  // Do NOT depend on origin/destination — otherwise every destination edit opens turn-by-turn.
  useEffect(() => {
    if (!routeKey) return undefined;
    const o = originRef.current;
    const d = destRef.current;
    if (!o || !d) return undefined;

    const control = L.Routing.control({
      waypoints: [L.latLng(o[0], o[1]), L.latLng(d[0], d[1])],
      router,
      show: false,
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: false,
      draggableWaypoints: false,
      createMarker: () => null,
      lineOptions: {
        styles: [{ color: 'transparent', opacity: 0, weight: 0 }],
      },
    }).addTo(map);

    const handleRoutesFound = (e) => {
      const r = e?.routes?.[0];
      if (!r) return;
      const coordinates = (r.coordinates || []).map((c) => [c.lat, c.lng]);
      onRouteFoundRef.current?.({
        coordinates,
        summary: r.summary || {},
        instructions: r.instructions || [],
        waypoints: r.waypoints || [],
      });
    };

    control.on('routesfound', handleRoutesFound);
    control.on('routingerror', () => {
      onRouteErrorRef.current?.('Could not find a route. Try a different destination or transport mode.');
    });
    control.route();

    return () => {
      control.off('routesfound', handleRoutesFound);
      control.off('routingerror');
      map.removeControl(control);
    };
  }, [map, router, routeKey]);

  return null;
}

