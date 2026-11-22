"use client";

/**
 * /frontend/components/features-hub/ModuleDoc.tsx
 *
 * Full documentation layout for a single ALOA V3 module.
 */

import { motion } from "framer-motion";
import {
  ShieldCheck,
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
import StartBlock from "./StartBlock";

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

export interface ModuleDocProps {
  feature: Feature;
  showStart?: boolean;
}

export default function ModuleDoc({ feature, showStart = true }: ModuleDocProps) {
  const IconComponent = ICON_MAP[feature.icon] ?? AppWindow;

  return (
    <article
      id={`doc-${feature.slug}`}
      className="scroll-mt-28 py-20 border-t border-white/[0.06] first:border-t-0 space-y-16"
    >
      {/* ── a) Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: EASE }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <span className="text-sky-400 font-mono text-xs tracking-widest uppercase">
            {feature.index}
          </span>
          <span className="text-neutral-600">•</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-neutral-300">
            {feature.category}
          </span>
        </div>

        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-sky-400 shrink-0 mt-1 shadow-[0_0_20px_rgba(56,189,248,0.12)]">
            <IconComponent size={26} strokeWidth={1.75} />
          </div>

          <div>
            <h3 className="text-3xl md:text-4xl font-light text-white tracking-tight">
              {feature.fullName}
            </h3>
            <p className="text-base md:text-lg text-neutral-300 font-light mt-1.5">
              {feature.tagline}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── b) Overview ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: EASE }}
        className="space-y-3"
      >
        <span className="text-xs font-medium tracking-[0.25em] uppercase text-neutral-500 block">
          Overview
        </span>
        <p className="text-sm md:text-base text-neutral-300 leading-relaxed font-light max-w-3xl">
          {feature.overview}
        </p>
      </motion.div>

      {/* ── c) How it works (Vertical Timeline) ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: EASE }}
        className="space-y-6"
      >
        <span className="text-xs font-medium tracking-[0.25em] uppercase text-neutral-500 block">
          How It Works
        </span>

        <div className="relative pl-10 space-y-8">
          {/* Timeline continuous vertical line that draws on view */}
          <motion.div
            className="absolute left-3.5 top-3.5 bottom-3.5 w-px bg-white/10 origin-top"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
            aria-hidden="true"
          />

          {feature.steps.map((step, idx) => (
            <div key={idx} className="relative flex items-start gap-4">
              {/* Numbered 28px Circle */}
              <div className="absolute -left-10 top-0.5 w-7 h-7 rounded-full border border-sky-400/40 bg-sky-400/10 text-sky-400 flex items-center justify-center font-mono text-xs z-10">
                {idx + 1}
              </div>

              <div>
                <h4 className="text-white text-sm md:text-base font-medium">
                  {step.title}
                </h4>
                <p className="text-xs md:text-sm text-neutral-400 mt-1 leading-relaxed">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── d) Capabilities (2-Column Grid) ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: EASE }}
        className="space-y-4"
      >
        <span className="text-xs font-medium tracking-[0.25em] uppercase text-neutral-500 block">
          Capabilities
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {feature.capabilities.map((cap, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 hover:-translate-y-0.5 transition-all duration-200 hover:shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
            >
              <h5 className="text-sm font-medium text-white mb-1.5">
                {cap.title}
              </h5>
              <p className="text-xs md:text-sm text-neutral-400 leading-relaxed font-light">
                {cap.body}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── e) What you provide ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: EASE }}
        className="space-y-3"
      >
        <span className="text-xs font-medium tracking-[0.25em] uppercase text-neutral-500 block">
          What You Provide
        </span>

        <ul className="space-y-2.5">
          {feature.provide.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span
                className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 shrink-0 shadow-[0_0_6px_rgba(56,189,248,0.8)]"
                aria-hidden="true"
              />
              <span className="text-sm text-neutral-300 font-light">{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* ── f) Safety & control ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: EASE }}
        className="border border-sky-400/20 bg-sky-400/[0.04] rounded-xl p-5 flex items-start gap-4"
      >
        <ShieldCheck size={20} className="text-sky-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-sky-400 block mb-1">
            Safety &amp; Control
          </span>
          <p className="text-xs md:text-sm text-neutral-300 font-light leading-relaxed">
            {feature.safety}
          </p>
        </div>
      </motion.div>

      {/* ── g) Under the hood ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: EASE }}
        className="space-y-3"
      >
        <span className="text-xs font-medium tracking-[0.25em] uppercase text-neutral-500 block">
          Under the Hood
        </span>

        <div className="flex flex-wrap gap-2">
          {feature.tech.map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/10 bg-white/[0.03] text-xs px-3 py-1 font-sans text-neutral-300"
            >
              {t}
            </span>
          ))}
        </div>
      </motion.div>

      {/* ── h) StartBlock — only rendered on /get-started, never on /docs ── */}
      {showStart && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <StartBlock
            slug={feature.slug}
            shortName={feature.shortName}
            available={feature.available}
          />
        </motion.div>
      )}
    </article>
  );
}
