import { METRO_HUBS } from '../data/metroHubs';
import './MetroLaunchpad.css';

export default function MetroLaunchpad({ activeHub, onSelectHub }) {
  return (
    <div className="metro-launchpad">
      <p className="metro-label">📍 Quick Start from</p>
      <div className="metro-scroll">
        {METRO_HUBS.map(hub => (
          <button
            key={hub.id}
            className={`metro-card ${activeHub?.id === hub.id ? 'active' : ''}`}
            onClick={() => onSelectHub(hub)}
            title={hub.tagline}
          >
            <span className="metro-emoji">{hub.emoji}</span>
            <span className="metro-name">{hub.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
