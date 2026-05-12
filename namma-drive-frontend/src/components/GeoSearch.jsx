import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { geocodePlace } from '../services/geocoding';
import './GeoSearch.css';

const GeoSearch = forwardRef(function GeoSearch(
  { placeholder = 'Search destination...', onSelect, defaultValue = '' },
  ref
) {
  const [query,     setQuery]     = useState(defaultValue);
  const [results,   setResults]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [open,      setOpen]      = useState(false);
  const debounceRef = useRef(null);
  const inputRef    = useRef(null);
  const wrapRef     = useRef(null);
  const [menuPos, setMenuPos] = useState(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => {
      setQuery('');
      setResults([]);
      setOpen(false);
      inputRef.current?.focus();
    },
    setValue: (val = '') => {
      setQuery(val);
      if (!val) inputRef.current?.focus();
    },
  }), []);

  // Auto-focus when mounted with empty query
  useEffect(() => {
    if (!defaultValue) inputRef.current?.focus();
  }, []);

  // Close dropdown on outside click (include portaled menu)
  useEffect(() => {
    const handler = (e) => {
      const inWrap = wrapRef.current?.contains(e.target);
      const inPortal = e.target?.closest?.('.geo-portal-dropdown');
      if (!inWrap && !inPortal) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useLayoutEffect(() => {
    const showMenu = open && (results.length > 0 || (!loading && query.trim().length > 2));
    if (!showMenu || !wrapRef.current) {
      setMenuPos(null);
      return undefined;
    }
    const update = () => {
      const r = wrapRef.current.getBoundingClientRect();
      setMenuPos({ left: r.left, top: r.bottom + 6, width: r.width });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, results.length, loading, query]);

  const search = useCallback(async (q) => {
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await geocodePlace(q);
      setResults(res.slice(0, 5));
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  };

  const handleSelect = (item) => {
    setQuery(item.shortName);
    setOpen(false);
    setResults([]);
    onSelect(item);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="geo-search" ref={wrapRef}>
      <div className={`geo-input-wrap ${open ? 'active' : ''}`}>
        <span className="geo-icon" style={{ fontWeight: 700, color: '#ce1126' }}>·</span>
        <input
          ref={inputRef}
          className="geo-input"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {loading && <span className="geo-spinner" style={{ fontSize: 10, fontWeight: 700 }}>...</span>}
        {query && !loading && (
          <button className="geo-clear" onClick={handleClear}>✕</button>
        )}
      </div>

      {menuPos && open && results.length > 0 && createPortal(
        <ul
          className="geo-results geo-portal-dropdown"
          style={{
            position: 'fixed',
            left: menuPos.left,
            top: menuPos.top,
            width: menuPos.width,
            zIndex: 10050,
          }}
        >
          {results.map((item, i) => (
            <li
              key={i}
              className="geo-result-item"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(item);
              }}
            >
              <span className="geo-result-icon" style={{ color: '#ce1126', fontWeight: 700 }}>›</span>
              <div className="geo-result-text">
                <span className="geo-result-name">{item.shortName}</span>
                <span className="geo-result-full">{item.name}</span>
              </div>
            </li>
          ))}
        </ul>,
        document.body
      )}

      {menuPos && open && !loading && results.length === 0 && query.trim().length > 2 && createPortal(
        <div
          className="geo-no-results geo-portal-dropdown"
          style={{
            position: 'fixed',
            left: menuPos.left,
            top: menuPos.top,
            width: menuPos.width,
            zIndex: 10050,
          }}
        >
          No places found in Karnataka
        </div>,
        document.body
      )}
    </div>
  );
});

export default GeoSearch;
