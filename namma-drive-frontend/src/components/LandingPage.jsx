import { Suspense, lazy } from 'react';
import { SignInButton, useUser } from '@clerk/clerk-react';
import '../styles/LandingPage.css';

const GlobeScene = lazy(() => import('./GlobeScene'));

// Placeholder image URL - replace with actual image path once added
const karnatakaMapImg = 'data:image/svg+xml,%3Csvg width="600" height="800" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="600" height="800" fill="%231a1a1a"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="24" fill="%23f9d616" text-anchor="middle" dominant-baseline="middle"%3EKarnataka Map%3C/text%3E%3C/svg%3E';

export default function LandingPage({ onNavigate }) {
  const { isSignedIn } = useUser();

  return (
    <div className="landing">

      {/* Three.js background globe */}
      <div className="landing-canvas">
        <Suspense fallback={<div className="globe-fallback" />}>
          <GlobeScene />
        </Suspense>
      </div>

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <span className="logo-dot" />
          Namma Drive
        </div>
        <div className="nav-links">
          <span>Karnataka</span>
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <span style={{ cursor: 'pointer' }}>Log in</span>
            </SignInButton>
          ) : (
            <span onClick={() => onNavigate('map')}>Dashboard</span>
          )}
          <span onClick={() => onNavigate('history')}>History</span>
          <span onClick={() => onNavigate('map')}>Open map</span>
        </div>
      </nav>

      {/* Hero Content with Map */}
      <div className="landing-hero">
        {/* Left side - Text content */}
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
            <button type="button" className="btn-start" onClick={() => onNavigate('map')}>
              Start routing →
            </button>
            <button type="button" className="btn-ghost" onClick={() => onNavigate('history')}>
              View history
            </button>
          </div>

          <div className="landing-stats">
            <div><strong>70+</strong><span>destinations</span></div>
            <div><strong>30+</strong><span>hotels</span></div>
            <div><strong>Free</strong><span>to use</span></div>
          </div>
        </div>

        {/* Right side - Karnataka Map */}
        <div className="landing-map">
          <img 
            src={karnatakaMapImg} 
            alt="Karnataka Map with cities and regions" 
            className="karnataka-map-image"
          />
        </div>
      </div>

      {/* Karnataka flag colour accent bar */}
      <div className="landing-bottom-bar" />
    </div>
  );
}
