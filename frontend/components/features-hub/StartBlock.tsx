"use client";

/**
 * /frontend/components/features-hub/StartBlock.tsx
 *
 * Bottom action card for each module documentation section.
 */

import { useState } from "react";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";

export interface StartBlockProps {
  slug: string;
  shortName: string;
  available?: boolean;
}

export default function StartBlock({
  slug,
  shortName,
  available = false,
}: StartBlockProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 overflow-hidden">
      {/* Left Details */}
      <div>
        <span className="text-xs font-mono tracking-[0.25em] uppercase text-neutral-500 block mb-2">
          Start
        </span>
        <h4 className="text-xl md:text-2xl font-light text-white mb-1">
          Run {shortName}
        </h4>
        <p className="text-xs md:text-sm text-neutral-400 font-light">
          Requires the ALOA Agent running on your machine.
        </p>
      </div>

      {/* Right Action Button */}
      <div className="shrink-0">
        {available ? (
          <Link
            href={`/get-started/${slug}`}
            className="inline-flex items-center gap-2 bg-white text-black text-sm font-medium rounded-full px-6 py-3 hover:bg-neutral-200 transition-colors active:scale-[0.98]"
          >
            <span>Launch module</span>
            <ArrowRight size={14} />
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

            {showTooltip && (
              <div
                role="tooltip"
                className="absolute bottom-full right-0 sm:left-1/2 sm:-translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-neutral-300 text-xs whitespace-nowrap shadow-xl pointer-events-none z-30"
              >
                This module opens in the next release
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
