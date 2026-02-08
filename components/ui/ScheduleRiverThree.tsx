"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const MOUSE_SMOOTH = 0.05;

// Catmull-Rom spline for smooth S-curve (4 segments, 7 points)
function getSCurvePoints(t: number): THREE.Vector3 {
  const s = Math.max(0, Math.min(1, t)) * 4;
  const segment = Math.min(Math.floor(s), 3);
  const u = s - Math.floor(s);
  const u2 = u * u;
  const u3 = u2 * u;

  const pts: [number, number][] = [
    [0.5, 0],
    [0.2, 0.2],
    [0.8, 0.4],
    [0.5, 0.5],
    [0.2, 0.65],
    [0.8, 0.85],
    [0.5, 1],
  ];
  const i = Math.min(segment, pts.length - 4);
  const p0 = pts[i];
  const p1 = pts[i + 1];
  const p2 = pts[i + 2];
  const p3 = pts[i + 3];

  // Catmull-Rom interpolation
  const x =
    0.5 *
    (2 * p1[0] +
      (-p0[0] + p2[0]) * u +
      (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 +
      (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3);
  const y =
    0.5 *
    (2 * p1[1] +
      (-p0[1] + p2[1]) * u +
      (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 +
      (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3);

  // Map to viewport: center x, full height, slight z depth
  return new THREE.Vector3((x - 0.5) * 12, (y - 0.5) * 12, (Math.random() - 0.5) * 0.5);
}

function RiverParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const mouseOffset = useRef(new THREE.Vector2(0, 0));
  const mouseTarget = useRef(new THREE.Vector2(0, 0));
  const count = 50;
  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const p = getSCurvePoints(t);
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z;
      spd[i] = 0.15 + Math.random() * 0.2;
    }
    return [pos, spd];
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseTarget.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseTarget.current.y = (1 - e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    mouseOffset.current.lerp(mouseTarget.current, MOUSE_SMOOTH);
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;
    const mx = mouseOffset.current.x * 0.8;
    const my = mouseOffset.current.y * 0.6;
    for (let i = 0; i < count; i++) {
      const t = ((i / count) * 0.5 + time * speeds[i] * 0.12) % 1;
      const p = getSCurvePoints(t);
      pos[i * 3] = p.x + mx * (0.5 - Math.abs(p.y / 12));
      pos[i * 3 + 1] = p.y + my * (0.5 - Math.abs(p.y / 12));
      pos[i * 3 + 2] = p.z;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial
        size={0.12}
        sizeAttenuation
        transparent
        opacity={0.6}
        color="#dc2626"
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function RiverTrailParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 30;
  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const p = getSCurvePoints(t);
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z - 0.2;
      spd[i] = 0.1 + Math.random() * 0.15;
    }
    return [pos, spd];
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const t = ((i / count) * 0.3 + time * speeds[i] * 0.08) % 1;
      const p = getSCurvePoints(t);
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z - 0.2;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial
        size={0.2}
        sizeAttenuation
        transparent
        opacity={0.25}
        color="#fca5a5"
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

interface ScheduleRiverThreeProps {
  isInView: boolean;
}

export default function ScheduleRiverThree({ isInView }: ScheduleRiverThreeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(id);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ isolation: "isolate" }}
      data-lenis-prevent
    >
      <div className="absolute inset-0 w-full h-full min-h-[600px]">
        <Canvas
          dpr={1}
          frameloop={isInView ? "always" : "never"}
          gl={{
            alpha: true,
            antialias: false,
            powerPreference: "low-power",
            stencil: false,
            depth: false,
          }}
          camera={{ position: [0, 0, 8], fov: 50 }}
        >
          <color attach="background" args={["transparent"]} />
          <RiverTrailParticles />
          <RiverParticles />
        </Canvas>
      </div>
    </div>
  );
}
