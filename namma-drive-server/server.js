require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = express();

// CORS middleware that explicitly sets headers
app.use((req, res, next) => {
  console.log(`[CORS] ${req.method} ${req.path}`);
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.set('Access-Control-Max-Age', '3600');
  if (req.method === 'OPTIONS') {
    console.log(`[CORS] Responding to OPTIONS with ACOA: *`);
    res.set('Content-Length', '0');
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✓ MongoDB connected'))
    .catch(err => console.error('✗ MongoDB connection failed:', err.message));
}
const routeSchema = new mongoose.Schema({
  title: { type: String, default: 'Untitled Route' },
  originCity: { type: String, default: '' },
  origin: { type: mongoose.Schema.Types.Mixed, default: {} },
  destination: { type: mongoose.Schema.Types.Mixed, default: {} },
  distance: String,
  duration: String,
  transportMode: { type: String, default: 'car' },
  geometry: { type: mongoose.Schema.Types.Mixed, default: [] },
  fuelStopsOnRoute: { type: mongoose.Schema.Types.Mixed, default: [] },
  weatherAtSave: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
});
const RouteModel = mongoose.model('Route', routeSchema);

// ── Cities (CO2): center point + bounds for map viewport ─────────
const citySchema = new mongoose.Schema({
  id: { type: String, index: true, unique: true },
  name: { type: String, default: '' },
  center: { type: [Number], default: undefined }, // [lat, lon]
  // bounds as [[south, west], [north, east]]
  bounds: { type: [[Number]], default: undefined },
  updatedAt: { type: Date, default: Date.now },
});
const CityModel = mongoose.model('City', citySchema);

class MemoryCity {
  constructor(obj = {}) { Object.assign(this, obj); this.updatedAt = this.updatedAt || new Date(); }
  async save() { MemoryCity.store.set(this.id, this); return this; }
  static async findOne(filter) {
    if (!filter?.id) return null;
    return MemoryCity.store.get(filter.id) || null;
  }
  static async create(obj) {
    const inst = new MemoryCity(obj);
    MemoryCity.store.set(inst.id, inst);
    return inst;
  }
}
MemoryCity.store = new Map();

// ── POI Discovery Engine (New for V2) ──────────────────────────
const poiSchema = new mongoose.Schema({
  name: String,
  category: { type: String, enum: ['Trek', 'Temple', 'Picnic'] },
  coords: [Number],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: undefined,
    },
  },
  rating: { type: Number, default: 4.5 },
  description: String
});
poiSchema.index({ location: '2dsphere' });

poiSchema.pre('save', async function() {
  if (Array.isArray(this.coords) && this.coords.length === 2) {
    this.location = {
      type: 'Point',
      coordinates: [this.coords[1], this.coords[0]],
    };
  }
});
const POIModel = mongoose.model('POI', poiSchema);

// ── User Schema (supports local auth + optional Clerk) ───────
const userSchema = new mongoose.Schema({
  username: { type: String, index: true, unique: true, sparse: true },
  email: { type: String, index: true, unique: true, required: true },
  passwordHash: { type: String }, // bcrypt hash for local auth
  clerkId: { type: String, index: true, unique: true, sparse: true },
  name: String,
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
});
const UserModel = mongoose.model('User', userSchema);

