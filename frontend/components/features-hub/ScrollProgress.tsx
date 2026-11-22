"use client";

/**
 * /frontend/components/features-hub/ScrollProgress.tsx
 *
 * 2px accent bar fixed under the navbar, scaled by page scroll.
 */

import { motion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-sky-400 z-50 origin-left pointer-events-none shadow-[0_0_8px_rgba(56,189,248,0.6)]"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
}
