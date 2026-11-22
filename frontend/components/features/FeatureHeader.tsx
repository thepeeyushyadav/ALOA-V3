"use client";

/**
 * /frontend/components/features/FeatureHeader.tsx
 *
 * Generic, reusable header banner for all ALOA feature module pages.
 * Displays breadcrumbs, module index badge, bold typography, and quick-jump actions.
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { Terminal, BookOpen, ArrowLeft, Cpu, ShieldCheck } from "lucide-react";
import { fadeInUp, staggerContainer } from "@/lib/animations";

export interface FeatureHeaderProps {
  moduleNumber: string;
  badge?: string;
  title: string;
  tagline: string;
  description: string;
  provider?: string;
  consoleAnchorId?: string;
  docsAnchorId?: string;
}

export default function FeatureHeader({
  moduleNumber,
  badge = "System Agent",
  title,
  tagline,
  description,
  provider = "DualModelChain (Groq Llama-3.3-70b + Gemini 1.5 Pro Fallback)",
  consoleAnchorId = "console",
  docsAnchorId = "docs",
}: FeatureHeaderProps) {
  return (
    <motion.section
      variants={staggerContainer(0.08)}
      initial="hidden"
      animate="visible"
      className="relative pt-12 pb-16 md:pt-16 md:pb-24 border-b border-neutral-900 overflow-hidden"
    >
      {/* Background radial gradient accent */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-[120px] opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(99,102,241,0.6) 0%, rgba(59,130,246,0.2) 50%, transparent 80%)",
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Navigation Breadcrumb */}
        <motion.div variants={fadeInUp} className="flex items-center gap-3 text-xs mb-8 text-neutral-400">
          <Link
            href="/"
            className="flex items-center gap-1.5 hover:text-white transition-colors py-1"
          >
            <ArrowLeft size={13} />
            <span>Home</span>
          </Link>
          <span className="text-neutral-700">/</span>
          <span className="text-neutral-400">Modules</span>
          <span className="text-neutral-700">/</span>
          <span className="text-white font-medium">Module {moduleNumber}: {title}</span>
        </motion.div>

        {/* Badges Row */}
        <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-2.5 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Cpu size={12} />
            MODULE {moduleNumber} • {badge.toUpperCase()}
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono text-neutral-400 bg-neutral-900 border border-neutral-800">
            <ShieldCheck size={12} className="text-emerald-400" />
            CONFIRMATION GUARD ACTIVE
          </span>
        </motion.div>

        {/* Main Heading */}
        <motion.div variants={fadeInUp}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-white mb-4">
            {title}
          </h1>
          <p className="text-lg md:text-xl font-light text-neutral-300 max-w-2xl mb-6">
            {tagline}
          </p>
        </motion.div>

        {/* Description */}
        <motion.p
          variants={fadeInUp}
          className="text-sm md:text-base text-neutral-400 leading-relaxed max-w-3xl mb-10"
        >
          {description}
        </motion.p>

        {/* Action CTAs */}
        <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-4">
          <a
            href={`#${consoleAnchorId}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-neutral-950 text-sm font-medium hover:bg-neutral-200 transition-all shadow-lg shadow-white/5 active:scale-[0.98]"
          >
            <Terminal size={16} />
            <span>Try Interactive Console</span>
          </a>

          <a
            href={`#${docsAnchorId}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-neutral-900 text-neutral-200 text-sm font-medium border border-neutral-800 hover:bg-neutral-800 hover:text-white transition-colors active:scale-[0.98]"
          >
            <BookOpen size={16} />
            <span>Architecture & Docs</span>
          </a>
        </motion.div>

        {/* Provider metadata strip */}
        <motion.div
          variants={fadeInUp}
          className="mt-10 pt-6 border-t border-neutral-900 flex flex-wrap items-center gap-4 text-xs text-neutral-500"
        >
          <span className="font-mono uppercase tracking-wider text-neutral-400">Backbone:</span>
          <span>{provider}</span>
          <span className="hidden md:inline text-neutral-700">•</span>
          <span className="font-mono uppercase tracking-wider text-neutral-400">Execution Engine:</span>
          <span className="text-neutral-300">Windows Winget + PowerShell Core</span>
        </motion.div>
      </div>
    </motion.section>
  );
}