const POI_DATA = [
  // Treks
  { name: 'Kudremukh Trek', category: 'Trek', coords: [13.2144, 75.2479], rating: 4.8, description: 'One of the most beautiful treks in the Western Ghats.' },
  { name: 'Kodachadri Peak', category: 'Trek', coords: [13.8580, 74.8722], rating: 4.7, description: 'Lush green forests and sunset views.' },
  { name: 'Kumara Parvatha', category: 'Trek', coords: [12.6644, 75.6183], rating: 4.9, description: 'Challenging but rewarding trek near Kukke Subramanya.' },
  { name: 'Tadiandamol Peak', category: 'Trek', coords: [12.3833, 75.6833], rating: 4.7, description: 'Highest peak in Coorg, perfect for trekking.' },
  { name: 'Mullayanagiri Trek', category: 'Trek', coords: [13.3897, 75.7181], rating: 4.8, description: 'Highest peak in Karnataka with stunning views.' },
  
  // Temples
  { name: 'Hampi Virupaksha', category: 'Temple', coords: [15.3350, 76.4590], rating: 4.9, description: 'Ancient temple in the UNESCO site of Hampi.' },
  { name: 'Murudeshwar Temple', category: 'Temple', coords: [14.0941, 74.4849], rating: 4.8, description: 'Gigantic Shiva statue by the Arabian Sea.' },
  { name: 'Chamundi Hills', category: 'Temple', coords: [12.2750, 76.6700], rating: 4.7, description: 'Iconic temple overlooking Mysore city.' },
  { name: 'Halebidu Hoysaleswara', category: 'Temple', coords: [13.2133, 75.9936], rating: 4.8, description: 'Masterpiece of Hoysala architecture.' },
  { name: 'Belur Chennakeshava', category: 'Temple', coords: [13.1622, 75.8600], rating: 4.8, description: 'Ornate temple with exquisite carvings.' },
  { name: 'Udupi Krishna Temple', category: 'Temple', coords: [13.3409, 74.7421], rating: 4.8, description: 'Famous Krishna temple and pilgrimage center.' },
  { name: 'Gokarna Mahabaleshwar', category: 'Temple', coords: [14.5479, 74.3188], rating: 4.7, description: 'Ancient Shiva temple on the beach.' },
  { name: 'Dharmasthala Manjunatha', category: 'Temple', coords: [12.9489, 75.3822], rating: 4.8, description: 'Major pilgrimage site in Karnataka.' },
  
  // Picnic Spots & Waterfalls
  { name: 'Abbey Falls', category: 'Picnic', coords: [12.4500, 75.7200], rating: 4.6, description: 'Beautiful waterfall near Madikeri.' },
  { name: 'Shivanasamudra Falls', category: 'Picnic', coords: [12.3023, 77.1673], rating: 4.7, description: 'Breathtaking segmented waterfalls.' },
  { name: 'Jog Falls', category: 'Picnic', coords: [14.2285, 74.8117], rating: 4.8, description: 'Second-highest plunge waterfall in India.' },
  { name: 'Coorg Coffee Plantations', category: 'Picnic', coords: [12.3375, 75.8061], rating: 4.7, description: 'Perfect for a relaxing day among coffee shrubs.' },
  { name: 'Nandi Hills', category: 'Picnic', coords: [13.3702, 77.6835], rating: 4.5, description: 'Classic sunrise and picnic spot near Bengaluru.' },
  { name: 'Iruppu Falls', category: 'Picnic', coords: [11.9167, 75.9833], rating: 4.6, description: 'Sacred waterfall in Brahmagiri range.' },
  { name: 'Unchalli Falls', category: 'Picnic', coords: [14.3833, 74.7167], rating: 4.7, description: 'Hidden gem waterfall near Sirsi.' },
  { name: 'Hebbe Falls', category: 'Picnic', coords: [13.4167, 75.7667], rating: 4.6, description: 'Scenic waterfall in Chikmagalur.' },
  
  // Hotels & Resorts - Coorg
  { name: 'Taj Madikeri Resort & Spa', category: 'Hotel', coords: [12.4244, 75.7382], rating: 4.8, description: 'Luxury resort with stunning valley views in Coorg.' },
  { name: 'The Tamara Coorg', category: 'Hotel', coords: [12.3833, 75.7500], rating: 4.7, description: 'Premium eco-resort amidst coffee plantations.' },
  { name: 'Evolve Back Coorg', category: 'Hotel', coords: [12.3500, 75.8000], rating: 4.9, description: 'Ultra-luxury resort with private pool villas.' },
  { name: 'Club Mahindra Madikeri', category: 'Hotel', coords: [12.4200, 75.7300], rating: 4.5, description: 'Family-friendly resort in the hills.' },
  { name: 'Coorg Wilderness Resort', category: 'Hotel', coords: [12.3700, 75.7600], rating: 4.6, description: 'Nature resort with adventure activities.' },
  
  // Hotels & Resorts - Chikmagalur
  { name: 'The Serai Chikmagalur', category: 'Hotel', coords: [13.3161, 75.7720], rating: 4.8, description: 'Luxury coffee estate resort.' },
  { name: 'Trivik Hotels & Resorts', category: 'Hotel', coords: [13.2900, 75.7500], rating: 4.7, description: 'Boutique resort with mountain views.' },
  { name: 'Java Rain Resort', category: 'Hotel', coords: [13.3000, 75.7800], rating: 4.6, description: 'Eco-friendly resort in coffee plantations.' },
  
  // Hotels & Resorts - Hampi
  { name: 'Evolve Back Hampi', category: 'Hotel', coords: [15.3350, 76.4600], rating: 4.8, description: 'Heritage luxury resort near Hampi ruins.' },
  { name: 'Hyatt Place Hampi', category: 'Hotel', coords: [15.3300, 76.4700], rating: 4.6, description: 'Modern hotel with heritage views.' },
  { name: 'Kishkinda Heritage Resort', category: 'Hotel', coords: [15.3400, 76.4650], rating: 4.5, description: 'Traditional resort near Hampi monuments.' },
  
  // Hotels & Resorts - Mysuru
  { name: 'Lalitha Mahal Palace Hotel', category: 'Hotel', coords: [12.2800, 76.6500], rating: 4.7, description: 'Heritage palace hotel in Mysore.' },
  { name: 'The Windflower Resort & Spa', category: 'Hotel', coords: [12.2900, 76.6400], rating: 4.6, description: 'Luxury resort with spa facilities.' },
  { name: 'Radisson Blu Plaza Mysore', category: 'Hotel', coords: [12.3100, 76.6550], rating: 4.5, description: 'Premium hotel in the heart of Mysore.' },
  
  // Hotels & Resorts - Coastal Karnataka
  { name: 'Taj Gateway Hotel Gokarna', category: 'Hotel', coords: [14.5500, 74.3200], rating: 4.6, description: 'Beachfront resort in Gokarna.' },
  { name: 'Om Beach Resort', category: 'Hotel', coords: [14.5350, 74.3100], rating: 4.4, description: 'Budget-friendly beach resort.' },
  { name: 'The Gateway Hotel Mangalore', category: 'Hotel', coords: [12.8700, 74.8500], rating: 4.5, description: 'Business hotel near Mangalore beach.' },
  { name: 'Vivanta Mangalore', category: 'Hotel', coords: [12.8650, 74.8450], rating: 4.6, description: 'Luxury hotel with coastal cuisine.' },
  
  // Hotels & Resorts - Bengaluru Outskirts
  { name: 'Clarks Exotica Resort', category: 'Hotel', coords: [13.3500, 77.7000], rating: 4.5, description: 'Convention resort near Bengaluru.' },
  { name: 'Eagleton Golf Resort', category: 'Hotel', coords: [13.0500, 77.4500], rating: 4.6, description: 'Golf resort with luxury amenities.' },
  { name: 'The Windflower Resorts Bandipur', category: 'Hotel', coords: [11.6700, 76.6300], rating: 4.7, description: 'Wildlife resort near Bandipur National Park.' },
  
  // Hotels & Resorts - Kabini
  { name: 'Evolve Back Kabini', category: 'Hotel', coords: [11.9575, 76.3673], rating: 4.9, description: 'Luxury jungle resort on Kabini river.' },
  { name: 'The Serai Kabini', category: 'Hotel', coords: [11.9600, 76.3700], rating: 4.8, description: 'Premium wildlife resort with safaris.' },
  { name: 'Kabini River Lodge', category: 'Hotel', coords: [11.9550, 76.3650], rating: 4.6, description: 'Heritage forest lodge by the river.' },
  
  // Hotels & Resorts - Dandeli
  { name: 'Whistling Woodzs Resort', category: 'Hotel', coords: [15.2500, 74.6300], rating: 4.5, description: 'Adventure resort in Dandeli forests.' },
  { name: 'Dandeli Jungle Inn', category: 'Hotel', coords: [15.2492, 74.6297], rating: 4.4, description: 'Eco-resort with river rafting.' },
  
  // Hotels & Resorts - Badami/Aihole
  { name: 'Badami Court', category: 'Hotel', coords: [15.9200, 75.6980], rating: 4.3, description: 'Heritage hotel near Badami caves.' },
  { name: 'Krishna Heritage Hotel', category: 'Hotel', coords: [15.9150, 75.6950], rating: 4.2, description: 'Budget hotel with cave views.' },
  
  // Hill Stations & Scenic Spots
  { name: 'Agumbe Sunset Point', category: 'Picnic', coords: [13.5039, 75.0896], rating: 4.7, description: 'Cherrapunji of South India with stunning sunsets.' },
  { name: 'Sakleshpur Hill Station', category: 'Picnic', coords: [12.9400, 75.7850], rating: 4.6, description: 'Coffee estates and trekking trails.' },
  { name: 'Baba Budangiri', category: 'Picnic', coords: [13.4000, 75.7667], rating: 4.7, description: 'Mountain range with caves and coffee history.' },
  { name: 'Kemmangundi Hill Station', category: 'Picnic', coords: [13.5500, 75.7667], rating: 4.6, description: 'Beautiful gardens and mountain views.' },
  
  // Wildlife & Nature
  { name: 'Bandipur National Park', category: 'Picnic', coords: [11.6693, 76.6273], rating: 4.7, description: 'Tiger reserve and wildlife sanctuary.' },
  { name: 'Nagarhole National Park', category: 'Picnic', coords: [12.0000, 76.1000], rating: 4.8, description: 'Rich wildlife and elephant sightings.' },
  { name: 'Bhadra Wildlife Sanctuary', category: 'Picnic', coords: [13.5667, 75.6500], rating: 4.6, description: 'Tiger reserve in Chikmagalur.' },
  
  // Beaches
  { name: 'Malpe Beach', category: 'Picnic', coords: [13.3500, 74.7050], rating: 4.5, description: 'Popular beach near Udupi with water sports.' },
  { name: 'Karwar Beach', category: 'Picnic', coords: [14.8167, 74.1333], rating: 4.6, description: 'Pristine beach on the Konkan coast.' },
  { name: 'Kaup Beach', category: 'Picnic', coords: [13.2333, 74.7500], rating: 4.5, description: 'Beach with historic lighthouse.' },
  { name: 'Panambur Beach', category: 'Picnic', coords: [12.9500, 74.8167], rating: 4.4, description: 'Clean beach near Mangalore port.' },
];

