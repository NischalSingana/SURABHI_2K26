"use client";

import { ReactLenis } from "lenis/react";
import { ReactNode } from "react";

interface LenisProviderProps {
  children: ReactNode;
}

export default function LenisProvider({ children }: LenisProviderProps) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1, // Lower values create more lag
        duration: 1.2, // Duration of scroll animation
        orientation: "vertical", // Scroll direction
        gestureOrientation: "vertical", // Gesture direction
        smoothWheel: true, // Enable smooth scrolling for mouse wheel
        wheelMultiplier: 1, // Wheel speed multiplier
        touchMultiplier: 2, // Touch speed multiplier
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom easing function
      }}
    >
      {children}
    </ReactLenis>
  );
}
