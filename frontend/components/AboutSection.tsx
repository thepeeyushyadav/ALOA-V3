"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import Link from "next/link";
import VideoModal from "./VideoModal";

export default function AboutSection() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <>
      <section
        id="about"
        className="flex flex-col lg:flex-row w-full"
        style={{ backgroundColor: "#0F0F0F", minHeight: "600px" }}
      >
        {/* ── Left: real video (woman.mp4) ──────────────────────────────── */}
        <div
          className="w-full lg:w-1/2 h-[400px] lg:h-auto overflow-hidden"
          style={{ minHeight: "inherit" }}
        >
          <video
            className="w-full h-full object-cover"
            style={{ mixBlendMode: "lighten", display: "block" }}
            autoPlay
            loop
            muted
            playsInline
            src="/videos/woman.mp4"
          />
        </div>

        {/* ── Right: text content ───────────────────────────────────────── */}
        <div className="w-full lg:w-1/2 flex items-center px-8 py-16 md:px-16 lg:px-20 xl:px-28">
          <div className="max-w-lg">
            {/* Label */}
            <p className="text-xs font-medium tracking-[0.3em] text-neutral-500 uppercase mb-8 md:mb-10">
              About ALOA
            </p>

            {/* Heading */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light tracking-tight text-white leading-[1.05] mb-10 md:mb-12">
              THE AGENTIC<br />FRONTIER
            </h2>

            {/* Pill tags */}
            <div className="flex flex-row flex-wrap gap-3 mb-8 md:mb-10">
              {["Autonomous", "Resilient", "Agentic"].map((tag) => (
                <span
                  key={tag}
                  className="px-5 py-2 rounded-full border border-neutral-700 text-sm text-neutral-300 hover:border-neutral-500 transition-colors cursor-default"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Paragraph */}
            <p className="text-sm md:text-base text-neutral-400 leading-relaxed max-w-md mb-10 md:mb-12">
              ALOA bridges human intent with autonomous system-level execution — reading your
              commands, reasoning across a resilient multi-model backbone, and acting directly
              on your machine.
            </p>

            {/* Actions */}
            <div className="flex flex-row items-center gap-5">
              <Link
                href="/docs"
                className="bg-neutral-800 text-white text-sm font-medium rounded px-7 py-3.5 hover:bg-neutral-700 transition-colors duration-200"
              >
                Learn More
              </Link>

              <button
                onClick={() => setIsDemoOpen(true)}
                className="flex flex-row items-center gap-3 text-sm text-neutral-300 hover:text-white transition-colors group"
              >
                <span className="w-10 h-10 rounded-full border border-neutral-600 flex items-center justify-center group-hover:border-neutral-400 group-hover:bg-white/5 transition-all duration-200">
                  <Play size={14} className="ml-0.5" />
                </span>
                Watch a Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Full-screen 4K Demo Modal */}
      <VideoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        src="/videos/4K ALOA V3.mp4"
      />
    </>
  );
}
