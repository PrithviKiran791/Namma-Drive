import { Canvas } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, OrbitControls } from '@react-three/drei';
import '../styles/LandingPage.css';

function Globe() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1.2} />
      <Sphere args={[1, 100, 200]} scale={2.2}>
        <MeshDistortMaterial
          color="#ce1126"
          speed={1.8}
          distort={0.35}
          roughness={0.4}
          transparent
          opacity={0.22}
        />
      </Sphere>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.4}
      />
    </>
  );
}

export default function LandingPage({ onNavigate }) {
  return (
    <div className="landing">
      <div className="landing-canvas">
        <Canvas camera={{ position: [0, 0, 4] }}>
          <Globe />
        </Canvas>
      </div>

      <nav className="landing-nav">
        <div className="landing-logo">
          <span className="logo-dot" />
          Namma Drive
        </div>
        <div className="nav-links">
          <span>Karnataka</span>
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