import React from 'react';
import './TransportSwitcher.css';

export default function TransportSwitcher({ mode, onChange }) {
  const modes = [
    { id: 'car', label: 'Car', icon: '🚗' },
    { id: 'bike', label: 'Bike', icon: '🚴' },
    { id: 'transit', label: 'Transit', icon: '🚌' }
  ];

  return (
    <div className="transport-switcher">
      {modes.map(m => (
        <button
          key={m.id}
          className={`mode-btn ${mode === m.id ? 'active' : ''}`}
          onClick={() => onChange(m.id)}
        >
          <span className="mode-icon">{m.icon}</span>
          <span className="mode-label">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
