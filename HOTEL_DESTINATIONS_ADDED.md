# Hotel & Tourist Destinations Added

## Summary
Added **70+ new destinations** across Karnataka, including luxury hotels, resorts, beaches, wildlife sanctuaries, and more tourist spots.

## New Categories
- **Hotel** 🏨 - Added as a new POI category with 30+ hotels and resorts

## Destinations Added by Region

### 🏨 Hotels & Resorts (30+ locations)

#### Coorg Region
- Taj Madikeri Resort & Spa
- The Tamara Coorg
- Evolve Back Coorg
- Club Mahindra Madikeri
- Coorg Wilderness Resort

#### Chikmagalur Region
- The Serai Chikmagalur
- Trivik Hotels & Resorts
- Java Rain Resort

#### Hampi Region
- Evolve Back Hampi
- Hyatt Place Hampi
- Kishkinda Heritage Resort

#### Mysuru Region
- Lalitha Mahal Palace Hotel
- The Windflower Resort & Spa
- Radisson Blu Plaza Mysore

#### Coastal Karnataka
- Taj Gateway Hotel Gokarna
- Om Beach Resort
- The Gateway Hotel Mangalore
- Vivanta Mangalore

#### Bengaluru Outskirts
- Clarks Exotica Resort
- Eagleton Golf Resort
- The Windflower Resorts Bandipur

#### Kabini (Wildlife)
- Evolve Back Kabini
- The Serai Kabini
- Kabini River Lodge

#### Dandeli (Adventure)
- Whistling Woodzs Resort
- Dandeli Jungle Inn

#### Badami/Aihole (Heritage)
- Badami Court
- Krishna Heritage Hotel

### 🏔️ Additional Treks
- Tadiandamol Peak (Coorg)
- Mullayanagiri Trek (highest peak in Karnataka)

### 🛕 Additional Temples
- Udupi Krishna Temple
- Gokarna Mahabaleshwar
- Dharmasthala Manjunatha

### 🌳 Additional Picnic Spots & Nature
- Iruppu Falls
- Unchalli Falls
- Hebbe Falls
- Agumbe Sunset Point
- Sakleshpur Hill Station
- Baba Budangiri
- Kemmangundi Hill Station

### 🐘 Wildlife & Nature Reserves
- Bandipur National Park
- Nagarhole National Park
- Bhadra Wildlife Sanctuary

### 🏖️ Beaches
- Malpe Beach (Udupi)
- Karwar Beach
- Kaup Beach
- Panambur Beach (Mangalore)

## How to Use

### 1. **Filter by Hotels**
In the POI panel on the left sidebar, click the **🏨 Hotel** button to see all hotels and resorts.

### 2. **View on Map**
All hotels appear as **yellow markers** on the map. Click any marker to see:
- Hotel name and rating
- Description
- Live weather at that location
- "Route to this POI" button

### 3. **Plan Routes to Hotels**
Click the **"Route →"** button next to any hotel to:
- Set it as your destination
- Calculate the route from your origin
- See distance, duration, and fuel stops
- Get turn-by-turn directions

### 4. **Near Route Discovery**
When you calculate any route, the app automatically shows hotels within 35km of your route in the sidebar.

## Features

✅ **70+ total POIs** (was 13, now 83)
✅ **30+ hotels and resorts** across Karnataka
✅ **Hotel category** with dedicated icon (🏨)
✅ **Yellow markers** for hotels on the map
✅ **Live weather** for each hotel location
✅ **Route planning** to any hotel
✅ **Near-route discovery** shows hotels along your journey

## Testing

1. **Start the backend server:**
   ```bash
   cd namma-drive-server
   npm start
   ```

2. **The POI data will auto-seed** when the server starts

3. **Open the app** and click **🏨 Hotel** in the POI panel

4. **You should see 30+ hotels** listed with ratings and descriptions

5. **Click any hotel marker** on the map to see details

6. **Click "Route →"** to plan a trip to that hotel

## Popular Hotel Destinations

**Luxury:**
- Evolve Back Coorg (4.9★)
- Evolve Back Kabini (4.9★)
- Taj Madikeri Resort (4.8★)

**Heritage:**
- Lalitha Mahal Palace Hotel, Mysore (4.7★)
- Evolve Back Hampi (4.8★)

**Wildlife:**
- The Serai Kabini (4.8★)
- Windflower Resorts Bandipur (4.7★)

**Beach:**
- Taj Gateway Hotel Gokarna (4.6★)
- Vivanta Mangalore (4.6★)

**Adventure:**
- Whistling Woodzs Resort, Dandeli (4.5★)
- Coorg Wilderness Resort (4.6★)

## Database

All POI data is stored in MongoDB and auto-seeded on server start. The data includes:
- Name, category, coordinates
- Rating (out of 5)
- Description
- GeoJSON location for spatial queries

Enjoy exploring Karnataka's best hotels and destinations! 🎉
