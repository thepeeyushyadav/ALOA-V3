"use client";

/**
 * /frontend/components/how-it-works/HowItWorksPage.tsx
 *
 * Full "How It Works" page — covers ALOA's overall architecture,
 * the AI backbone, local agent model, and execution loop.
 */

import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import {
  Brain,
  Cpu,
  Shield,
  Zap,
  GitBranch,
  Layers,
  ArrowRight,
  Terminal,
  Cloud,
  Lock,
} from "lucide-react";
import Link from "next/link";

/* ─── Data ─────────────────────────────────────────────────── */

const PIPELINE_STEPS = [
  {
    num: "01",
    title: "You give a command",
    body: 'Type a plain-language request — "fix my build", "install VS Code", "generate notes from this lecture". No syntax, no flags.',
    icon: Terminal,
  },
  {
    num: "02",
    title: "DualModelChain interprets",
    body: "Groq (primary, fast) interprets the intent. If it fails or returns low-confidence output, OpenRouter takes over as an automatic fallback — zero input from you.",
    icon: Brain,
  },
  {
    num: "03",
    title: "The right module is routed",
    body: "The resolved intent is dispatched to the correct module: App Manager, Code Healer, System Insights, etc. Each module runs its own specialised logic.",
    icon: GitBranch,
  },
  {
    num: "04",
    title: "Local execution on your machine",
    body: "The local agent executes the action — running PowerShell, patching a file, capturing screen, or cloning a repo — entirely on your hardware.",
    icon: Cpu,
  },
  {
    num: "05",
    title: "You confirm before anything irreversible",
    body: "Installs, uninstalls, file writes, and pushes always pause for your approval first. ALOA shows exactly what it will do before doing it.",
    icon: Shield,
  },
  {
    num: "06",
    title: "Result is returned",
    body: "The outcome is surfaced in plain language — success, failure, or a diff. For errors, the AI explains what went wrong and suggests the next step.",
    icon: Zap,
  },
];

const AI_PROVIDERS = [
  {
    name: "Groq",
    role: "Primary inference engine",
    desc: "Ultra-fast LPU inference. Used as the primary model for intent parsing and reasoning across most modules.",
    color: "from-orange-500/20 to-transparent",
    border: "border-orange-400/20",
    dot: "bg-orange-400",
  },
  {
    name: "Gemini",
    role: "Multimodal tasks",
    desc: "Google's multimodal model powers YouTube Notes (transcript understanding), Exam Pilot (OCR + reasoning), and Resume Engine (PDF parsing).",
    color: "from-blue-500/20 to-transparent",
    border: "border-blue-400/20",
    dot: "bg-blue-400",
  },
  {
    name: "OpenRouter",
    role: "Universal fallback",
    desc: "Routes to the best available model when primary providers rate-limit or fail. Ensures near-100% uptime across all modules.",
    color: "from-purple-500/20 to-transparent",
    border: "border-purple-400/20",
    dot: "bg-purple-400",
  },
  {
    name: "AWS Bedrock",
    role: "Cloud module isolation",
    desc: "Powers Cloud Healer's remote debugging in a sandboxed environment — keeping cloud operations isolated from your local agent.",
    color: "from-yellow-500/20 to-transparent",
    border: "border-yellow-400/20",
    dot: "bg-yellow-400",
  },
];

const PRINCIPLES = [
  {
    icon: Lock,
    title: "Local-first execution",
    body: "Your files, apps, and credentials never leave your machine. The local agent runs on your hardware — ALOA is a brain, not a cloud service.",
  },
  {
    icon: Shield,
    title: "Approval before every irreversible action",
    body: "Installs, file writes, commits, and process kills all pause for your explicit confirmation. ALOA shows the exact diff or command before it runs.",
  },
  {
    icon: Layers,
    title: "Modular by design",
    body: "Each of the 10 modules is a self-contained unit with its own AI chain, tools, and safety checks. Enabling or disabling one never affects the others.",
  },
  {
    icon: Cloud,
    title: "Provider-agnostic AI",
    body: "ALOA isn't locked to one AI provider. The DualModelChain tries Groq first, falls back to OpenRouter, and routes specialist tasks to Gemini or Bedrock.",
  },
];

/* ─── Component ─────────────────────────────────────────────── */

