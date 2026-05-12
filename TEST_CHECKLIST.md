# Testing Checklist - Clerk Auth Migration

## ✅ Pre-Flight Checks
- [ ] `.env` file exists with `VITE_CLERK_PUBLISHABLE_KEY`
- [ ] Backend server is running on port 5000
- [ ] Frontend dev server starts without errors: `npm run dev`
- [ ] No console errors on page load

## ✅ Authentication Flow
- [ ] Landing page loads correctly
- [ ] Click "Log in" → Clerk modal opens
- [ ] Can create new account with email/password
- [ ] After sign up, modal closes and user avatar appears
- [ ] Click user avatar → dropdown menu appears
- [ ] Can sign out from dropdown
- [ ] After sign out, "Log in" button reappears

## ✅ Navigation (Main Issue Fix)
- [ ] From Landing → Click "Open map" → Map page loads
- [ ] From Landing → Click "History" → History page loads
- [ ] From Map → Click "📋 History" button → History page loads
- [ ] From Map → Click "🏠 Home" button → Landing page loads
- [ ] From History → Click "Map" link → Map page loads
- [ ] From History → Click "Home" link → Landing page loads
- [ ] **No page glitches or freezes during navigation**
- [ ] **No console errors during navigation**

## ✅ Route Calculation (Previous Bug)
- [ ] Select origin (e.g., Bengaluru)
- [ ] Select destination (e.g., Mysuru)
- [ ] Click "📍 Calculate Route" button
- [ ] Route appears on map (blue line)
- [ ] Distance and duration display correctly
- [ ] **No app crash or glitch**
- [ ] Fuel stops appear in sidebar
- [ ] Turn-by-turn directions panel opens

## ✅ Protected Features (Requires Sign In)
- [ ] Sign in with Clerk
- [ ] Calculate a route
- [ ] Enter route name (optional)
- [ ] Click "💾 Save this drive"
- [ ] Success message appears
- [ ] Navigate to History page
- [ ] Saved route appears in list
- [ ] Click "Load" on saved route → Map page loads with route
- [ ] Click "Delete" on saved route → Route removed from list

## ✅ User Experience
- [ ] User avatar shows correct initial/image
- [ ] User name displays correctly in dropdown
- [ ] Sign out redirects to landing page
- [ ] Refresh page → User stays signed in (session persists)
- [ ] Open in incognito → "Log in" button shows (no session)

## 🐛 Known Issues to Watch For
- [ ] If navigation doesn't work, check browser console for errors
- [ ] If Clerk modal doesn't open, check `.env` file
- [ ] If routes don't save, check backend connection
- [ ] If user data doesn't sync, check `/api/users/sync` endpoint

## 📊 Success Criteria
All checkboxes above should be ✅ for the migration to be considered successful.

## 🆘 If Something Fails
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed API calls
4. Verify `.env` file has correct Clerk key
5. Verify backend is running: `curl http://localhost:5000/api/fuel-stops`
6. Clear browser cache and localStorage
7. Restart dev server
