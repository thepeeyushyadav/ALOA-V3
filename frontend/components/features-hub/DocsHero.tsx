"use client";

/**
 * /frontend/components/features-hub/DocsHero.tsx
 *
 * Compact, calm hero for the /docs page.
 * Same word-mask reveal as FeaturesHero. No buttons, no wheel, no stats.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";

export default function DocsHero() {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    setInView(true);
  }, []);

  const headingWords = ["Everything", "you", "need", "to", "know."];

  return (
    <section className="relative bg-[#0A0A0A] overflow-hidden pt-36 pb-16 border-b border-white/[0.04]">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, #000 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, #000 30%, transparent 80%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
        {/* Eyebrow + drawing hairline */}
        <div className="flex items-center gap-4 mb-8">
          <span className="text-xs font-medium tracking-[0.3em] uppercase text-neutral-500">
            Documentation
          </span>
          <motion.span
            className="h-px bg-white/20 origin-left"
            initial={{ scaleX: 0, width: 48 }}
            animate={{ scaleX: 1, width: 48 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          />
        </div>

        {/* H1 — word-mask reveal (same technique as FeaturesHero) */}
        <h1 className="text-5xl md:text-7xl font-light tracking-tight leading-[1.0] max-w-4xl">
          <div className="flex flex-wrap gap-x-4 md:gap-x-5 text-white">
            {headingWords.map((word, i) => (
              <span key={i} className="inline-block overflow-hidden py-1">
                <motion.span
                  className="inline-block"
                  initial={{ y: "110%" }}
                  animate={{ y: inView ? 0 : "110%" }}
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
        </h1>

        {/* Sub */}
        <motion.p
          className="text-lg text-neutral-400 max-w-2xl mt-6 font-light leading-relaxed"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.55 }}
        >
          How each module works, what it needs from you, and how it keeps you in
          control.
        </motion.p>
      </div>
    </section>
  );
}
