require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✓ MongoDB connected'))
    .catch(err => console.error('✗ MongoDB connection failed:', err.message));
}
const routeSchema = new mongoose.Schema({
  title: { type: String, default: 'Untitled Route' },
  originCity: { type: String, default: '' },      // CO2: for analytics (e.g. "Most popular from Bengaluru")
  origin: { name: String, coords: [Number] },
  destination: { name: String, coords: [Number] },
  distance: String,
  duration: String,
  transportMode: { type: String, default: 'car' },
  geometry: [Array],
  fuelStopsOnRoute: [{ name: String, coords: [Number], type: String, city: String, distanceFromRoute: Number }],
  weatherAtSave: {
    temp: Number, description: String, main: String,
    icon: String, humidity: Number, wind: Number,
  },
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
  rating: { type: Number, default: 4.5 },
  description: String
});
const POIModel = mongoose.model('POI', poiSchema);

// ── User Schema (Clerk Integration) ──────────────────────────
const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: String,
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});
const UserModel = mongoose.model('User', userSchema);

const POI_DATA = [
  { name: 'Kudremukh Trek', category: 'Trek', coords: [13.2144, 75.2479], rating: 4.8, description: 'One of the most beautiful treks in the Western Ghats.' },
  { name: 'Kodachadri Peak', category: 'Trek', coords: [13.8580, 74.8722], rating: 4.7, description: 'Lush green forests and sunset views.' },
  { name: 'Kumara Parvatha', category: 'Trek', coords: [12.6644, 75.6183], rating: 4.9, description: 'Challenging but rewarding trek near Kukke Subramanya.' },
  { name: 'Hampi Virupaksha', category: 'Temple', coords: [15.3350, 76.4590], rating: 4.9, description: 'Ancient temple in the UNESCO site of Hampi.' },
  { name: 'Murudeshwar Temple', category: 'Temple', coords: [14.0941, 74.4849], rating: 4.8, description: 'Gigantic Shiva statue by the Arabian Sea.' },
  { name: 'Chamundi Hills', category: 'Temple', coords: [12.2750, 76.6700], rating: 4.7, description: 'Iconic temple overlooking Mysore city.' },
  { name: 'Halebidu Hoysaleswara', category: 'Temple', coords: [13.2133, 75.9936], rating: 4.8, description: 'Masterpiece of Hoysala architecture.' },
  { name: 'Belur Chennakeshava', category: 'Temple', coords: [13.1622, 75.8600], rating: 4.8, description: 'Ornate temple with exquisite carvings.' },
  { name: 'Abbey Falls', category: 'Picnic', coords: [12.4500, 75.7200], rating: 4.6, description: 'Beautiful waterfall near Madikeri.' },
  { name: 'Shivanasamudra Falls', category: 'Picnic', coords: [12.3023, 77.1673], rating: 4.7, description: 'Breathtaking segmented waterfalls.' },
  { name: 'Jog Falls', category: 'Picnic', coords: [14.2285, 74.8117], rating: 4.8, description: 'Second-highest plunge waterfall in India.' },
  { name: 'Coorg Coffee Plantations', category: 'Picnic', coords: [12.3375, 75.8061], rating: 4.7, description: 'Perfect for a relaxing day among coffee shrubs.' },
  { name: 'Nandi Hills', category: 'Picnic', coords: [13.3702, 77.6835], rating: 4.5, description: 'Classic sunrise and picnic spot near Bengaluru.' },
];

async function seedPOIs() {
  if (mongoose.connection.readyState !== 1) return;
  const count = await POIModel.countDocuments();
  if (count === 0) {
    await POIModel.insertMany(POI_DATA);
    console.log('✓ POI data seeded');
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
let Route = RouteModel;
if (!process.env.MONGODB_URI || mongoose.connection.readyState !== 1) Route = MemoryRoute;
let City = CityModel;
if (!process.env.MONGODB_URI || mongoose.connection.readyState !== 1) City = MemoryCity;

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
    const pois = await POIModel.find(filter);
    res.json({ success: true, count: pois.length, pois });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
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
  } catch (err) { res.status(500).json({ success:false, error:err.message }); }
});

app.get('/api/routes/history', async (req,res) => { try { let routes = await Route.find(); if (!routes.sort) routes = routes.slice(); routes = routes.sort ? routes.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)).slice(0,50) : routes; res.json({ success:true, count:routes.length, routes }); } catch (err) { res.status(500).json({ success:false, error:err.message }); } });
app.get('/api/routes/:id', async (req,res) => { try { const route = await Route.findById(req.params.id); if (!route) return res.status(404).json({ success:false, message:'Route not found' }); res.json({ success:true, route }); } catch (err) { res.status(500).json({ success:false, error:err.message }); } });
app.delete('/api/routes/:id', async (req,res) => { try { const route = await Route.findByIdAndDelete(req.params.id); if (!route) return res.status(404).json({ success:false, message:'Route not found' }); res.json({ success:true, message:'Route deleted' }); } catch (err) { res.status(500).json({ success:false, error:err.message }); } });


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Namma Drive server running on http://localhost:${PORT}`));

