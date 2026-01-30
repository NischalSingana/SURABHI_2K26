"use client";

import { ReactLenis } from "lenis/react";
import { ReactNode, useEffect, useState } from "react";

interface LenisProviderProps {
  children: ReactNode;
}

export default function LenisProvider({ children }: LenisProviderProps) {
  const [isTrackpad, setIsTrackpad] = useState(false);

  useEffect(() => {
    // Detect trackpad vs mouse wheel
    // Trackpads send wheel events with deltaMode === 0 and smaller, more frequent deltas
    let lastWheelTime = 0;
    let trackpadEventCount = 0;
    
    const detectTrackpad = (e: WheelEvent) => {
      const now = Date.now();
      const timeDelta = now - lastWheelTime;
      lastWheelTime = now;

      // Trackpad characteristics:
      // - deltaMode is usually 0 (pixels)
      // - Smaller delta values (< 50)
      // - More frequent events (< 50ms apart)
      // - Can have fractional deltas
      const isLikelyTrackpad = 
        e.deltaMode === 0 && 
        Math.abs(e.deltaY) < 50 && 
        (timeDelta < 50 || Math.abs(e.deltaY) % 1 !== 0);

      if (isLikelyTrackpad) {
        trackpadEventCount++;
        if (trackpadEventCount >= 2) {
          setIsTrackpad(true);
        }
      } else if (Math.abs(e.deltaY) > 100 || e.deltaMode !== 0) {
        // Mouse wheel characteristics
        trackpadEventCount = 0;
        setIsTrackpad(false);
      }
    };

    window.addEventListener('wheel', detectTrackpad, { passive: true });
    return () => window.removeEventListener('wheel', detectTrackpad);
  }, []);

  return (
    <ReactLenis
      root
      options={{
        lerp: isTrackpad ? 0.02 : 0.1, // Much faster lerp for trackpad (more responsive)
        duration: isTrackpad ? 0.5 : 1.2, // Much shorter duration for trackpad
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: isTrackpad ? 0.6 : 1.5, // Lower multiplier for trackpad
        touchMultiplier: 2,
        syncTouch: false, // Native touch scroll (no smooth on touch)
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        infinite: false,
      }}
    >
      {children}
    </ReactLenis>
  );
}
