/**
 * /frontend/lib/motion.ts
 *
 * Shared Framer Motion constants, easings, and animation variants.
 * Strictly adheres to ALOA V3 motion rules:
 * - EASE = [0.22, 1, 0.36, 1]
 * - Durations 0.3–0.9s max
 * - Animate only transform and opacity
 */

import { Variants } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  fast: 0.3,
  normal: 0.5,
  smooth: 0.7,
  long: 0.85,
} as const;

/** Standard fade-in with slight vertical translation */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASE,
    },
  },
};

/** Pure opacity fade (safe for reduced motion) */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: DURATION.fast,
      ease: EASE,
    },
  },
};

/** Horizontal slide-in */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: DURATION.smooth,
      ease: EASE,
    },
  },
};

/** Container variant to stagger children animations */
export const staggerContainer = (stagger = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren,
    },
  },
});
