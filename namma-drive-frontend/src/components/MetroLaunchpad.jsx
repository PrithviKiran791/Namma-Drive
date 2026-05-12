import { METRO_HUBS } from '../data/metroHubs';
import './MetroLaunchpad.css';

export default function MetroLaunchpad({ activeHub, onSelectHub }) {
  return (
    <div className="metro-launchpad">
      <p className="metro-label">Quick Start from</p>
      <div className="metro-scroll">
        {METRO_HUBS.map(hub => (
          <button
            key={hub.id}
            className={`metro-card ${activeHub?.id === hub.id ? 'active' : ''}`}
            onClick={() => onSelectHub(hub)}
            title={hub.tagline}
          >
            <img 
              src={hub.image} 
              alt={hub.name} 
              style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: '50%', border: '2px solid #f9d616' }} 
            />
            <span className="metro-name">{hub.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
