/**
 * /frontend/lib/animations.ts
 *
 * Shared Framer Motion variants and timing constants used across all 10
 * feature pages and the landing page. Import from here — do NOT define
 * one-off variants inline in components, so all pages stay visually consistent.
 */

import { Variants } from "framer-motion";

// ── Timing ─────────────────────────────────────────────────────────────────

export const DURATION = {
  fast: 0.3,
  base: 0.5,
  slow: 0.7,
} as const;

/** Cubic-bezier easing functions matching the landing page aesthetic. */
export const EASE = {
  smooth: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  out: [0, 0, 0.2, 1] as [number, number, number, number],
  in: [0.4, 0, 1, 1] as [number, number, number, number],
} as const;

// ── Variants ───────────────────────────────────────────────────────────────

/** Fade + slide up — primary entrance variant. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE.smooth },
  },
};

/** Fade only — used for subtler entrances (e.g. footer, background elements). */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.base, ease: EASE.smooth },
  },
};

/** Slide in from left. */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.base, ease: EASE.smooth },
  },
};

/**
 * Stagger container — wrap a list of children using fadeInUp/fadeIn.
 * @param stagger - seconds between each child animation (default 0.1)
 */
export const staggerContainer = (stagger = 0.1): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger },
  },
});

/**
 * Viewport options shared across all whileInView calls.
 * `once: true` means the animation only fires the first time the element
 * enters the viewport — never re-animates on scroll-back.
 */
export const VIEWPORT = { once: true, margin: "-80px" } as const;
