"use client";

import Navbar from "@/components/Navbar";
import HeroSection, { HeroVideoPlaceholder } from "@/components/HeroSection";
import SectionDivider from "@/components/SectionDivider";
import AboutSection from "@/components/AboutSection";
import ModulesSection from "@/components/ModulesSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="bg-black">
      {/* ──────────────────────────────────────────────────────────────────
          SECTION 1: HERO
          Relative wrapper that contains all background layers + content
      ────────────────────────────────────────────────────────────────── */}
      <div className="app-hero-wrapper relative">
        {/* z-0: Solid fill background */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "#FBFDFD", zIndex: 0 }}
        />

        {/* z-1: Hero background video (men.mp4) — right side on desktop,
            full width on mobile at opacity-30.
            TODO: swap src if video asset changes. */}
        <div
          className="absolute right-0 top-0 bottom-0 w-full md:w-[55%] h-full opacity-30 md:opacity-100"
          style={{ zIndex: 1 }}
        >
          <HeroVideoPlaceholder />
        </div>

        {/* z-2: Content layer (Navbar + HeroSection) */}
        <div
          className="relative min-h-screen md:h-screen flex flex-col"
          style={{ zIndex: 2 }}
        >
          <Navbar />
          <HeroSection />
        </div>

        {/* z-3: Diagonal SVG divider — INSIDE hero wrapper, absolute bottom */}
        <SectionDivider />
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          SECTION 2: ABOUT
      ────────────────────────────────────────────────────────────────── */}
      <AboutSection />

      {/* ──────────────────────────────────────────────────────────────────
          SECTION 3: MODULES
      ────────────────────────────────────────────────────────────────── */}
      <ModulesSection />

      {/* ──────────────────────────────────────────────────────────────────
          SECTION 4: CTA
      ────────────────────────────────────────────────────────────────── */}
      <CTASection />

      {/* ──────────────────────────────────────────────────────────────────
          SECTION 5: FOOTER
      ────────────────────────────────────────────────────────────────── */}
      <Footer />
    </main>
  );
}
