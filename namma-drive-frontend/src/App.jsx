import { useState, Suspense, lazy } from 'react';
import { useUser } from '@clerk/clerk-react';
import LandingPage from './components/LandingPage';
import AuthSync from './components/AuthSync';
import './App.css';

const MapPage = lazy(() => import('./styles/MapPage'));
const History = lazy(() => import('./components/History'));

export default function App() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [page, setPage] = useState('landing');
  const [loadedRoute, setLoadedRoute] = useState(null);

  const handleNavigate = (destination) => {
    console.log('[App] Navigating from', page, 'to', destination);
    setPage(destination);
  };

  const handleLoadRoute = (route) => {
    console.log('[App] Loading route:', route?.title);
    setLoadedRoute(route);
    setPage('map');
  };

  // Convert Clerk user to our app's user format
  const appUser = isSignedIn && user ? {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress,
    name: user.fullName || user.username || 'User',
    username: user.username,
  } : null;

  // Show loading only briefly, then render anyway
  if (!isLoaded) {
    console.log('[App] Clerk not loaded yet...');
    // Don't block rendering - show landing page anyway
  }

  console.log('[App] Rendering page:', page, 'isLoaded:', isLoaded, 'isSignedIn:', isSignedIn);

  return (
    <div className="app">
      <AuthSync />
      <Suspense fallback={<div className="loading-screen">Loading...</div>}>
        {page === 'landing' && <LandingPage onNavigate={handleNavigate} />}
        {page === 'map' && (
          <MapPage
            loadedRoute={loadedRoute}
            onNavigate={handleNavigate}
            onClearRoute={() => setLoadedRoute(null)}
            user={appUser}
          />
        )}
        {page === 'history' && (
          <History
            onLoadRoute={handleLoadRoute}
            onNavigate={handleNavigate}
            user={appUser}
          />
        )}
      </Suspense>
    </div>
  );
}