export default function HowItWorksPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative bg-[#0A0A0A] overflow-hidden pt-36 pb-24 border-b border-white/[0.04]">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 50%, #000 30%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 50%, #000 30%, transparent 80%)",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <div className="flex items-center gap-4 mb-8">
              <span className="text-xs font-medium tracking-[0.3em] uppercase text-neutral-500">
                Architecture
              </span>
              <motion.span
                className="h-px bg-white/20 origin-left"
                initial={{ scaleX: 0, width: 48 }}
                animate={{ scaleX: 1, width: 48 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
              />
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight leading-[0.95] max-w-5xl mb-8">
              <span className="text-white">How ALOA</span>
              <br />
              <span className="text-white/40">actually works.</span>
            </h1>

            <p className="text-lg md:text-xl text-neutral-400 max-w-2xl font-light leading-relaxed">
              A local agent on your machine. A dual-model AI backbone. Ten
              specialised modules. Every action shown before it runs.
            </p>

            <div className="flex flex-wrap gap-4 mt-10">
              <Link
                href="/features"
                className="inline-flex items-center gap-2 bg-white text-black text-sm font-medium rounded-full px-7 py-3.5 hover:scale-[1.03] transition-transform duration-200"
              >
                See all modules
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center border border-white/15 text-white hover:border-white/30 text-sm font-medium rounded-full px-7 py-3.5 transition-colors duration-200"
              >
                Read the docs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Execution Pipeline ── */}
      <section className="bg-[#0A0A0A] py-28 md:py-36 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-20"
          >
            <span className="text-xs font-medium tracking-[0.3em] uppercase text-neutral-500 block mb-4">
              The execution loop
            </span>
            <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight max-w-2xl">
              From your words to real actions.
            </h2>
            <p className="text-base text-neutral-400 font-light mt-4 max-w-xl leading-relaxed">
              Every ALOA task travels through the same six-step pipeline —
              parsed, routed, executed, and confirmed.
            </p>
          </motion.div>

          <div className="relative">
            {/* Vertical guide line */}
            <motion.div
              className="absolute left-6 top-6 bottom-6 w-px bg-white/[0.06] hidden md:block"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: EASE }}
              aria-hidden="true"
            />

            <div className="space-y-6 md:space-y-4">
              {PIPELINE_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.num}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, ease: EASE, delay: i * 0.07 }}
                    className="md:grid md:grid-cols-[80px_minmax(0,1fr)] gap-8 items-start group"
                  >
                    {/* Step number + icon bubble */}
                    <div className="hidden md:flex flex-col items-center gap-2">
                      <div className="relative z-10 w-12 h-12 rounded-2xl border border-sky-400/30 bg-sky-400/[0.07] flex items-center justify-center text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.1)] group-hover:border-sky-400/60 transition-colors duration-300">
                        <Icon size={20} strokeWidth={1.75} />
                      </div>
                      <span className="text-[10px] font-mono text-neutral-600">
                        {step.num}
                      </span>
                    </div>

                    {/* Content card */}
                    <div className="p-6 md:p-8 rounded-2xl bg-white/[0.025] border border-white/[0.07] hover:border-white/15 hover:-translate-y-0.5 transition-all duration-300">
                      {/* Mobile icon */}
                      <div className="flex items-center gap-3 mb-3 md:hidden">
                        <div className="w-8 h-8 rounded-xl border border-sky-400/30 bg-sky-400/10 flex items-center justify-center text-sky-400">
                          <Icon size={16} strokeWidth={1.75} />
                        </div>
                        <span className="text-[10px] font-mono text-neutral-500">
                          {step.num}
                        </span>
                      </div>
                      <h3 className="text-base md:text-lg font-medium text-white mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-neutral-400 leading-relaxed font-light">
                        {step.body}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Providers ── */}
      <section className="bg-[#0F0F0F] py-28 md:py-36 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-16"
          >
            <span className="text-xs font-medium tracking-[0.3em] uppercase text-neutral-500 block mb-4">
              AI Backbone
            </span>
            <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight max-w-2xl">
              Four providers. One seamless chain.
            </h2>
            <p className="text-base text-neutral-400 font-light mt-4 max-w-xl leading-relaxed">
              ALOA is provider-agnostic. The DualModelChain routes each task to
              the fastest, most capable model — with automatic fallback and zero
              manual switching.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {AI_PROVIDERS.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease: EASE, delay: i * 0.08 }}
                className={`relative overflow-hidden p-7 rounded-2xl border ${p.border} bg-white/[0.025] hover:bg-white/[0.04] hover:-translate-y-0.5 transition-all duration-300`}
              >
                {/* Gradient glow */}
                <div
                  className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-b ${p.color} pointer-events-none`}
                  aria-hidden="true"
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                    <span className="text-white font-medium text-base">
                      {p.name}
                    </span>
                    <span className="text-xs text-neutral-500 font-light ml-auto">
                      {p.role}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-400 leading-relaxed font-light">
                    {p.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* DualModelChain callout */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.3 }}
            className="mt-8 p-6 md:p-8 rounded-2xl border border-sky-400/20 bg-sky-400/[0.04] flex flex-col md:flex-row items-start md:items-center gap-5"
          >
            <div className="w-12 h-12 rounded-2xl border border-sky-400/30 bg-sky-400/10 flex items-center justify-center text-sky-400 shrink-0">
              <Brain size={22} strokeWidth={1.75} />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-sky-400 block mb-1.5">
                DualModelChain
              </span>
              <p className="text-sm text-neutral-300 font-light leading-relaxed max-w-3xl">
                Every ALOA module runs through the DualModelChain — Groq
                attempts the task first for speed. If it returns a
                low-confidence answer or hits a rate limit, OpenRouter
                automatically takes over, selecting the best available model for
                the job. This happens in milliseconds, invisibly.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Core Principles ── */}
      <section className="bg-[#0A0A0A] py-28 md:py-36 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-16"
          >
            <span className="text-xs font-medium tracking-[0.3em] uppercase text-neutral-500 block mb-4">
              Design principles
            </span>
            <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight max-w-2xl">
              Built to be trusted.
            </h2>
            <p className="text-base text-neutral-400 font-light mt-4 max-w-xl leading-relaxed">
              Every architectural decision in ALOA starts with one question:
              does the user remain in control?
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {PRINCIPLES.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, ease: EASE, delay: i * 0.08 }}
                  className="p-7 rounded-2xl bg-white/[0.025] border border-white/[0.07] hover:border-white/15 hover:-translate-y-0.5 transition-all duration-300 flex gap-5"
                >
                  <div className="w-11 h-11 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-neutral-300 shrink-0 mt-0.5">
                    <Icon size={18} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-white mb-2">
                      {p.title}
                    </h3>
                    <p className="text-sm text-neutral-400 leading-relaxed font-light">
                      {p.body}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Architecture Diagram — text-based ── */}
      <section className="bg-[#0F0F0F] py-28 md:py-36 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-16"
          >
            <span className="text-xs font-medium tracking-[0.3em] uppercase text-neutral-500 block mb-4">
              System overview
            </span>
            <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight max-w-2xl">
              The full picture.
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="rounded-2xl border border-white/[0.07] bg-black/40 p-8 md:p-12 font-mono text-xs md:text-sm overflow-x-auto"
          >
            <pre className="text-neutral-400 leading-7 whitespace-pre">
              {`  ┌─────────────────────────────────────────────────────────────┐
  │                        YOU                                 │
  │          "install VS Code"  /  "fix my build"  /  ...      │
  └───────────────────────────┬─────────────────────────────────┘
                              │  natural language
                              ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                   DualModelChain                           │
  │                                                             │
  │   ① Groq  ──────► intent resolved?  ──YES──►  route       │
  │             └──NO / rate-limit──►  OpenRouter  ──►  route  │
  └───────────────────────────┬─────────────────────────────────┘
                              │  resolved intent
                              ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                    Module Router                           │
  ├──────────┬──────────┬──────────┬──────────┬────────────────┤
  │App Mgr   │Sys Doctor│Code      │Cloud     │  ...6 more     │
  │(Winget)  │(psutil)  │Healer    │Healer    │  modules       │
  │          │          │(difflib) │(Git/AWS) │                │
  └──────────┴──────────┴──────────┴──────────┴────────────────┘
                              │  confirmation required?
                              ▼
  ┌─────────────────────────────────────────────────────────────┐
  │            YOUR APPROVAL  (for all irreversible ops)       │
  └───────────────────────────┬─────────────────────────────────┘
                              │  approved
                              ▼
  ┌─────────────────────────────────────────────────────────────┐
  │             LOCAL AGENT  (your Windows machine)            │
  │   PowerShell / subprocess / file I/O / Git / GitHub API   │
  └─────────────────────────────────────────────────────────────┘`}
            </pre>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#0A0A0A] py-28 md:py-36">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight">
              Ready to let ALOA run your laptop?
            </h2>
            <p className="text-base text-neutral-400 font-light max-w-xl mx-auto leading-relaxed">
              Ten modules. Four AI providers. One agent that keeps you in
              control of every action.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link
                href="/get-started"
                className="inline-flex items-center gap-2 bg-white text-black text-sm font-medium rounded-full px-8 py-4 hover:scale-[1.03] transition-transform duration-200"
              >
                Get started
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center border border-white/15 text-white hover:border-white/30 text-sm font-medium rounded-full px-8 py-4 transition-colors duration-200"
              >
                Read the docs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
