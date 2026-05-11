# Namma Drive

Namma Drive is a full-stack route planning app for Karnataka. It combines a React + Vite frontend with an Express + MongoDB backend to let users plan routes, inspect fuel stops, save drives, browse history, reload saved routes, and delete old routes.

## System Architecture

The application is split into two independent parts:

- Frontend: `namma-drive-frontend`
- Backend: `namma-drive-server`

### Frontend architecture

The frontend is a single-page React application that handles all UI state in the browser.

Main responsibilities:

- Landing page with a 3D sphere hero
- Route planner map view using Leaflet and React Leaflet
- History view for saved routes
- Navigation between Landing, Map, and History screens
- Calling backend APIs for fuel stops and saved routes
- Drawing route lines, markers, and fuel stop points on the map

Key frontend flow:

1. User starts on the landing page.
2. User clicks Start routing.
3. Map page loads with Bengaluru and Mysore selected by default.
4. Route is calculated from OSRM.
5. Fuel stops are matched locally against route geometry.
6. Route can be saved to the backend.
7. History can reload or delete saved routes.

### Backend architecture

The backend is an Express API with MongoDB persistence.

Main responsibilities:

- Serve health check and fuel stop endpoints
- Save route data to MongoDB
- Return saved route history
- Return a single route by ID
- Delete a route by ID
- Enable CORS for the frontend origin

Backend data model:

- `Route`
  - title
  - origin
  - destination
  - distance
  - duration
  - geometry
  - fuelStopsOnRoute
  - timestamp

The backend also exposes a hardcoded list of fuel stops for Karnataka.

## Request Flow

### Route calculation flow

1. User selects origin and destination.
2. Frontend calls the OSRM routing service.
3. OSRM returns route distance, duration, and polyline geometry.
4. Frontend decodes the polyline into coordinates.
5. Route line is drawn on the Leaflet map.
6. Fuel stops are matched against the geometry using Haversine distance.
7. Nearby fuel stops are rendered as yellow markers and listed in the sidebar.

### Save and history flow

1. User enters a route name.
2. Frontend sends route data to `POST /api/routes/save`.
3. Backend stores the route in MongoDB.
4. History page calls `GET /api/routes/history`.
5. User can load a route with `GET /api/routes/:id`.
6. User can delete a route with `DELETE /api/routes/:id`.

## Tech Stack

### Frontend

- React 19
- Vite 8
- React DOM
- Axios
- Leaflet
- React Leaflet
- Three.js
- @react-three/fiber
- @react-three/drei

### Backend

- Node.js
- Express 5
- Mongoose 9
- CORS
- dotenv
- nodemon for development

### External services

- MongoDB Atlas for route persistence
- OSRM public routing API for route geometry and travel time
- OpenStreetMap tile server for map tiles

## Project Structure

```text
Namma Drive/
├── README.md
├── namma-drive-frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api.js
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       ├── main.jsx
│       ├── components/
│       │   ├── LandingPage.jsx
│       │   └── History.jsx
│       └── styles/
│           ├── LandingPage.css
│           ├── MapPage.css
│           ├── MapPage.jsx
│           └── History.css
└── namma-drive-server/
    ├── package.json
    └── server.js
```

## Dependencies

### Frontend dependencies

Installed in `namma-drive-frontend`:

- `react`
- `react-dom`
- `axios`
- `leaflet`
- `react-leaflet`
- `three`
- `@react-three/fiber`
- `@react-three/drei`

Frontend dev dependencies:

- `vite`
- `@vitejs/plugin-react`
- `eslint`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `globals`
- `@eslint/js`
- `@types/react`
- `@types/react-dom`

### Backend dependencies

Installed in `namma-drive-server`:

- `express`
- `mongoose`
- `cors`
- `dotenv`
- `nodemon` as a dev dependency

## Environment Variables

### Backend `.env`

Create `namma-drive-server/.env` with:

```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/namma-drive
PORT=5000
```

Notes:

- `MONGODB_URI` is required for saving and loading routes.
- If MongoDB is unavailable, route persistence and history will fail.
- The backend listens on port `5000` by default.

### Frontend `.env`

Create `namma-drive-frontend/.env` with:

```env
VITE_API_URL=http://localhost:5000
```

Notes:

- `VITE_API_URL` tells the frontend where the backend API is running.
- If omitted, the frontend falls back to `http://localhost:5000`.

## Local Setup

### Backend

```cmd
cd %USERPROFILE%\Desktop\Namma Drive\namma-drive-server
npm install
npm run dev
```

### Frontend

```cmd
cd %USERPROFILE%\Desktop\Namma Drive\namma-drive-frontend
npm install
npm run dev
```

## API Endpoints

### Health

- `GET /api/health`

### Fuel stops

- `GET /api/fuel-stops`

### Routes

- `POST /api/routes/save`
- `GET /api/routes/history`
- `GET /api/routes/:id`
- `DELETE /api/routes/:id`

## UI Features

- Dark landing page with 3D sphere
- Map centered on Karnataka
- Green origin marker and red destination marker
- Route line on the map
- Distance and duration summary in the sidebar
- Yellow fuel stop markers
- Fuel stop list with distance from route
- Save route to MongoDB
- History list with load and delete actions
- Return home from any page

## Important Notes

- The map requires `leaflet/dist/leaflet.css` to be imported.
- Leaflet map height must be non-zero, so the map page uses a full viewport layout.
- Save/history/delete features depend on MongoDB being connected.
- Fuel stop loading also depends on the backend API being reachable.

## Deployment Summary

### Backend

Recommended deployment target: Render

Environment variables:

- `MONGODB_URI`
- `PORT`
- `NODE_ENV=production`

### Frontend

Recommended deployment target: Vercel

Environment variables:

- `VITE_API_URL` pointing to the deployed backend URL

### CORS

The backend should allow:

- `http://localhost:5173`
- `http://localhost:3000`
- Your deployed Vercel frontend URL

## Development Checklist

Before shipping, verify:

- Landing page loads correctly
- Map renders with visible height
- Route calculation works
- Fuel stops load
- Saving works with MongoDB connected
- History loads saved routes
- Load and delete actions work
- CORS is set for the deployed frontend

## Summary

Namma Drive is a route-planning system with a React-based UI, Leaflet mapping, a Node.js API layer, MongoDB route storage, and external routing/tile services. The frontend handles presentation and routing UI, while the backend handles persistence and fuel stop data.
