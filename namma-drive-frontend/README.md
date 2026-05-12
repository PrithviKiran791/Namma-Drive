# Namma Drive Frontend

A React + Vite application for route planning across Karnataka with Clerk authentication.

## Features

- 🗺️ Interactive map with route planning
- 🔐 Clerk authentication (sign in/sign up)
- 📍 POI discovery and fuel stop finder
- 🌤️ Weather integration
- 📋 Route history and saving
- 🚗 Multiple transport modes (car, bike, transit)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Copy `.env.example` to `.env` and add your Clerk publishable key:
   ```
   VITE_API_URL=http://localhost:5000
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

## Authentication

This app uses [Clerk](https://clerk.com) for authentication. Users can:
- Sign in/sign up via modal
- Access protected features (save routes, view history)
- Manage their profile via Clerk's UserButton

## Tech Stack

- React 18
- Vite
- Clerk React SDK
- Leaflet (maps)
- Axios (API calls)
- Tailwind CSS

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