async function seedPOIs() {
  if (mongoose.connection.readyState !== 1) return;
  const count = await POIModel.countDocuments();
  if (count === 0) {
    await POIModel.insertMany(POI_DATA.map((poi) => ({
      ...poi,
      location: {
        type: 'Point',
        coordinates: [poi.coords[1], poi.coords[0]],
      },
    })));
    console.log('✓ POI data seeded');
  }

  const stalePois = await POIModel.find({ $or: [{ location: { $exists: false } }, { location: null }] });
  for (const poi of stalePois) {
    if (Array.isArray(poi.coords) && poi.coords.length === 2) {
      poi.location = { type: 'Point', coordinates: [poi.coords[1], poi.coords[0]] };
      await poi.save();
    }
  }
}
if (process.env.MONGODB_URI) {
  mongoose.connection.once('open', seedPOIs);
}

class MemoryRoute {
  constructor(obj = {}) { Object.assign(this, obj); this._id = this._id || Math.random().toString(36).substring(2,9); this.timestamp = this.timestamp || new Date(); }
  async save() { MemoryRoute.store.push(this); return this; }
  static async find() { return [...MemoryRoute.store]; }
  static async findById(id) { return MemoryRoute.store.find(r => String(r._id) === String(id)) || null; }
  static async findByIdAndDelete(id) { const idx = MemoryRoute.store.findIndex(r => String(r._id) === String(id)); if (idx === -1) return null; const [deleted] = MemoryRoute.store.splice(idx,1); return deleted; }
  static async create(obj) { const inst = new MemoryRoute(obj); MemoryRoute.store.push(inst); return inst; }
}
MemoryRoute.store = [];
let Route = process.env.MONGODB_URI ? RouteModel : MemoryRoute;
let City = process.env.MONGODB_URI ? CityModel : MemoryCity;

