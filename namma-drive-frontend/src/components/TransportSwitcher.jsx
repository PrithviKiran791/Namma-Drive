import React from 'react';
import './TransportSwitcher.css';

export default function TransportSwitcher({ mode, onChange }) {
  const modes = [
    { id: 'car', label: 'Car', icon: '/car_icon.jpg' },
    { id: 'bike', label: 'Bike', icon: '/cycle_icon.png' },
    { id: 'transit', label: 'Transit', icon: '/bus_icon.png' },
    { id: 'scenic', label: 'Scenic', icon: '/scenic.png' }
  ];

  return (
    <div className="transport-switcher">
      {modes.map(m => (
        <button
          key={m.id}
          className={`mode-btn ${mode === m.id ? 'active' : ''}`}
          onClick={() => onChange(m.id)}
        >
          <img 
            src={m.icon} 
            alt={m.label} 
            style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4 }} 
          />
          <span className="mode-label">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
