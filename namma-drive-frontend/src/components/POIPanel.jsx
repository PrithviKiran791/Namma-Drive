import { useState, useEffect } from 'react';
import { poiAPI } from '../api';
import { weatherEmoji } from '../services/weather';
import './POIPanel.css';

const CATEGORY_ICONS = { Trek: '🏔', Temple: '🛕', Picnic: '🌳', Hotel: '🏨' };

export default function POIPanel({ onRouteToPOI }) {
  const [pois,     setPois]     = useState([]);
  const [category, setCategory] = useState('All');
  const [loading,  setLoading]  = useState(false);

  const categories = ['All', 'Hotel', 'Trek', 'Temple', 'Picnic'];

  useEffect(() => { fetchPOIs(); }, [category]);

  const fetchPOIs = async () => {
    setLoading(true);
    try {
      const res = await poiAPI.getAll(category === 'All' ? undefined : category);
      setPois(res.data.pois);
    } catch (err) {
      console.error('Error fetching POIs', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="poi-panel">
      <div className="poi-categories">
        {categories.map(cat => (
          <button
            key={cat}
            className={`cat-btn ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {CATEGORY_ICONS[cat] ?? '🗺'} {cat}
          </button>
        ))}
      </div>

      <div className="poi-list">
        {loading ? (
          <div className="poi-loading">🌀 Finding spots...</div>
        ) : (
          pois.map(poi => (
            <div key={poi._id} className="poi-card">
              <div className="poi-info">
                <div className="poi-header">
                  <span className="poi-name">
                    {CATEGORY_ICONS[poi.category] ?? '📍'} {poi.name}
                  </span>
                  <span className="poi-rating">⭐ {poi.rating}</span>
                </div>
                <p className="poi-desc">{poi.description}</p>
              </div>
              <button
                className="poi-route-btn"
                onClick={() => onRouteToPOI(poi.coords, poi.name, poi.category)}
              >
                Route →
              </button>
            </div>
          ))
        )}
        {!loading && pois.length === 0 && (
          <p className="poi-loading">No spots found in this category.</p>
        )}
      </div>
    </div>
  );
}