const CITY_SEED = [
  { id: 'bengaluru', name: 'Bengaluru', center: [12.9716, 77.5946] },
  { id: 'mysuru', name: 'Mysuru', center: [12.2958, 76.6394] },
  { id: 'hubballi', name: 'Hubballi', center: [15.3647, 75.1240] },
  { id: 'mangaluru', name: 'Mangaluru', center: [12.8628, 74.8455] },
  { id: 'belagavi', name: 'Belagavi', center: [15.8596, 75.6245] },
];

async function seedCities() {
  try {
    for (const c of CITY_SEED) {
      const existing = await City.findOne({ id: c.id });
      if (!existing) await City.create(c);
    }
  } catch (e) {
    console.warn('City seed skipped:', e.message);
  }
}
if (process.env.MONGODB_URI) {
  mongoose.connection.once('open', seedCities);
} else {
  seedCities();
}

async function nominatimCityLookup(name) {
  if (typeof fetch !== 'function') throw new Error('Node fetch not available (need Node 18+)');
  const qs = new URLSearchParams({
    q: `${name}, Karnataka, India`,
    format: 'json',
    limit: '1',
    countrycodes: 'in',
    addressdetails: '1',
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${qs.toString()}`, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'NammaDrive/2.0' },
  });
  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
  const data = await res.json();
  if (!data?.length) return null;
  const item = data[0];
  const center = [Number(item.lat), Number(item.lon)];
  const bb = item.boundingbox?.map(Number); // [south, north, west, east]
  const bounds = (bb?.length === 4) ? [[bb[0], bb[2]], [bb[1], bb[3]]] : undefined;
  return { center, bounds };
}

const FUEL_STOPS = [
  { name: 'Indian Oil — Mysore Road', coords: [12.8256,77.4940], type:'both', city:'Bengaluru' },
  { name: 'Taj Petroleum — Bengaluru', coords: [12.9716,77.5946], type:'both', city:'Bengaluru' },
  { name: 'Shell — Mysore City', coords: [12.2958,76.6394], type:'both', city:'Mysore' },
];

app.get('/api/health', (req,res) => res.json({ status:'OK', message:'Namma Drive server is running ✓' }));

// User Sync (Clerk)
app.post('/api/users/sync', async (req, res) => {
  try {
    const { clerkId, email, name, imageUrl } = req.body;
    if (!clerkId || !email) return res.status(400).json({ success: false, message: 'clerkId and email are required' });

    const user = await UserModel.findOneAndUpdate(
      { clerkId },
      { email, name, imageUrl, lastLogin: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/fuel-stops', (req,res) => res.json({ success:true, count:FUEL_STOPS.length, stops:FUEL_STOPS }));

// Cities endpoint (CO2)
app.get('/api/cities/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').toLowerCase();
    let city = await City.findOne({ id });
    if (!city) return res.status(404).json({ success: false, message: 'City not found' });

    // If bounds missing, try to enrich via Nominatim (cache into DB/memory)
    if (!city.bounds || city.bounds.length !== 2) {
      const lookup = await nominatimCityLookup(city.name || id);
      if (lookup?.center) city.center = lookup.center;
      if (lookup?.bounds) city.bounds = lookup.bounds;
      city.updatedAt = new Date();
      if (typeof city.save === 'function') await city.save();
    }

    res.json({ success: true, city: { id: city.id, name: city.name, center: city.center, bounds: city.bounds } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POI Endpoints
app.get('/api/pois', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    let pois = [];
    if (process.env.MONGODB_URI && mongoose.connection.readyState === 1) {
      pois = await POIModel.find(filter);
    }
    if (!pois || pois.length === 0) {
      pois = category ? POI_DATA.filter(p => p.category === category) : POI_DATA;
      pois = pois.map((p, idx) => ({ ...p, _id: p._id || `poi-${idx}` }));
    }
    res.json({ success: true, count: pois.length, pois });
  } catch (err) { 
    const { category } = req.query;
    let fallback = category ? POI_DATA.filter(p => p.category === category) : POI_DATA;
    fallback = fallback.map((p, idx) => ({ ...p, _id: p._id || `poi-${idx}` }));
    res.json({ success: true, count: fallback.length, pois: fallback });
  }
});

app.post('/api/pois/near-route', async (req, res) => {
  try {
    const { center, radiusKm = 25, categories = [] } = req.body || {};
    if (!Array.isArray(center) || center.length !== 2) {
      return res.status(400).json({ success: false, message: 'center must be [lat, lon]' });
    }

    const [lat, lon] = center.map(Number);
    const query = Array.isArray(categories) && categories.length > 0
      ? { category: { $in: categories } }
      : {};

    const pois = await POIModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lon, lat] },
          distanceField: 'distanceMeters',
          spherical: true,
          maxDistance: Number(radiusKm) * 1000,
          query,
        },
      },
      {
        $addFields: {
          distanceKm: { $divide: ['$distanceMeters', 1000] },
        },
      },
      {
        $sort: { distanceMeters: 1 },
      },
      {
        $limit: 50,
      },
    ]);

    const enriched = pois.map((poi) => ({
      ...poi,
      coords: poi.coords?.length === 2
        ? poi.coords
        : (poi.location?.coordinates?.length === 2
          ? [poi.location.coordinates[1], poi.location.coordinates[0]]
          : []),
    }));

    // Server-side safety enrichment: for treks, check current weather and flag difficult conditions
    async function enrichWeatherForPoi(poi) {
      if (!poi || !Array.isArray(poi.coords) || poi.coords.length !== 2) return poi;
      if (poi.category !== 'Trek') return poi;
      try {
        const [plat, plon] = poi.coords;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${plat}&longitude=${plon}&current_weather=true&wind_speed_unit=kmh`;
        const r = await fetch(url);
        if (!r.ok) return poi;
        const j = await r.json();
        const cw = j.current_weather || {};
        const code = Number(cw.weathercode || 0);
        const wind = Number(cw.windspeed || 0);
        const isRainCode = [51,53,55,61,63,65,80,81,82,95,96,99].includes(code);
        const difficult = isRainCode || wind >= 40;
        return { ...poi, weather: { code, wind }, difficult };
      } catch (e) {
        return poi;
      }
    }

    const limited = enriched.slice(0, 50);
    const enrichedWithWeather = await Promise.all(limited.map(enrichWeatherForPoi));

    res.json({ success: true, count: enrichedWithWeather.length, pois: enrichedWithWeather });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/routes/save', async (req,res) => {
  try {
    const { title, originCity, origin_city, origin, destination, distance, duration, transportMode, geometry, fuelStopsOnRoute, weatherAtSave } = req.body;
    if (!origin || !destination) return res.status(400).json({ success:false, message:'origin and destination are required' });
    let route;
    const routeData = { 
      title: title || `${origin.name} → ${destination.name}`, 
      originCity: originCity || origin_city || origin?.name || '',
      origin, destination, distance, duration, transportMode: transportMode || 'car',
      geometry: geometry||[], fuelStopsOnRoute: fuelStopsOnRoute||[],
      ...(weatherAtSave ? { weatherAtSave } : {}),
    };
    if (Route === RouteModel) {
      route = await new Route(routeData).save();
    } else {
      route = await Route.create(routeData);
    }
    res.status(201).json({ success:true, route });
  } catch (err) { 
    console.error('[Route Save Error]', err);
    res.status(500).json({ success:false, error:err.message }); 
  }
});

