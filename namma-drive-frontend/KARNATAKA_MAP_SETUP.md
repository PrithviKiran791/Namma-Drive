# Karnataka Map Image Setup

## Quick Setup

1. **Save the Karnataka map image** you showed me as:
   ```
   namma-drive-frontend/src/assets/karnataka-map.png
   ```

2. **Restart the dev server:**
   ```bash
   cd namma-drive-frontend
   npm run dev
   ```

3. **The map will appear** on the right side of the landing page!

## Layout

The landing page now has a **two-column layout**:

**Left Side:**
- "Karnataka Route Planner" badge
- "Roads of Karnataka, mapped for you" headline
- Description text
- "Start routing" and "View history" buttons
- Stats (70+ destinations, 30+ hotels, Free to use)

**Right Side:**
- Karnataka map image with:
  - Cities labeled (Bengaluru, Mysuru, Mangaluru, etc.)
  - Neighboring states shown
  - Topographical details
  - Floating animation effect
  - Golden glow shadow

## Features

✅ **Responsive design** - Stacks vertically on mobile
✅ **Floating animation** - Map gently floats up and down
✅ **Golden glow** - Drop shadow matches Karnataka theme
✅ **Proper alignment** - Centered and balanced layout
✅ **Updated stats** - Shows 70+ destinations and 30+ hotels

## If Image is Missing

If you see a broken image icon, the file path should be:
```
namma-drive-frontend/src/assets/karnataka-map.png
```

Make sure the image file is saved in that exact location!

## Alternative: Use a Placeholder

If you don't have the image file yet, you can temporarily use a placeholder by updating LandingPage.jsx:

```jsx
// Replace the import line with:
// import karnatakaMapImg from '../assets/karnataka-map.png';

// With this:
const karnatakaMapImg = 'https://via.placeholder.com/600x800/1a1a1a/f9d616?text=Karnataka+Map';
```

This will show a placeholder until you add the real image.
