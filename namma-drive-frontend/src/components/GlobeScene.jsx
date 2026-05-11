import { Canvas } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, OrbitControls } from '@react-three/drei';

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

export default function GlobeScene() {
  return (
    <Canvas camera={{ position: [0, 0, 4] }}>
      <Globe />
    </Canvas>
  );
}
