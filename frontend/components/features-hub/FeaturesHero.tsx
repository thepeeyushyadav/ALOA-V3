"use client";

/**
 * /frontend/components/features-hub/FeaturesHero.tsx
 *
 * Hero section for ALOA V3 Features Hub.
 * Calm, purposeful motion adhering to Linear/Vercel/Raycast quality bar.
 */

import { useRef, useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useMotionTemplate,
  useScroll,
  useTransform,
} from "framer-motion";
import { EASE } from "@/lib/motion";
import { useCountUp } from "@/hooks/useCountUp";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import Link from "next/link";

export default function FeaturesHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const isTouch = useMediaQuery("(pointer: coarse)");
  const prefersReduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  // Scroll tracking for fading out scroll cue
  const { scrollY } = useScroll();
  const scrollCueOpacity = useTransform(scrollY, [0, 80], [1, 0]);

  // Spotlight mouse position tracking
  const mouseX = useMotionValue(0.7);
  const mouseY = useMotionValue(0.4);

  const springConfig = { damping: 30, stiffness: 150, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    setInView(true);

    if (isTouch || prefersReduced) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseX.set(e.clientX / innerWidth);
      mouseY.set(e.clientY / innerHeight);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isTouch, prefersReduced, mouseX, mouseY]);

  // Spotlight radial gradient
  const spotlightGradient = useMotionTemplate`radial-gradient(600px circle at ${useTransform(
    smoothX,
    (v) => `${v * 100}%`
  )} ${useTransform(
    smoothY,
    (v) => `${v * 100}%`
  )}, rgba(56, 189, 248, 0.10) 0%, transparent 70%)`;

  // Count up stats
  const countModules = useCountUp(10, 1.4, inView);
  const countProviders = useCountUp(4, 1.4, inView);
  const countLibraries = useCountUp(45, 1.4, inView);

  // Line 1 and Line 2 word splitting for staggered mask reveal
  const line1Words = ["Ten", "modules."];
  const line2Words = ["One", "autonomous", "agent."];

  return (
    <section
      ref={containerRef}
      className="relative min-h-[88vh] bg-[#0A0A0A] overflow-hidden flex flex-col justify-center pt-36 pb-24 border-b border-white/[0.04]"
    >
      {/* ── Background layers ── */}
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
        {/* a) 64px grid with radial mask */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 50%, #000 30%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 50%, #000 30%, transparent 80%)",
          }}
        />

        {/* b) Mouse spotlight */}
        {!isTouch && !prefersReduced && (
          <motion.div
            className="absolute inset-0 transition-opacity duration-700"
            style={{ background: spotlightGradient }}
          />
        )}

        {/* c) Soft static accent blob top-right */}
        <div
          className="absolute -top-32 right-0 w-[550px] h-[550px] rounded-full blur-3xl opacity-[0.08]"
          style={{
            background:
              "radial-gradient(circle, rgba(56, 189, 248, 0.9) 0%, transparent 70%)",
          }}
        />

        {/* d) Bottom hairline gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* ── Hero Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
        {/* Eyebrow & drawing hairline */}
        <div className="flex items-center gap-4 mb-8">
          <span className="text-xs font-medium tracking-[0.3em] uppercase text-neutral-500">
            The Modules
          </span>
          <motion.span
            className="h-px bg-white/20 origin-left"
            initial={{ scaleX: 0, width: 48 }}
            animate={{ scaleX: 1, width: 48 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          />
        </div>

        {/* H1 two-line typography with word-level mask reveal */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[7.5rem] font-light tracking-tight leading-[0.95] max-w-6xl">
          {/* Line 1 */}
          <div className="flex flex-wrap gap-x-4 md:gap-x-6 text-white mb-2">
            {line1Words.map((word, i) => (
              <span key={i} className="inline-block overflow-hidden py-1">
                <motion.span
                  className="inline-block"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{
                    duration: 0.85,
                    ease: EASE,
                    delay: 0.15 + i * 0.06,
                  }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </div>

          {/* Line 2 */}
          <div className="flex flex-wrap gap-x-4 md:gap-x-6 text-white/55">
            {line2Words.map((word, i) => (
              <span key={i} className="inline-block overflow-hidden py-1">
                <motion.span
                  className="inline-block"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{
                    duration: 0.85,
                    ease: EASE,
                    delay: 0.15 + (line1Words.length + i) * 0.06,
                  }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </div>
        </h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg md:text-xl text-neutral-400 max-w-2xl mt-8 font-light leading-relaxed"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.55 }}
        >
          Every module of ALOA V3, explained in detail: what it does, how it
          works, and what it needs from you.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-wrap items-center gap-4 mt-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.7 }}
        >
          <a
            href="#explore"
            className="inline-flex items-center justify-center bg-white text-black text-sm font-medium rounded-full px-7 py-3.5 hover:scale-[1.03] transition-transform duration-200 active:scale-[0.97]"
          >
            Explore modules
          </a>

          <Link
            href="/docs"
            className="inline-flex items-center justify-center border border-white/15 text-white hover:border-white/30 text-sm font-medium rounded-full px-7 py-3.5 transition-colors duration-200 active:scale-[0.97]"
          >
            Read the docs
          </Link>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          className="flex flex-wrap items-center gap-8 md:gap-12 mt-16 pt-10 border-t border-white/[0.06]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.9 }}
        >
          {/* Stat 1 */}
          <div className="flex flex-col">
            <span className="text-3xl md:text-4xl font-light text-white tracking-tight">
              {countModules}
            </span>
            <span className="text-xs uppercase tracking-widest text-neutral-500 mt-1">
              Modules
            </span>
          </div>

          <div className="hidden sm:block w-px h-10 bg-white/10" aria-hidden="true" />

          {/* Stat 2 */}
          <div className="flex flex-col">
            <span className="text-3xl md:text-4xl font-light text-white tracking-tight">
              {countProviders}
            </span>
            <span className="text-xs uppercase tracking-widest text-neutral-500 mt-1">
              AI providers
            </span>
          </div>

          <div className="hidden sm:block w-px h-10 bg-white/10" aria-hidden="true" />

          {/* Stat 3 */}
          <div className="flex flex-col">
            <span className="text-3xl md:text-4xl font-light text-white tracking-tight">
              {countLibraries}+
            </span>
            <span className="text-xs uppercase tracking-widest text-neutral-500 mt-1">
              Libraries
            </span>
          </div>
        </motion.div>
      </div>

      {/* Scroll cue (bottom center, hidden on mobile) */}
      <motion.div
        className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 pointer-events-none"
        style={{ opacity: scrollCueOpacity }}
        aria-hidden="true"
      >
        <span className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">
          Scroll
        </span>
        <div className="relative w-px h-10 bg-white/10 overflow-hidden">
          <motion.div
            className="w-1 h-1 rounded-full bg-white/60 -left-[1.5px] absolute"
            animate={{ y: [0, 36, 0] }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </motion.div>
    </section>
  );
}
