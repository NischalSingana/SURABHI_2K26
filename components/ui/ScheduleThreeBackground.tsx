"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function ScheduleParticles() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const count = 100;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = (Math.random() - 0.5) * 20;
      positions[i + 2] = (Math.random() - 0.5) * 8;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.04) * 0.08;
    }
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.2}
        color="#dc2626"
        depthWrite={false}
      />
    </points>
  );
}

export default function ScheduleThreeBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(id);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ isolation: "isolate" }}>
      <div className="absolute inset-0 w-full h-full min-h-[600px]">
        <Canvas
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
          camera={{ position: [0, 0, 6], fov: 55 }}
        >
          <color attach="background" args={["transparent"]} />
          <ScheduleParticles />
        </Canvas>
      </div>
    </div>
  );
}
