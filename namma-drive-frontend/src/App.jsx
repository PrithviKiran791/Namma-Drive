import { useState } from 'react';
import LandingPage from './components/LandingPage';
import MapPage from './styles/MapPage';
import History from './components/History';
import './App.css';

export default function App() {
  const [page, setPage] = useState('landing');
  const [loadedRoute, setLoadedRoute] = useState(null);

  const handleLoadRoute = (route) => {
    setLoadedRoute(route);
    setPage('map');
  };

  return (
    <div className="app">
      {page === 'landing' && <LandingPage onNavigate={setPage} />}
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
    </div>
  );
}
