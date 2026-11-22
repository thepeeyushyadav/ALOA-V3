"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Link as LinkIcon, Mail } from "lucide-react";

const providers = [
  { label: "G", name: "Groq", color: "#FF4500" },
  { label: "G", name: "Gemini", color: "#4285F4" },
  { label: "O", name: "OpenRouter", color: "#6C47FF" },
  { label: "A", name: "Bedrock", color: "#FF9900" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Staggered pulsing dot particles — kept from previous version
// ─────────────────────────────────────────────────────────────────────────────
const particles = [
  { id: "p1",  top: "8%",  right: "12%", delay: 0 },
  { id: "p2",  top: "15%", right: "38%", delay: 0.8 },
  { id: "p3",  top: "22%", right: "55%", delay: 1.6 },
  { id: "p4",  top: "35%", right: "8%",  delay: 0.4 },
  { id: "p5",  top: "42%", right: "30%", delay: 2.2 },
  { id: "p6",  top: "58%", right: "18%", delay: 1.1 },
  { id: "p7",  top: "65%", right: "45%", delay: 0.2 },
  { id: "p8",  top: "72%", right: "60%", delay: 1.9 },
  { id: "p9",  top: "28%", right: "70%", delay: 0.7 },
  { id: "p10", top: "50%", right: "75%", delay: 2.5 },
  { id: "p11", top: "12%", right: "82%", delay: 1.3 },
  { id: "p12", top: "80%", right: "25%", delay: 0.5 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Hero background: real video (men.mp4) + staggered dot particles on top
// ─────────────────────────────────────────────────────────────────────────────
function HeroVideoPlaceholder() {
  return (
    <div className="relative w-full h-full overflow-hidden video-plus-darker">
      {/* Real video — men.mp4 */}
      <video
        className="absolute inset-0 w-full h-full object-cover object-top video-plus-darker"
        autoPlay
        loop
        muted
        playsInline
        src="/videos/men.mp4"
      />

      {/* Staggered pulsing dot particles layered above the video */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            top: p.top,
            right: p.right,
            width: 5,
            height: 5,
            background: "hsla(210, 80%, 65%, 0.7)",
            willChange: "transform, opacity",
            zIndex: 2,
          }}
          animate={{
            opacity: [0.15, 0.75, 0.15],
            scale: [0.8, 1.4, 0.8],
            x: [0, 4, -3, 0],
            y: [0, -4, 3, 0],
          }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HeroSection — content layer only (background lives in page.tsx at z-1)
// ─────────────────────────────────────────────────────────────────────────────
export default function HeroSection() {
  return (
    <section className="relative flex-1 z-10 flex flex-col justify-between px-5 pt-8 pb-20 md:px-12 md:pt-16 md:pb-36">
      {/* Top label */}
      <div>
        <p className="text-xs font-medium tracking-[0.3em] text-neutral-500 uppercase mb-6 md:mb-8">
          Autonomous Agent
        </p>

        {/* Heading row */}
        <div className="flex flex-row items-start gap-3 md:gap-5">
          <span className="text-sm text-neutral-400 mt-2 md:mt-4 shrink-0">10</span>
          <h1 className="text-[2.75rem] md:text-[5.5rem] leading-[0.95] font-light tracking-tight text-neutral-900">
            YOUR LAPTOP
            <br />
            RUN BY AN AGENT
          </h1>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-row items-center gap-5 mt-8 md:mt-10">
          <Link
            href="/get-started"
            className="relative overflow-hidden group bg-neutral-900 text-white text-sm font-medium rounded-lg px-7 py-3.5 hover:bg-neutral-800 transition-colors duration-200 inline-flex items-center justify-center"
          >
            <span className="relative z-10">Get Started</span>
            <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)' }} />
          </Link>
          <a
            href="mailto:hello.aloav3@gmail.com?subject=Inquiry%20regarding%20ALOA%20V3"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-300 bg-white/80 hover:bg-white backdrop-blur-xs px-5 py-3.5 rounded-lg transition-all duration-200 shadow-2xs group"
          >
            <Mail size={16} className="text-neutral-400 group-hover:text-neutral-900 transition-colors" />
            <span>Connect</span>
          </a>
        </div>
      </div>

      {/* Middle stat */}
      <div className="hero-stat-group flex flex-col justify-center my-10 md:my-0">
        <span className="text-5xl md:text-7xl font-light tracking-tight text-neutral-900">
          100%
        </span>
        <span className="text-xs md:text-sm text-neutral-500 uppercase tracking-widest mt-1">
          Autonomous
        </span>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 md:gap-0">
        {/* Left: Powered by */}
        <div className="flex flex-row items-center gap-3">
          <div className="flex flex-row -space-x-2">
            {providers.map((p) => (
              <div
                key={p.name}
                className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-neutral-100 flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: p.color }}
                title={p.name}
              >
                {p.label}
              </div>
            ))}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
              Powered by
            </span>
            <span className="text-sm font-medium text-neutral-700">4 Providers</span>
          </div>
        </div>

        {/* Right: Description group */}
        <div className="hero-description-group flex flex-row items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-neutral-300 flex items-center justify-center shrink-0">
            <LinkIcon size={16} className="text-neutral-500" />
          </div>
          <p className="text-xs md:text-sm text-neutral-500 max-w-[200px] md:max-w-sm leading-relaxed">
            ALOA reads your command, reasons through a multi-model AI backbone, and executes
            — directly on your machine.
          </p>
        </div>
      </div>
    </section>
  );
}

export { HeroVideoPlaceholder };
