"use client";

/**
 * /frontend/components/features-hub/FeaturePanel.tsx
 *
 * Details panel displayed on the right side of FeatureExplorer when a module is clicked.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  X,
  Check,
  ArrowDown,
  Lock,
  AppWindow,
  Activity,
  ClipboardCheck,
  Video,
  ScanText,
  Bug,
  CloudCog,
  Rocket,
  FileUser,
  Radar,
  LucideIcon,
} from "lucide-react";
import { Feature } from "@/lib/features-data";
import { EASE } from "@/lib/motion";

const ICON_MAP: Record<string, LucideIcon> = {
  AppWindow,
  Activity,
  ClipboardCheck,
  Video,
  ScanText,
  Bug,
  CloudCog,
  Rocket,
  FileUser,
  Radar,
};

export interface FeaturePanelProps {
  feature: Feature;
  direction?: number;
  onClose: () => void;
}

export default function FeaturePanel({
  feature,
  direction = 1,
  onClose,
}: FeaturePanelProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const IconComponent = ICON_MAP[feature.icon] ?? AppWindow;

  return (
    <motion.div
      key={feature.slug}
      initial={{ opacity: 0, y: direction * 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: direction * -24 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="relative w-full rounded-2xl bg-white/[0.03] border border-white/[0.08] p-8 md:p-12 overflow-hidden shadow-2xl backdrop-blur-sm"
    >
      {/* Huge ghost number behind content */}
      <span
        className="absolute -right-4 -bottom-8 text-[22vw] lg:text-[16vw] font-light leading-none select-none pointer-events-none text-transparent"
        style={{
          WebkitTextStroke: "1px rgba(255,255,255,0.04)",
        }}
        aria-hidden="true"
      >
        {feature.index}
      </span>

      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close module details"
        className="absolute top-6 right-6 w-9 h-9 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/10 hover:border-white/20 text-neutral-400 hover:text-white flex items-center justify-center transition-colors z-20"
      >
        <X size={16} />
      </button>

      <div className="relative z-10 flex flex-col space-y-6">
        {/* Counter + Category Badge */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs tabular-nums text-neutral-400">
            {feature.index} / 10
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-neutral-300">
            {feature.category}
          </span>
        </div>

        {/* Icon Tile */}
        <div className="w-14 h-14 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.12)]">
          <IconComponent size={26} strokeWidth={1.75} />
        </div>

        {/* Title area with aria-live */}
        <div aria-live="polite">
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-light text-white tracking-tight">
            {feature.fullName}
          </h3>
          <p className="text-lg text-neutral-300 font-light mt-2">
            {feature.tagline}
          </p>
        </div>

        {/* Summary */}
        <p className="text-sm md:text-base text-neutral-400 leading-relaxed font-light">
          {feature.summary}
        </p>

        {/* 3 Highlights */}
        <div className="space-y-2.5 pt-2">
          {feature.highlights.map((highlight, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full border border-sky-400/30 bg-sky-400/10 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check size={12} strokeWidth={2.5} />
              </span>
              <span className="text-sm text-neutral-300">{highlight}</span>
            </div>
          ))}
        </div>

        {/* Tech Chips */}
        <div className="flex flex-wrap gap-2 pt-2">
          {feature.tech.map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/10 bg-white/[0.03] text-xs px-3 py-1 font-sans text-neutral-300"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/[0.06]">
          {/* Read Documentation — navigates to /docs#doc-<slug> */}
          <Link
            href={`/docs#doc-${feature.slug}`}
            className="inline-flex items-center gap-2 bg-white text-black text-sm font-medium rounded-full px-6 py-3 hover:bg-neutral-200 transition-colors active:scale-[0.98]"
          >
            <span>Read documentation</span>
            <ArrowDown size={14} />
          </Link>

          {/* Start Module button / link — only available path in the site */}
          {feature.available ? (
            <Link
              href={`/get-started/${feature.slug}`}
              className="inline-flex items-center gap-2 border border-white/15 text-white hover:border-white/30 text-sm font-medium rounded-full px-6 py-3 transition-colors active:scale-[0.98]"
            >
              <span>Start module</span>
            </Link>
          ) : (
            <div
              className="relative inline-block"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <button
                disabled
                aria-disabled="true"
                className="inline-flex items-center gap-2 border border-white/10 text-neutral-500 text-sm font-medium rounded-full px-6 py-3 cursor-not-allowed bg-white/[0.02]"
              >
                <Lock size={13} className="text-neutral-500" />
                <span>Launching soon</span>
              </button>

              {/* Tooltip */}
              {showTooltip && (
                <div
                  role="tooltip"
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-neutral-300 text-xs whitespace-nowrap shadow-xl pointer-events-none z-30"
                >
                  This module opens in the next release
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
