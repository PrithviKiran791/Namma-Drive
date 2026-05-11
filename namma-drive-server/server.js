require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');

const app = express();

// ── Middleware ────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
  ]
}));
app.use(express.json());

// ── MongoDB connection ────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => {
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// ── Route Schema ──────────────────────────────────────────
const routeSchema = new mongoose.Schema({
  title:       { type: String, default: 'Untitled Route' },
  origin:      { name: String, coords: [Number] },
  destination: { name: String, coords: [Number] },
  distance:    String,
  duration:    String,
  geometry:    [Array],
  fuelStopsOnRoute: [{
    name:              String,
    coords:            [Number],
    type:              String,
    city:              String,
    distanceFromRoute: Number,
  }],
  timestamp: { type: Date, default: Date.now },
});

const Route = mongoose.model('Route', routeSchema);

// ── Hardcoded fuel stops ──────────────────────────────────
const FUEL_STOPS = [
  { name: 'Indian Oil — Mysore Road',   coords: [12.8256, 77.4940], type: 'both',   city: 'Bengaluru'    },
  { name: 'Taj Petroleum — Bengaluru',  coords: [12.9716, 77.5946], type: 'both',   city: 'Bengaluru'    },
  { name: 'BPCL — Nandi Hills',         coords: [13.3641, 77.6622], type: 'both',   city: 'Nandi Hills'  },
  { name: 'HP — Kolar',                 coords: [13.1373, 78.1288], type: 'petrol', city: 'Kolar'        },
  { name: 'Indian Oil — Chikballapur',  coords: [13.4371, 77.8255], type: 'both',   city: 'Chikballapur' },
  { name: 'Shell — Pune Road',          coords: [12.8517, 77.6412], type: 'both',   city: 'Bengaluru'    },
  { name: 'BPCL — Tumkur',             coords: [13.2170, 77.1141], type: 'both',   city: 'Tumkur'       },
  { name: 'Indian Oil — Kunigal',       coords: [13.1847, 76.8906], type: 'petrol', city: 'Kunigal'      },
  { name: 'HP — Nelamangala',           coords: [13.0667, 77.4630], type: 'both',   city: 'Nelamangala'  },
  { name: 'Shell — Mysore City',        coords: [12.2958, 76.6394], type: 'both',   city: 'Mysore'       },
  { name: 'Indian Oil — Channapatna',   coords: [12.6585, 77.2698], type: 'both',   city: 'Channapatna'  },
  { name: 'BPCL — Hassan',             coords: [13.2019, 75.9208], type: 'both',   city: 'Hassan'       },
  { name: 'HP — Chickmagalur',          coords: [13.3186, 75.2316], type: 'petrol', city: 'Chickmagalur' },
  { name: 'Indian Oil — Davangere',     coords: [14.4644, 75.9217], type: 'both',   city: 'Davangere'    },
  { name: 'Shell — Hubli',             coords: [15.3647, 75.1240], type: 'both',   city: 'Hubli'        },
  { name: 'BPCL — Belgaum',           coords: [15.8596, 75.6245], type: 'both',   city: 'Belgaum'      },
  { name: 'Indian Oil — Mangalore',     coords: [12.8628, 74.8455], type: 'both',   city: 'Mangalore'    },
  { name: 'HP — Puttur',              coords: [12.8333, 75.2333], type: 'petrol', city: 'Puttur'       },
  { name: 'Shell — Shimoga',           coords: [13.9299, 75.5680], type: 'both',   city: 'Shimoga'      },
  { name: 'BPCL — Udupi',            coords: [13.3409, 74.7421], type: 'both',   city: 'Udupi'        },
];

// ── API endpoints ─────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Namma Drive server is running ✓' });
});

// Get all fuel stops
app.get('/api/fuel-stops', (req, res) => {
  res.json({ success: true, count: FUEL_STOPS.length, stops: FUEL_STOPS });
});

// Save a route
app.post('/api/routes/save', async (req, res) => {
  try {
    const { title, origin, destination, distance, duration, geometry, fuelStopsOnRoute } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ success: false, message: 'origin and destination are required' });
    }

    const route = await new Route({
      title: title || `${origin.name} → ${destination.name}`,
      origin,
      destination,
      distance,
      duration,
      geometry:         geometry         || [],
      fuelStopsOnRoute: fuelStopsOnRoute || [],
    }).save();

    res.status(201).json({ success: true, route });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get route history
app.get('/api/routes/history', async (req, res) => {
  try {
    const routes = await Route.find().sort({ timestamp: -1 }).limit(50);
    res.json({ success: true, count: routes.length, routes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single route
app.get('/api/routes/:id', async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, route });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a route
app.delete('/api/routes/:id', async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, message: 'Route deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Start server ──────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚗 Namma Drive server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});