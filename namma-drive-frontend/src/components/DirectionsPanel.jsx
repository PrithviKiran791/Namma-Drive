import { useEffect, useMemo, useRef, useState } from 'react';
import './DirectionsPanel.css';

function formatMeters(m) {
  const n = Number(m || 0);
  if (!Number.isFinite(n)) return '';
  if (n < 1000) return `${Math.round(n)} m`;
  return `${(n / 1000).toFixed(1)} km`;
}

function formatSeconds(s) {
  const n = Math.round(Number(s || 0));
  if (!Number.isFinite(n)) return '';
  const totalM = Math.round(n / 60);
  const h = Math.floor(totalM / 60);
  const m = totalM % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function stripHtml(s = '') {
  return String(s).replace(/<[^>]*>/g, '').trim();
}

function ManeuverIcon({ type = '', modifier = '' }) {
  const key = `${type}:${modifier}`.toLowerCase();
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none' };
  const stroke = { stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

  if (key.includes('uturn')) {
    return (
      <svg {...common}>
        <path {...stroke} d="M7 7h6a4 4 0 0 1 0 8H8" />
        <path {...stroke} d="M8 11l-4 4 4 4" />
      </svg>
    );
  }
  if (key.includes('roundabout')) {
    return (
      <svg {...common}>
        <path {...stroke} d="M12 3a9 9 0 1 0 9 9" />
        <path {...stroke} d="M21 12l-4-2 2 4" />
      </svg>
    );
  }
  if (key.includes('left') && !key.includes('slight')) {
    return (
      <svg {...common}>
        <path {...stroke} d="M14 6l-6 6 6 6" />
        <path {...stroke} d="M8 12h12" />
      </svg>
    );
  }
  if (key.includes('right') && !key.includes('slight')) {
    return (
      <svg {...common}>
        <path {...stroke} d="M10 6l6 6-6 6" />
        <path {...stroke} d="M16 12H4" />
      </svg>
    );
  }
  if (key.includes('slight') && key.includes('left')) {
    return (
      <svg {...common}>
        <path {...stroke} d="M15 6l-5 5" />
        <path {...stroke} d="M10 11l-1-4-4 1" />
        <path {...stroke} d="M10 11l9 9" />
      </svg>
    );
  }
  if (key.includes('slight') && key.includes('right')) {
    return (
      <svg {...common}>
        <path {...stroke} d="M9 6l5 5" />
        <path {...stroke} d="M14 11l1-4 4 1" />
        <path {...stroke} d="M14 11L5 20" />
      </svg>
    );
  }
  if (key.includes('arrive')) {
    return (
      <svg {...common}>
        <path {...stroke} d="M12 22s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12Z" />
        <path {...stroke} d="M12 10.5h.01" />
      </svg>
    );
  }

  // straight/default
  return (
    <svg {...common}>
      <path {...stroke} d="M12 3v18" />
      <path {...stroke} d="M8 7l4-4 4 4" />
    </svg>
  );
}

export default function DirectionsPanel({
  open,
  onClose,
  summary,
  steps = [],
  activeIndex,
  onSelectStep,
  onSpeakStep,
}) {
  const [muted, setMuted] = useState(true);
  const [sheetY, setSheetY] = useState(0); // mobile drag offset
  const draggingRef = useRef(false);
  const startRef = useRef({ y: 0, sheetY: 0 });

  const isMobile = useMemo(() => window.matchMedia?.('(max-width: 768px)')?.matches ?? false, []);

  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!open) return;
    setSheetY(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (muted) return;
    if (!canSpeak) return;
    const step = steps[activeIndex];
    if (!step) return;
    const text = stripHtml(step.text || step.instruction || '');
    if (!text) return;
    onSpeakStep?.(text);
  }, [activeIndex, muted, open, canSpeak, steps, onSpeakStep]);

  const handlePointerDown = (e) => {
    if (!isMobile) return;
    draggingRef.current = true;
    startRef.current = { y: e.clientY, sheetY };
  };
  const handlePointerMove = (e) => {
    if (!isMobile) return;
    if (!draggingRef.current) return;
    const dy = e.clientY - startRef.current.y;
    setSheetY(Math.max(0, startRef.current.sheetY + dy));
  };
  const handlePointerUp = () => {
    if (!isMobile) return;
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (sheetY > 160) onClose?.();
    else setSheetY(0);
  };

  if (!open) return null;

  return (
    <div className="dir-root" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      <div className="dir-backdrop" onClick={onClose} />

      <aside
        className={`dir-panel ${isMobile ? 'mobile' : 'desktop'}`}
        style={isMobile ? { transform: `translateY(${sheetY}px)` } : undefined}
        aria-label="Directions panel"
      >
        <div className="dir-handle" onPointerDown={handlePointerDown}>
          <span className="dir-grab" />
        </div>

        <div className="dir-header">
          <div className="dir-title">
            <span className="dir-badge">NAMMA NAVIGATOR</span>
            <button className="dir-close" onClick={onClose} aria-label="Close directions">✕</button>
          </div>

          <div className="dir-summary">
            <div className="dir-sum-item">
              <span className="k">Distance</span>
              <span className="v">{formatMeters(summary?.totalDistance)}</span>
            </div>
            <div className="dir-sum-item">
              <span className="k">ETA</span>
              <span className="v">{formatSeconds(summary?.totalTime)}</span>
            </div>

            <div className="dir-actions">
              <button
                className={`dir-mute ${muted ? '' : 'on'}`}
                onClick={() => setMuted(m => !m)}
                title={muted ? 'Unmute voice' : 'Mute voice'}
              >
                {muted ? 'Voice Off' : 'Voice On'}
              </button>

              <button
                className="dir-read"
                disabled={!canSpeak || !steps?.[activeIndex]}
                onClick={() => {
                  const step = steps?.[activeIndex];
                  const text = stripHtml(step?.text || step?.instruction || '');
                  if (text) onSpeakStep?.(text);
                }}
                title={canSpeak ? 'Read the current step aloud' : 'Speech not supported'}
              >
                Read Aloud
              </button>
            </div>
          </div>
        </div>

        <div className="dir-list" role="list">
          {steps.map((s, idx) => {
            const isActive = idx === activeIndex;
            const label = stripHtml(s.text || s.instruction || '');
            return (
              <button
                key={`${idx}-${label}`}
                className={`dir-step ${isActive ? 'active' : ''}`}
                onClick={() => onSelectStep?.(idx)}
                role="listitem"
              >
                <span className="dir-ic">
                  <ManeuverIcon type={s.type} modifier={s.modifier} />
                </span>
                <span className="dir-main">
                  <span className="dir-text">{label || 'Continue'}</span>
                  <span className="dir-meta">{formatMeters(s.distance)} </span>
                </span>
                <span className="dir-next">›</span>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

