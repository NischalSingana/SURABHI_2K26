"use client";

import { motion, useScroll, useTransform } from "framer-motion";

const RIVER_PATH = "M 50 0 C 20 40, 80 70, 50 100 C 20 130, 80 160, 50 200";

interface ScheduleFlowLineProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

function ScheduleFlowLine({ containerRef }: ScheduleFlowLineProps) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Flow line draws along with scroll - 0 at top, 1 at bottom
  const lineProgress = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 0.2, 1, 1]);
  const glowIntensity = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [0.2, 0.5, 0.8, 0.6, 0.3]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <svg
        className="absolute left-1/2 top-0 -translate-x-1/2 w-full h-full min-h-[120%] opacity-100"
        preserveAspectRatio="none"
        viewBox="0 0 100 200"
      >
        <defs>
          {/* Reddish gradient - matches website theme */}
          <linearGradient id="riverGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7f1d1d" stopOpacity="0.5" />
            <stop offset="30%" stopColor="#b91c1c" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#dc2626" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#b91c1c" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="riverShimmer" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fca5a5" stopOpacity="0" />
            <stop offset="45%" stopColor="#fca5a5" stopOpacity="0.5" />
            <stop offset="55%" stopColor="#fef2f2" stopOpacity="0.8" />
            <stop offset="65%" stopColor="#fca5a5" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#fca5a5" stopOpacity="0" />
          </linearGradient>
          <filter id="riverGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="riverGlowStrong" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0.6 0 0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.5 0" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
            </feMerge>
          </filter>
        </defs>

        {/* Track - faint path always visible */}
        <path
          d={RIVER_PATH}
          fill="none"
          stroke="rgba(127,29,29,0.3)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 6"
        />

        {/* Outer glow - scroll-reactive */}
        <motion.path
          d={RIVER_PATH}
          fill="none"
          stroke="url(#riverGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          filter="url(#riverGlowStrong)"
          style={{ opacity: glowIntensity, pathLength: lineProgress }}
        />

        {/* Main flow path - draws along scroll */}
        <motion.path
          d={RIVER_PATH}
          fill="none"
          stroke="url(#riverGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#riverGlow)"
          style={{
            pathLength: lineProgress,
            opacity: 0.95,
          }}
        />

        {/* Shimmer overlay - follows scroll */}
        <motion.path
          d={RIVER_PATH}
          fill="none"
          stroke="url(#riverShimmer)"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{
            pathLength: lineProgress,
            opacity: 0.6,
          }}
        />
      </svg>
    </div>
  );
}

export default ScheduleFlowLine;
