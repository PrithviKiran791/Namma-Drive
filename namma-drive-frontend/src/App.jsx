import { useState, Suspense, lazy } from 'react';
import LandingPage from './components/LandingPage';
import AuthSync from './components/AuthSync';
import './App.css';

const MapPage = lazy(() => import('./styles/MapPage'));
const History = lazy(() => import('./components/History'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

export default function App() {
  const [page, setPage] = useState('landing');
  const [loadedRoute, setLoadedRoute] = useState(null);

  const handleLoadRoute = (route) => {
    setLoadedRoute(route);
    setPage('map');
  };

  return (
    <div className="app">
      <AuthSync />
      <Suspense fallback={<div className="loading-screen">Loading...</div>}>
        {page === 'landing' && <LandingPage onNavigate={setPage} />}
        {page === 'login' && <LoginPage onNavigate={setPage} />}
        {page === 'map' && (
          <MapPage
            loadedRoute={loadedRoute}
            onNavigate={setPage}
            onClearRoute={() => setLoadedRoute(null)}
          />
        )}
        {page === 'history' && (
          <History onLoadRoute={handleLoadRoute} onNavigate={setPage} />
        )}
      </Suspense>
    </div>
  );
}
