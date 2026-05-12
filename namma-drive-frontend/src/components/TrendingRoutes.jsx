import './TrendingRoutes.css';

export default function TrendingRoutes({ hub, onSelectDestination }) {
  if (!hub?.trending?.length) return null;

  return (
    <div className="trending-routes">
      <p className="tr-label">Trending from {hub.name}</p>
      <div className="tr-list">
        {hub.trending.map((route, i) => (
          <button
            key={i}
            className="tr-item"
            onClick={() => onSelectDestination(route)}
          >
            <img 
              src={route.image} 
              alt={route.name} 
              style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 6 }} 
            />
            <div className="tr-info">
              <span className="tr-name">{route.name}</span>
              <span className="tr-dist">{route.dist}</span>
            </div>
            <span className="tr-arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
