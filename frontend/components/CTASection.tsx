"use client";

import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";

export default function CTASection() {
  return (
    <section
      className="relative w-full overflow-hidden py-28 md:py-40"
      style={{ backgroundColor: "#0F0F0F" }}
    >
      {/* ── Subtle pulsing radial glow behind the text (CSS pulse, zero hydration drift) ── */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="rounded-full animate-pulse"
          style={{
            width: "600px",
            height: "600px",
            background:
              "radial-gradient(ellipse at center, hsla(210,85%,65%,0.12) 0%, transparent 70%)",
            animationDuration: "6s",
          }}
        />
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        {/* Label */}
        <p className="text-xs font-medium tracking-[0.3em] text-neutral-500 uppercase mb-6">
          Get Started
        </p>

        {/* Headline */}
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight text-white leading-[1.05] mb-6">
          Your laptop.
          <br />
          Run by an agent.
        </h2>

        {/* Supporting line */}
        <p className="text-base md:text-lg text-neutral-400 max-w-xl mx-auto mb-10">
          Stop context-switching. Let ALOA execute.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/get-started"
            className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-semibold text-white bg-neutral-900 border border-white/20 hover:border-white/40 shadow-[0_4px_24px_-4px_rgba(255,255,255,0.15)] hover:shadow-[0_4px_32px_0_rgba(255,255,255,0.25)] hover:bg-black transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Get Started Free</span>
            <ArrowRight
              size={17}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>

          <a
            href="mailto:hello.aloav3@gmail.com?subject=Inquiry%20regarding%20ALOA%20V3"
            className="inline-flex items-center gap-2 px-6 py-4 rounded-xl text-sm font-medium text-neutral-400 hover:text-white border border-white/10 hover:border-white/25 hover:bg-white/[0.05] transition-all duration-200"
          >
            <Mail size={16} className="text-neutral-500" />
            <span>Connect with us</span>
          </a>
        </div>
      </div>
    </section>
  );
}
