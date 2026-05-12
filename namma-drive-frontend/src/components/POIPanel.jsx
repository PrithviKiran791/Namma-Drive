import { useState, useEffect } from 'react';
import { poiAPI } from '../api';
import { weatherEmoji } from '../services/weather';
import './POIPanel.css';

const CATEGORY_IMAGES = { 
  All: '/car_icon.jpg',
  Trek: '/scenic.png', 
  Temple: '/photo4jpg.jpg', 
  Picnic: '/cycle_icon.png', 
  Hotel: '/bangalore.jpg' 
};

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
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <img 
              src={CATEGORY_IMAGES[cat] || '/scenic.png'} 
              alt={cat} 
              style={{ width: 14, height: 14, objectFit: 'cover', borderRadius: '50%' }} 
            />
            {cat}
          </button>
        ))}
      </div>

      <div className="poi-list">
        {loading ? (
          <div className="poi-loading">Finding spots...</div>
        ) : (
          pois.map(poi => (
            <div key={poi._id} className="poi-card">
              <div className="poi-info">
                <div className="poi-header">
                  <span className="poi-name" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <img 
                      src={CATEGORY_IMAGES[poi.category] || '/scenic.png'} 
                      alt={poi.category} 
                      style={{ width: 16, height: 16, objectFit: 'cover', borderRadius: '50%' }} 
                    />
                    {poi.name}
                  </span>
                  <span className="poi-rating">★ {poi.rating}</span>
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
