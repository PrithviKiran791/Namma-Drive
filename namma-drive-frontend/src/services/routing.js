// Decode OSRM polyline string → [[lat, lng], ...]
export function decodePolyline(encoded) {
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

export const calculateRoute = async (originCoords, destCoords, mode = 'car') => {
  const [lat1, lng1] = originCoords;
  const [lat2, lng2] = destCoords;

  let profile = 'driving';
  if (mode === 'bike') profile = 'cycling';
  if (mode === 'transit') profile = 'foot'; // Fallback to foot for transit-like ETA

  const url =
    `https://router.project-osrm.org/route/v1/${profile}/` +
    `${lng1},${lat1};${lng2},${lat2}` +
    `?overview=full&geometries=polyline`;

  const res  = await fetch(url);
  const data = await res.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No route found');
  }

  const route   = data.routes[0];
  const geo     = decodePolyline(route.geometry);
  const km      = (route.distance / 1000).toFixed(1);
  const totalM  = Math.round(route.duration / 60);
  const hours   = Math.floor(totalM / 60);
  const mins    = totalM % 60;

  return {
    geometry: geo,
    distance: `${km} km`,
    duration: `${hours}h ${mins}m`,
    rawDistance: route.distance,
    rawDuration: route.duration
  };
};
