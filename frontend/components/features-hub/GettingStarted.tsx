"use client";

/**
 * /frontend/components/features-hub/GettingStarted.tsx
 *
 * "Getting Started" guide at the top of the Documentation section.
 */

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { EASE } from "@/lib/motion";

const STEPS = [
  {
    num: "01",
    title: "Install the ALOA Agent",
    desc: "Download and run the local daemon for Windows. It provides secure host OS bridging with zero root daemon requirements.",
  },
  {
    num: "02",
    title: "Pair with your account",
    desc: "Connect your local machine via one-time secure pairing token. Hardware telemetry and process controls stay local.",
  },
  {
    num: "03",
    title: "Run any module",
    desc: "Trigger autonomous debugging, deployments, app installs, or system diagnostics straight from your browser or hotkey.",
  },
];

const REQUIREMENTS = [
  "Windows 10/11 for full functionality",
  "8 GB RAM minimum (16 GB recommended)",
  "Stable internet connection (5 Mbps+)",
  "Access to at least one AI provider (Groq, Gemini, OpenRouter, Bedrock)",
  "Tesseract-OCR installed (Exam Pilot only)",
  "GitHub personal access token (Cloud Healer & Auto-Deployer only)",
];

export default function GettingStarted() {
  return (
    <article id="doc-getting-started" className="scroll-mt-28 pb-16 space-y-12">
      {/* Header */}
      <div>
        <span className="text-xs font-mono uppercase tracking-[0.25em] text-neutral-500 block mb-3">
          Prerequisites
        </span>
        <h3 className="text-3xl md:text-4xl font-light text-white tracking-tight mb-4">
          Getting started
        </h3>
        <p className="text-sm md:text-base text-neutral-400 font-light leading-relaxed max-w-2xl">
          ALOA runs through a lightweight agent on your own machine. Your files,
          apps and credentials never leave your computer.
        </p>
      </div>

      {/* Three Step Cards joined by a drawing line */}
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Drawing connector line across cards on desktop */}
        <motion.div
          className="hidden md:block absolute top-7 left-12 right-12 h-px bg-white/10 origin-left pointer-events-none"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          aria-hidden="true"
        />

        {STEPS.map((step) => (
          <div
            key={step.num}
            className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-colors"
          >
            {/* Step badge */}
            <div className="w-10 h-10 rounded-full border border-sky-400/40 bg-sky-400/10 text-sky-400 flex items-center justify-center font-mono text-xs mb-4 relative z-10">
              {step.num}
            </div>
            <h4 className="text-base font-medium text-white mb-2">
              {step.title}
            </h4>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed font-light">
              {step.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Requirements Card */}
      <div className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-6">
        <h4 className="text-lg font-light text-white tracking-tight">
          System Requirements
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {REQUIREMENTS.map((req, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full border border-sky-400/30 bg-sky-400/10 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check size={12} strokeWidth={2.5} />
              </span>
              <span className="text-xs md:text-sm text-neutral-300 font-light">
                {req}
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
