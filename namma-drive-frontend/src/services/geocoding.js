// ── Geocoding Service using Nominatim (Free, no API key) ──
// Restricted to Karnataka / India for relevant results
// Docs: https://nominatim.openstreetmap.org/search

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

// Karnataka bounding box [min_lat, max_lat, min_lon, max_lon]
const KA_VIEWBOX = '74.0,11.5,78.6,18.5'; // lon_min,lat_min,lon_max,lat_max

export async function geocodePlace(query) {
  const params = new URLSearchParams({
    q:              `${query}, Karnataka, India`,
    format:         'json',
    limit:          '6',
    countrycodes:   'in',
    viewbox:        KA_VIEWBOX,
    bounded:        '0',      // prefer Karnataka via viewbox; strict bounded=1 often returns zero hits
    addressdetails: '1',
  });

  const res = await fetch(`${NOMINATIM}?${params}`, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'NammaDrive/2.0' },
  });

  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
  const data = await res.json();

  return data.map(item => ({
    name:        item.display_name,
    shortName:   item.address?.city || item.address?.town || item.address?.village || item.name || query,
    lat:         parseFloat(item.lat),
    lon:         parseFloat(item.lon),
    type:        item.type,
    boundingbox: item.boundingbox?.map(Number), // [min_lat, max_lat, min_lon, max_lon]
  }));
}
