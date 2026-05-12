import { Canvas } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, OrbitControls } from '@react-three/drei';

function Globe() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]}  intensity={1.0} color="#f9d616" />
      <pointLight position={[-5, -3, 3]} intensity={0.6} color="#ce1126" />
      <Sphere args={[1, 100, 200]} scale={2.4}>
        <MeshDistortMaterial
          color="#ce1126"
          speed={1.6}
          distort={0.38}
          roughness={0.3}
          metalness={0.1}
          transparent
          opacity={0.18}
        />
      </Sphere>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.35}
      />
    </>
  );
}

export default function GlobeScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4] }}
      style={{ background: 'transparent' }}
    >
      <Globe />
    </Canvas>
  );
}
