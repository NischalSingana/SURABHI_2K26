"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// Desktop path
const RIVER_PATH =
  "M 50 0 C 12 35, 88 55, 50 90 C 12 125, 88 145, 50 180 C 12 215, 88 235, 50 270";

// Mobile: more pronounced S-curve (left-right-left sweep)
const MOBILE_RIVER_PATH =
  "M 50 0 C 8 40, 92 70, 50 110 C 8 150, 92 180, 50 220 C 8 260, 92 290, 50 330";

interface ScheduleFlowLineProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

function ScheduleFlowLine({ containerRef }: ScheduleFlowLineProps) {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileMq = window.matchMedia("(min-width: 768px)");
    setIsReducedMotion(mq.matches);
    setIsMobile(!mobileMq.matches);
    const onReduce = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    const onMobile = (e: MediaQueryListEvent) => setIsMobile(!e.matches);
    mq.addEventListener("change", onReduce);
    mobileMq.addEventListener("change", onMobile);
    return () => {
      mq.removeEventListener("change", onReduce);
      mobileMq.removeEventListener("change", onMobile);
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    // Animate as section passes through viewport: 0 when entering, 1 when fully passed
    offset: ["start end", "end start"],
  });

  // Line draws from top (0) to bottom (1) as section scrolls through viewport
  const lineProgress = useTransform(scrollYProgress, [0, 0.02, 0.98, 1], [0, 0, 1, 1]);

  // Mobile: scroll-driven line (like PC) + curvy path. Reduced-motion: static path only.
  if (isMobile || isReducedMotion) {
    return (
      <div
        className="absolute inset-0 pointer-events-none overflow-visible"
        style={!isReducedMotion ? { willChange: "auto", transform: "translateZ(0)" } : undefined}
        aria-hidden
      >
        <svg
          className="absolute left-1/2 top-0 -translate-x-1/2 w-[60%] min-w-[120px] sm:w-[50%] md:w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 330"
        >
          <defs>
            <linearGradient id="riverGradientMobile" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5c1010" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#991b1b" stopOpacity="1" />
              <stop offset="100%" stopColor="#5c1010" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {isReducedMotion ? (
            <path
              d={MOBILE_RIVER_PATH}
              fill="none"
              stroke="url(#riverGradientMobile)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <>
              <path
                d={MOBILE_RIVER_PATH}
                fill="none"
                stroke="rgba(91,27,27,0.6)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="4 6"
              />
              <motion.path
                d={MOBILE_RIVER_PATH}
                fill="none"
                stroke="url(#riverGradientMobile)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pathLength: lineProgress, opacity: 1 }}
              />
            </>
          )}
        </svg>
      </div>
    );
  }

  // Desktop only: light scroll-driven animation, no blur filters
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ willChange: "auto", transform: "translateZ(0)" }}
      aria-hidden
    >
        <svg
        className="absolute left-1/2 top-0 -translate-x-1/2 w-full h-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 270"
      >
        <defs>
          <linearGradient id="riverGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5c1010" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#991b1b" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#5c1010" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <path
          d={RIVER_PATH}
          fill="none"
          stroke="rgba(91,27,27,0.4)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 6"
        />
        <motion.path
          d={RIVER_PATH}
          fill="none"
          stroke="url(#riverGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ pathLength: lineProgress, opacity: 0.95 }}
        />
      </svg>
    </div>
  );
}

export default ScheduleFlowLine;
