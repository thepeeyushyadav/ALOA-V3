"use client";

/**
 * /frontend/components/features/DocSection.tsx
 *
 * Generic, reusable documentation & technical spec section.
 * Includes sticky side-navigation, timeline steps, capability cards,
 * and interactive usage chips with clipboard copy feedback.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  PlayCircle,
  Trash2,
  Copy,
  Check,
  Shield,
  Zap,
  Terminal,
  Cpu,
  CornerDownRight,
} from "lucide-react";
import { fadeInUp, VIEWPORT } from "@/lib/animations";

export interface DocSectionProps {
  onSelectExample?: (command: string) => void;
}

const TOC_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "how-it-works", label: "How It Works" },
  { id: "capabilities", label: "Capabilities" },
  { id: "usage-guide", label: "Usage Guide" },
];

const EXAMPLE_COMMANDS = [
  "install visual studio code",
  "launch google chrome",
  "update cursor",
  "uninstall spotify",
  "search docker",
  "list installed apps",
];

export default function DocSection({ onSelectExample }: DocSectionProps) {
  const [activeToc, setActiveToc] = useState("overview");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (cmd: string, index: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 1600);
  };

  return (
    <section id="docs" className="py-20 md:py-28 border-b border-neutral-900 bg-[#0F0F0F]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left Column: Sticky Table of Contents */}
          <aside className="lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-28 space-y-4">
              <p className="text-xs font-mono uppercase tracking-[0.25em] text-neutral-500 mb-6">
                Documentation
              </p>
              <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
                {TOC_ITEMS.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setActiveToc(item.id)}
                    className={`relative px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap text-left ${
                      activeToc === item.id
                        ? "text-white font-medium bg-neutral-900"
                        : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50"
                    }`}
                  >
                    {activeToc === item.id && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-indigo-500 rounded-r-full" />
                    )}
                    {item.label}
                  </a>
                ))}
              </nav>

              {/* Status card */}
              <div className="hidden lg:block mt-8 p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-xs text-neutral-400">
                <div className="flex items-center gap-2 text-emerald-400 font-mono mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  DualModelChain: ACTIVE
                </div>
                <p className="leading-relaxed">
                  Groq Llama-3.3-70b resolves intent in &lt;180ms. Fallback route available via Gemini Pro.
                </p>
              </div>
            </div>
          </aside>

          {/* Right Column: Documentation Subsections */}
          <div className="flex-1 space-y-24">
            {/* a) Overview */}
            <motion.div
              id="overview"
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              className="scroll-mt-28"
            >
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 mb-3 block">
                01 • System Architecture
              </span>
              <h2 className="text-3xl md:text-4xl font-light text-white tracking-tight mb-6">
                Overview
              </h2>
              <div className="space-y-4 text-neutral-300 text-sm md:text-base leading-relaxed">
                <p>
                  <strong className="text-white font-medium">App Manager</strong> empowers users to install, launch, update, and remove desktop software using natural conversational requests. Instead of manually navigating browser download pages, dealing with bundled installers, or memorizing package identifiers, you simply state what you need.
                </p>
                <p className="text-neutral-400">
                  ALOA’s multi-model AI backbone parses the incoming sentence, strips syntactic filler, verifies safety policies, and queries the official Microsoft Windows Package Manager (<code className="px-1.5 py-0.5 rounded bg-neutral-900 text-indigo-300 font-mono text-xs">winget</code>) repository.
                </p>
              </div>

              {/* Core Features Pill Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="flex items-center gap-2 text-white text-sm font-medium mb-1">
                    <Zap size={16} className="text-amber-400" />
                    <span>Zero Hassle</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Silent background installation with pre-configured verified manifests.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="flex items-center gap-2 text-white text-sm font-medium mb-1">
                    <Shield size={16} className="text-indigo-400" />
                    <span>User Confirmed</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Explicit confirmation prompt before any destructive or system modification step.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="flex items-center gap-2 text-white text-sm font-medium mb-1">
                    <Cpu size={16} className="text-emerald-400" />
                    <span>Dual Model AI</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Ultra-low latency Groq processing with automatic Gemini fallback.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* b) How It Works */}
            <motion.div
              id="how-it-works"
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              className="scroll-mt-28"
            >
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 mb-3 block">
                02 • Lifecycle Flow
              </span>
              <h2 className="text-3xl md:text-4xl font-light text-white tracking-tight mb-8">
                How It Works
              </h2>

              {/* 3-Step Vertical Timeline */}
              <div className="relative pl-8 md:pl-10 space-y-12 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-neutral-700 before:to-neutral-900">
                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-8 md:-left-10 top-0.5 w-7 h-7 rounded-full bg-neutral-950 border-2 border-indigo-500 flex items-center justify-center text-xs font-mono text-indigo-300">
                    1
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    1. You state your intent
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed max-w-xl">
                    Type a natural command into the terminal prompt, such as <code className="text-neutral-200 font-mono text-xs px-1.5 py-0.5 bg-neutral-900 rounded">&quot;install cursor editor&quot;</code> or <code className="text-neutral-200 font-mono text-xs px-1.5 py-0.5 bg-neutral-900 rounded">&quot;launch spotify&quot;</code>.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div className="absolute -left-8 md:-left-10 top-0.5 w-7 h-7 rounded-full bg-neutral-950 border-2 border-indigo-400 flex items-center justify-center text-xs font-mono text-indigo-300">
                    2
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    2. AI parses intent &amp; resolves package
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed max-w-xl">
                    ALOA’s DualModelChain extracts the targeted verb (install, launch, update, etc.) and application entity. It verifies cryptographic package hashes against Microsoft&apos;s winget source.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <div className="absolute -left-8 md:-left-10 top-0.5 w-7 h-7 rounded-full bg-neutral-950 border-2 border-emerald-400 flex items-center justify-center text-xs font-mono text-emerald-300">
                    3
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    3. Governed command execution
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed max-w-xl">
                    For system-level modifications, a security dialog requests explicit confirmation. Once authorized, execution proceeds silently via PowerShell with live progress feedback.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* c) Capabilities */}
            <motion.div
              id="capabilities"
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              className="scroll-mt-28"
            >
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 mb-3 block">
                03 • Operations
              </span>
              <h2 className="text-3xl md:text-4xl font-light text-white tracking-tight mb-8">
                Capabilities
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Capability 1: Install */}
                <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                    <Download size={20} />
                  </div>
                  <h3 className="text-base font-medium text-white mb-2">Install &amp; Setup</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Downloads and installs packages from Microsoft Winget with silent flags, bypassing setup wizard ads and trackers.
                  </p>
                </div>

                {/* Capability 2: Open */}
                <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                    <PlayCircle size={20} />
                  </div>
                  <h3 className="text-base font-medium text-white mb-2">Launch Applications</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Resolves executable paths via Windows Registry and App Paths, bringing the target application directly into focus.
                  </p>
                </div>

                {/* Capability 3: Uninstall */}
                <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
                    <Trash2 size={20} />
                  </div>
                  <h3 className="text-base font-medium text-white mb-2">Clean Uninstall</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Purges software cleanly with confirmation safety, removing registry hooks and leftover startup entries.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* d) Usage Guide */}
            <motion.div
              id="usage-guide"
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              className="scroll-mt-28"
            >
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 mb-3 block">
                04 • Reference
              </span>
              <h2 className="text-3xl md:text-4xl font-light text-white tracking-tight mb-4">
                Usage Guide
              </h2>
              <p className="text-sm text-neutral-400 mb-8 max-w-xl">
                Try phrasing your request naturally — ALOA understands conversational synonyms, not just strict command syntax. Click any command to copy or insert it directly into the live console below.
              </p>

              {/* Interactive Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EXAMPLE_COMMANDS.map((cmd, i) => (
                  <div
                    key={cmd}
                    className="group flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all"
                  >
                    <div className="flex items-center gap-3 font-mono text-xs text-neutral-300 truncate">
                      <Terminal size={14} className="text-indigo-400 shrink-0" />
                      <span className="truncate">{cmd}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {onSelectExample && (
                        <button
                          onClick={() => onSelectExample(cmd)}
                          title="Run in console"
                          className="px-2 py-1 text-[11px] font-sans font-medium text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded transition-colors flex items-center gap-1"
                        >
                          <CornerDownRight size={11} />
                          <span>Run</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleCopy(cmd, i)}
                        title="Copy to clipboard"
                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded transition-colors"
                      >
                        <AnimatePresence mode="wait">
                          {copiedIndex === i ? (
                            <motion.span
                              key="checked"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="text-emerald-400"
                            >
                              <Check size={14} />
                            </motion.span>
                          ) : (
                            <motion.span
                              key="copy"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <Copy size={14} />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