app.get('/api/routes/history', async (req,res) => { 
  try { 
    let routes;
    if (Route === RouteModel) {
      routes = await Route.find().sort({ timestamp: -1 }).limit(50);
    } else {
      routes = await Route.find(); 
      routes = routes.slice().sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)).slice(0,50);
    }
    res.json({ success:true, count:routes.length, routes }); 
  } catch (err) { 
    res.status(500).json({ success:false, error:err.message }); 
  } 
});
app.get('/api/routes/:id', async (req,res) => { try { const route = await Route.findById(req.params.id); if (!route) return res.status(404).json({ success:false, message:'Route not found' }); res.json({ success:true, route }); } catch (err) { res.status(500).json({ success:false, error:err.message }); } });
app.delete('/api/routes/:id', async (req,res) => { try { const route = await Route.findByIdAndDelete(req.params.id); if (!route) return res.status(404).json({ success:false, message:'Route not found' }); res.json({ success:true, message:'Route deleted' }); } catch (err) { res.status(500).json({ success:false, error:err.message }); } });


const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_prod';

function generateToken(user) {
  return jwt.sign({ userId: String(user._id), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ success: false, message: 'Missing Authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, message: 'Malformed Authorization header' });
  try {
    const payload = jwt.verify(parts[1], JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// ── Auth routes ─────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
    const existing = await UserModel.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(409).json({ success: false, message: 'Email or username already in use' });
    const passwordHash = await hashPassword(password);
    const user = await UserModel.create({ username, email, passwordHash, name });
    const token = generateToken(user);
    res.status(201).json({ success: true, token, user: { id: user._id, username: user.username, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = email or username
    if (!identifier || !password) return res.status(400).json({ success: false, message: 'Identifier and password are required' });
    const user = await UserModel.findOne({ $or: [{ email: identifier }, { username: identifier }] });
    if (!user || !user.passwordHash) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    user.lastLogin = new Date();
    await user.save();
    const token = generateToken(user);
    res.json({ success: true, token, user: { id: user._id, username: user.username, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId).select('-passwordHash -__v');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.listen(PORT, () => console.log(`Namma Drive server running on http://localhost:${PORT}`));

