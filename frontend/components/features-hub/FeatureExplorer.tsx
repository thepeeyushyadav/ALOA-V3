"use client";

/**
 * /frontend/components/features-hub/FeatureExplorer.tsx
 *
 * Interactive module explorer pairing the OptionWheel with the FeaturePanel details card.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mouse, Compass } from "lucide-react";
import OptionWheel from "./OptionWheel/OptionWheel";
import FeaturePanel from "./FeaturePanel";
import { FEATURES, Feature } from "@/lib/features-data";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { EASE } from "@/lib/motion";

function getInitialIndexFromHash(): number | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace("#", "").trim();
  if (hash && !hash.startsWith("doc-") && hash !== "explore" && hash !== "docs") {
    const found = FEATURES.findIndex((f) => f.slug === hash);
    if (found !== -1) return found;
  }
  return null;
}

export default function FeatureExplorer() {
  const [mounted, setMounted] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(getInitialIndexFromHash);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(() => getInitialIndexFromHash() !== null);

  const panelRef = useRef<HTMLDivElement>(null);

  // Breakpoints for responsive OptionWheel parameters
  const isXl = useMediaQuery("(min-width: 1280px)");
  const isLg = useMediaQuery("(min-width: 1024px)");
  const isMd = useMediaQuery("(min-width: 768px)");
  const prefersReduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  // Read URL hash on mount and on hashchange (e.g. /features#code-healer)
  useEffect(() => {
    setMounted(true);

    const syncFromHash = () => {
      const idx = getInitialIndexFromHash();
      if (idx !== null) {
        setOpenIndex(idx);
        setHasInteracted(true);
      }
    };

    syncFromHash();
    const timer1 = setTimeout(syncFromHash, 50);
    const timer2 = setTimeout(syncFromHash, 250);

    window.addEventListener("hashchange", syncFromHash);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, []);

  const handleItemClick = (index: number) => {
    setPrevIndex(openIndex);
    setOpenIndex(index);
    setHasInteracted(true);

    // Update URL hash smoothly without jump
    const feature = FEATURES[index];
    if (feature && typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${feature.slug}`);
    }

    // On mobile (<1024px), smooth-scroll panel into view with navbar offset
    if (!isLg) {
      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  const handleClose = () => {
    setPrevIndex(openIndex);
    setOpenIndex(null);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  // Determine direction for smooth slide transition between items
  const direction =
    openIndex !== null && prevIndex !== null
      ? openIndex > prevIndex
        ? 1
        : -1
      : 1;

  // Responsive OptionWheel props
  let wheelProps = {
    fontSize: 1.5,
    spacing: 1.5,
    tilt: 7,
    blur: 1.5,
    inset: 20,
  };

  if (isXl) {
    wheelProps = {
      fontSize: 2.75,
      spacing: 1.5,
      tilt: 6,
      blur: 2,
      inset: 72,
    };
  } else if (isLg) {
    wheelProps = {
      fontSize: 2.25,
      spacing: 1.5,
      tilt: 6,
      blur: 2,
      inset: 56,
    };
  } else if (isMd) {
    wheelProps = {
      fontSize: 2,
      spacing: 1.4,
      tilt: 6,
      blur: 1.5,
      inset: 32,
    };
  }

  const moduleNames = FEATURES.map((f) => f.shortName);
  const activeFeature: Feature | null =
    openIndex !== null ? FEATURES[openIndex] : null;

  return (
    <section
      id="explore"
      className="scroll-mt-20 bg-[#0A0A0A] py-24 md:py-32 relative border-b border-white/[0.04]"
    >
      {/* Section Header */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-16 md:mb-20">
        <span className="text-xs font-medium tracking-[0.3em] uppercase text-neutral-500 block mb-3">
          Explore the Modules
        </span>
        <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
          Scroll or drag to browse.{" "}
          <span className="text-neutral-500">Click a module to explore it.</span>
        </h2>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-12 lg:gap-16 items-center relative">
          {/* Faint vertical hairline between columns (desktop only) */}
          <div
            className="hidden lg:block absolute left-[47.6%] top-0 bottom-0 w-px bg-white/[0.06] pointer-events-none"
            aria-hidden="true"
          />

          {/* LEFT: Wheel Zone */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative flex flex-col items-center"
          >
            {/* Wheel container with vertical linear gradient mask */}
            <div
              className="relative w-full h-[300px] md:h-[340px] lg:h-[78vh] lg:min-h-[520px] lg:max-h-[740px]"
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)",
              }}
            >
              {/* 28px glowing accent line at vertical center on far left */}
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-[2px] bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.85)] z-20 pointer-events-none rounded-full"
                aria-hidden="true"
              />

              {/* Render OptionWheel after client mount */}
              {mounted && (
                <OptionWheel
                  items={moduleNames}
                  defaultSelected={openIndex ?? 0}
                  activeIndex={openIndex}
                  onItemClick={handleItemClick}
                  side="left"
                  curve={1}
                  fade={0.22}
                  minOpacity={0.05}
                  loop={false}
                  draggable
                  textColor="#5f5f66"
                  activeColor="#ffffff"
                  smoothing={prefersReduced ? 60 : 160}
                  soundUrl=""
                  {...wheelProps}
                />
              )}
            </div>

            {/* Hint pill below wheel (disappears forever after first click) */}
            <AnimatePresence>
              {!hasInteracted && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-neutral-400 select-none pointer-events-none"
                >
                  <Mouse size={13} className="text-neutral-500" />
                  <span>Scroll · Drag · Click</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* RIGHT: Details Panel or Empty State */}
          <div ref={panelRef} className="relative w-full min-h-[460px] flex items-center">
            <AnimatePresence mode="wait">
              {activeFeature ? (
                <FeaturePanel
                  key={activeFeature.slug}
                  feature={activeFeature}
                  direction={direction}
                  onClose={handleClose}
                />
              ) : (
                /* Desktop Empty State */
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="hidden lg:flex w-full h-full min-h-[460px] rounded-2xl border border-white/[0.06] bg-white/[0.015] flex-col items-center justify-center p-12 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-center text-neutral-500 mb-6">
                    <Compass size={28} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-light text-white mb-2">
                    Select a module
                  </h3>
                  <p className="text-neutral-500 text-sm max-w-xs font-light leading-relaxed">
                    Click any name on the wheel to see what it does.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
