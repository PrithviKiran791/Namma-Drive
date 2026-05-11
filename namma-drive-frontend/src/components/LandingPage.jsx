import { Suspense, lazy } from 'react';
import '../styles/LandingPage.css';

// Lazy load the entire Three.js scene to keep main bundle fast
const GlobeScene = lazy(() => import('./GlobeScene'));

export default function LandingPage({ onNavigate }) {
  return (
    <div className="landing">
      <div className="landing-canvas">
        <Suspense fallback={<div className="globe-fallback" />}>
          <GlobeScene />
        </Suspense>
      </div>

      <nav className="landing-nav">
        <div className="landing-logo">
          <span className="logo-dot" />
          Namma Drive
        </div>
        <div className="nav-links">
          <span>Karnataka</span>
          <span onClick={() => onNavigate('login')}>Log in</span>
          <span onClick={() => onNavigate('history')}>History</span>
          <span onClick={() => onNavigate('map')}>Open map</span>
        </div>
      </nav>

      <div className="landing-content">
        <div className="landing-badge">
          <span className="badge-dot" />
          Karnataka Route Planner
        </div>
        <h1>
          Roads of<br />
          <span>Karnataka</span>,<br />
          mapped for you
        </h1>
        <p>
          Calculate routes, find fuel stops, and save
          your favourite drives across the state.
        </p>
        <div className="landing-cta">
          <button className="btn-start" onClick={() => onNavigate('map')}>
            Start routing →
          </button>
          <button className="btn-ghost" onClick={() => onNavigate('history')}>
            View history
          </button>
        </div>
        <div className="landing-stats">
          <div><strong>20+</strong><span>fuel stops</span></div>
          <div><strong>10</strong><span>major cities</span></div>
          <div><strong>Free</strong><span>to use</span></div>
        </div>
      </div>
    </div>
  );
}