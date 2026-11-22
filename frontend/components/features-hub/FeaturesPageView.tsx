"use client";

/**
 * /frontend/components/features-hub/FeaturesPageView.tsx
 *
 * Modern, minimalist SaaS light-mode UI inspired by Untitled UI.
 * Features:
 * - 3D mesh / silk-wave gradient blending cool slate blue (#767F93), deep navy (#282E51),
 *   muted indigo (#4D4B76), and soft lavender/lilac (#9072A3, #B49ABD).
 * - Frosted glass elements (rgba(255, 255, 255, 0.15), backdrop-filter: blur(10px), 1px solid rgba(255, 255, 255, 0.25)).
 * - Clean white background (#FDFDFD) for the main content area.
 * - Grid of white cards with 1px light-grey borders (#EAECF0), rounded corners (12px), subtle hover elevation shadow,
 *   minimal monochrome line icons, and crisp dark-grey/black sans-serif typography.
 * - Centered "Learn more ->" link on all cards (no latency tags).
 * - High-craft, clean light-mode module detail modal with Framer Motion: Architecture Specs, Key Capabilities,
 *   Execution Pipeline, and Double-Lock Safety Guarantee (no dark terminal / image boxes).
 * - 1-month unrestricted free trial FAQ (expanded by default).
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  ChevronUp,
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
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  ShieldCheck,
  HelpCircle,
  LucideIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { FEATURES, type Feature } from "@/lib/features-data";
import { EASE } from "@/lib/motion";

/* ── Icon mapping ───────────────────────────────────────────────────────── */
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

/* ── FAQ Data ───────────────────────────────────────────────────────────── */
interface FAQItem {
  id: string;
  question: string;
  answer: string | React.ReactNode;
}

const FAQS: FAQItem[] = [
  {
    id: "free-trial",
    question: "Is there a free trial available?",
    answer: (
      <div className="space-y-3 text-sm text-[#475467] leading-relaxed font-normal">
        <p>
          Yes! ALOA V3 comes with an unrestricted{" "}
          <strong className="text-gray-900">
            1-month (30-day) full-access free trial
          </strong>{" "}
          for every new user. You can run all 10 autonomous modules—including
          App Manager, System Insights, Code Healer, and Cloud Healer—directly
          on your local machine with zero upfront payment or credit card
          requirement.
        </p>
        <p>
          During the 30-day trial period, you receive full pooled access to our
          multi-model AI routing cluster (Groq for ultra-low latency commands
          and OpenRouter for failover reliability).
        </p>
        <div className="p-4 rounded-[12px] bg-[#F8F9FC] border border-[#EAECF0] text-gray-800 space-y-2 text-xs">
          <p className="font-semibold text-[#101828]">
            After your 1-month trial concludes:
          </p>
          <ul className="space-y-1.5 list-disc list-inside text-[#475467]">
            <li>
              <strong className="text-gray-900">Free Community Tier:</strong>{" "}
              Retain permanent access to essential local desktop tools (App
              Manager, System Insights vitals, and local scripting) using your
              own API keys.
            </li>
            <li>
              <strong className="text-gray-900">ALOA Pro ($19/month):</strong>{" "}
              Continue with unmetered multi-model inference, unlimited Cloud
              Healer debugging sessions, automated CI/CD deployments, and daily
              ALOA Radar briefings.
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "local-privacy",
    question: "How does local execution guarantee my privacy and security?",
    answer: (
      <div className="space-y-2 text-sm text-[#475467] leading-relaxed font-normal">
        <p>
          ALOA operates as a local agent daemon directly on your computer. Your
          files, private code repositories, environment variables, and
          authentication tokens never leave your physical machine.
        </p>
        <p>
          Furthermore, ALOA enforces a strict{" "}
          <strong className="text-gray-900">
            human-in-the-loop double-lock guarantee
          </strong>
          : any irreversible or modifying action—such as installing software,
          deleting temporary junk, terminating processes, or pushing Git
          commits—must receive your explicit manual confirmation before
          execution.
        </p>
      </div>
    ),
  },
  {
    id: "api-keys",
    question: "Do I need to supply my own AI provider API keys?",
    answer: (
      <div className="space-y-2 text-sm text-[#475467] leading-relaxed font-normal">
        <p>
          No personal API keys are required during your 30-day free trial; ALOA
          includes pooled inference credits.
        </p>
        <p>
          If you prefer zero rate limits or want to connect your own enterprise
          models, you can easily plug in your personal keys for Groq, Google
          Gemini, OpenRouter, or AWS Bedrock anytime in your local
          configuration.
        </p>
      </div>
    ),
  },
  {
    id: "os-support",
    question: "Which operating systems and project stacks are supported?",
    answer: (
      <div className="space-y-2 text-sm text-[#475467] leading-relaxed font-normal">
        <p>
          ALOA V3 is natively optimized for{" "}
          <strong className="text-gray-900">Windows 10 and Windows 11</strong>,
          utilizing direct Winget package management, PowerShell automation, and
          Win32 hardware sensors.
        </p>
        <p>
          Core developer capabilities—such as Code Healer, Cloud Healer, YouTube
          Notes, and Resume Engine—are fully cross-platform and work seamlessly
          across Windows, macOS, and Linux.
        </p>
      </div>
    ),
  },
  {
    id: "modular-independence",
    question: "Can I use specific modules without enabling the entire agent?",
    answer: (
      <div className="space-y-2 text-sm text-[#475467] leading-relaxed font-normal">
        <p>
          Yes, all 10 modules are completely decoupled. You can invoke a single
          capability—such as diagnosing a crashing dev server with Code Healer,
          generating study notes with YouTube Notes, or marking an attendance
          sheet with Attendance Automator—without keeping any background
          watchers or other modules active.
        </p>
      </div>
    ),
  },
];

/* ── Component ──────────────────────────────────────────────────────────── */
export default function FeaturesPageView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqId, setOpenFaqId] = useState<string | null>("free-trial");
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  // Filter modules based on search query
  const filteredFeatures = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return FEATURES;
    return FEATURES.filter((f) => {
      return (
        f.fullName.toLowerCase().includes(q) ||
        f.tagline.toLowerCase().includes(q) ||
        f.summary.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.tech.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  const handleSelectFeature = (feature: Feature) => {
    setSelectedFeature(feature);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 selection:bg-[#4D4B76] selection:text-white flex flex-col justify-between">
      <div>
        {/* ── TOP HERO CONTAINER (Untitled UI inspired 3D mesh / silk-wave gradient banner) ── */}
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4">
          <div className="relative rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-sm border border-gray-200/60">
            {/* ── Abstract 3D mesh / silk-wave gradient background ── */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: "#282E51",
                backgroundImage:
                  "linear-gradient(135deg, #282E51 0%, #3B3861 20%, #4D4B76 42%, #767F93 68%, #9072A3 86%, #B49ABD 100%)",
              }}
            >
              {/* Ethereal glowing orbs blending cool slate blue, deep navy, muted indigo, soft lavender & lilac */}
              <div
                className="absolute -top-28 -left-20 w-[540px] h-[540px] rounded-full opacity-70 blur-[90px] pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, #282E51 0%, #4D4B76 65%, transparent 85%)",
                }}
              />
              <div
                className="absolute top-1/4 -right-16 w-[620px] h-[620px] rounded-full opacity-65 blur-[100px] pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, #B49ABD 0%, #9072A3 45%, #767F93 75%, transparent 90%)",
                }}
              />
              <div
                className="absolute -bottom-24 left-1/4 w-[500px] h-[500px] rounded-full opacity-60 blur-[90px] pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, #767F93 0%, #4D4B76 55%, transparent 80%)",
                }}
              />
              <div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[720px] h-[360px] rounded-[100%] opacity-45 blur-[85px] pointer-events-none -rotate-12"
                style={{
                  background:
                    "radial-gradient(ellipse, #9072A3 0%, #B49ABD 45%, transparent 80%)",
                }}
              />

              {/* Flowing silk-wave ribbon SVG overlay for low-contrast 3D wave depth */}
              <svg
                className="absolute inset-0 w-full h-full opacity-30 mix-blend-soft-light pointer-events-none"
                viewBox="0 0 1400 480"
                preserveAspectRatio="none"
                fill="none"
              >
                <path
                  d="M-100,160 C300,320 600,-40 1000,180 C1250,300 1450,120 1600,200 L1600,480 L-100,480 Z"
                  fill="url(#silk-grad-1)"
                />
                <path
                  d="M-100,260 C250,80 650,380 1100,140 C1300,50 1480,240 1600,160 L1600,480 L-100,480 Z"
                  fill="url(#silk-grad-2)"
                />
                <defs>
                  <linearGradient
                    id="silk-grad-1"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#4D4B76" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#767F93" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="#B49ABD" stopOpacity="0.9" />
                  </linearGradient>
                  <linearGradient
                    id="silk-grad-2"
                    x1="100%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#9072A3" stopOpacity="0.75" />
                    <stop offset="60%" stopColor="#767F93" stopOpacity="0.55" />
                    <stop
                      offset="100%"
                      stopColor="#282E51"
                      stopOpacity="0.85"
                    />
                  </linearGradient>
                </defs>
              </svg>

              {/* Subtle fine mesh stipple texture overlay */}
              <div
                className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
            </div>

            {/* ── Top Bar: Back to Home (Glassmorphic) ── */}
            <div className="relative z-20 px-6 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between">
              <Link
                href="/"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                }}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-white hover:bg-[rgba(255,255,255,0.22)] px-4 py-2 rounded-full transition-all duration-200 group shadow-sm"
              >
                <ArrowLeft
                  size={15}
                  className="group-hover:-translate-x-0.5 transition-transform"
                />
                <span>Back to Home</span>
              </Link>
            </div>

            {/* ── Hero Center Content ── */}
            <div className="relative z-10 px-6 pt-12 pb-20 sm:pt-16 sm:pb-24 text-center max-w-3xl mx-auto">
              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="text-3xl sm:text-5xl md:text-6xl font-semibold text-white tracking-tight leading-[1.08]"
              >
                Features &amp; Modules
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
                className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-white/85 font-normal max-w-2xl mx-auto leading-relaxed"
              >
                Explore the 10 autonomous capabilities built into ALOA V3. Run
                software management, code debugging, and cloud operations
                without your data leaving your laptop.
              </motion.p>

              {/* ── Search Bar: Untitled UI frosted glass input ── */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.2 }}
                className="mt-8 sm:mt-10 max-w-xl mx-auto relative"
              >
                <div className="relative flex items-center">
                  <Search
                    size={18}
                    className="absolute left-4 sm:left-5 text-white/80 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search modules, capabilities, or tech stack..."
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                    }}
                    className="w-full rounded-full py-3 sm:py-3.5 pl-11 sm:pl-12 pr-10 text-sm sm:text-base text-white placeholder-white/70 shadow-lg focus:outline-none focus:bg-[rgba(255,255,255,0.25)] focus:border-[rgba(255,255,255,0.45)] transition-all duration-200"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 text-white/75 hover:text-white transition-colors"
                      aria-label="Clear search"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: Quickfind MODULES (Clean white background #FDFDFD) ── */}
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#101828] tracking-tight">
                Quickfind modules
              </h2>
              <p className="text-sm text-[#475467] mt-1 font-normal">
                Click any module card to inspect architecture, capabilities, or
                open documentation.
              </p>
            </div>
            {searchQuery && (
              <span className="text-xs font-mono text-[#4D4B76] bg-[#F8F9FC] border border-[#EAECF0] px-3 py-1 rounded-full self-start sm:self-auto font-medium">
                Showing {filteredFeatures.length} of {FEATURES.length} modules
              </span>
            )}
          </div>

          {/* ── 4-Column Grid of Clean White Cards (Untitled UI specification: 12px rounded, 1px border) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <AnimatePresence mode="popLayout">
              {filteredFeatures.map((feature, idx) => {
                const Icon = ICON_MAP[feature.icon] ?? AppWindow;

                return (
                  <motion.div
                    key={feature.slug}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{
                      y: -4,
                      transition: { duration: 0.18, ease: EASE },
                    }}
                    transition={{
                      duration: 0.35,
                      ease: EASE,
                      delay: idx * 0.03,
                    }}
                    onClick={() => handleSelectFeature(feature)}
                    className="group relative bg-gradient-to-b from-[#FAF9FD]/80 via-white to-white border border-[#E9E6F2] rounded-[16px] p-6 text-center flex flex-col items-center justify-between cursor-pointer transition-all duration-300 hover:shadow-[0_12px_30px_-6px_rgba(77,75,118,0.15),0_4px_12px_-2px_rgba(144,114,163,0.10)] hover:border-[#B49ABD]/70 overflow-hidden"
                  >
                    {/* Ambient soft glow on hover matching hero theme */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#9072A3]/0 via-transparent to-[#4D4B76]/0 group-hover:from-[#9072A3]/[0.04] group-hover:to-[#4D4B76]/[0.05] pointer-events-none transition-all duration-300" />

                    {/* Top accent line matching hero silk wave gradient */}
                    <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#9072A3]/0 to-transparent group-hover:via-[#9072A3] transition-all duration-300" />

                    {/* Top part: Themed Icon Container + Title + Description */}
                    <div className="flex flex-col items-center w-full relative z-10">
                      {/* Icon container: Soft frosted lilac/slate tint, transforms into deep gradient on hover */}
                      <div className="w-12 h-12 rounded-[13px] bg-gradient-to-br from-[#F4F3F8] via-[#EDEAF4] to-[#E5E0EF] border border-[#B49ABD]/35 flex items-center justify-center text-[#4D4B76] group-hover:bg-gradient-to-br group-hover:from-[#282E51] group-hover:via-[#4D4B76] group-hover:to-[#9072A3] group-hover:text-white group-hover:border-transparent group-hover:shadow-[0_4px_16px_rgba(77,75,118,0.25)] transition-all duration-300 mb-4">
                        <Icon
                          size={21}
                          strokeWidth={1.8}
                          className="transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-[#101828] text-base group-hover:text-[#282E51] transition-colors">
                        {feature.fullName}
                      </h3>

                      {/* Short 2-line summary */}
                      <p className="text-xs sm:text-sm text-[#475467] group-hover:text-[#344054] leading-relaxed font-normal mt-2 line-clamp-2">
                        {feature.summary}
                      </p>
                    </div>

                    {/* Bottom part: Clean centered Learn more link with theme styling */}
                    <div className="mt-5 pt-3.5 border-t border-[#F0EDF6] group-hover:border-[#B49ABD]/30 w-full flex items-center justify-center transition-colors relative z-10">
                      <div className="text-xs font-semibold text-[#4D4B76] group-hover:text-[#282E51] inline-flex items-center gap-1.5 group-hover:translate-x-0.5 transition-all">
                        <span>Learn more</span>
                        <ArrowRight
                          size={13}
                          className="text-[#9072A3] group-hover:text-[#282E51] transition-colors"
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredFeatures.length === 0 && (
            <div className="text-center py-16 bg-white rounded-[12px] border border-[#EAECF0] shadow-xs">
              <HelpCircle className="mx-auto text-gray-400 mb-3" size={32} />
              <h3 className="text-base font-semibold text-[#101828]">
                No matching modules found
              </h3>
              <p className="text-sm text-[#475467] mt-1 max-w-sm mx-auto font-normal">
                We couldn&apos;t find any module matching &ldquo;{searchQuery}
                &rdquo;. Try searching for general terms like &ldquo;git&rdquo;,
                &ldquo;health&rdquo;, or &ldquo;pdf&rdquo;.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 px-4 py-2 text-xs font-medium bg-[#101828] text-white rounded-full hover:bg-black transition-colors"
              >
                Clear search
              </button>
            </div>
          )}
        </section>

        {/* ── SECTION 2: GENERAL FAQS (Untitled UI specification) ── */}
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
          <div className="max-w-4xl">
            {/* Header */}
            <div className="mb-10">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#101828] tracking-tight">
                General FAQs
              </h2>
              <p className="text-sm sm:text-base text-[#475467] mt-2 font-normal">
                Everything you need to know about the 1-month free trial, local
                execution privacy, and pro tiers.
              </p>
            </div>

            {/* Accordion list */}
            <div className="divide-y divide-[#EAECF0] border-t border-b border-[#EAECF0]">
              {FAQS.map((faq) => {
                const isOpen = openFaqId === faq.id;

                return (
                  <div key={faq.id} className="py-5 sm:py-6 transition-colors">
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-start justify-between text-left gap-4 focus:outline-none group"
                      aria-expanded={isOpen}
                    >
                      <span className="text-base sm:text-lg font-medium text-[#101828] group-hover:text-[#282E51] transition-colors">
                        {faq.question}
                      </span>
                      <span className="mt-1 flex items-center justify-center w-6 h-6 rounded-full border border-[#EAECF0] text-[#667085] group-hover:border-[#D0D5DD] group-hover:text-[#101828] transition-colors shrink-0">
                        {isOpen ? (
                          <ChevronUp size={15} />
                        ) : (
                          <ChevronDown size={15} />
                        )}
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: EASE }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 pr-6 sm:pr-12">{faq.answer}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── HIGH-CRAFT PEAK DETAIL MODAL (Matching Image 3 with Theme Palette) ── */}
        <AnimatePresence>
          {selectedFeature && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/45 backdrop-blur-sm cursor-pointer"
              onClick={() => setSelectedFeature(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-[22px] max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#E8E5F2] relative max-h-[92vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden cursor-default flex flex-col justify-between overflow-hidden"
              >
                {/* Top Silk Gradient Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#282E51] via-[#4D4B76] via-[#767F93] to-[#B49ABD]" />

                {/* Close Button */}
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-900 hover:bg-[#F4F3F8] transition-all duration-150"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>

                <div>
                  {/* Title & Subtitle */}
                  <h3 className="text-2xl sm:text-[28px] font-bold text-[#101828] pr-10 tracking-tight">
                    {selectedFeature.fullName}
                  </h3>
                  <p className="text-sm text-[#475467] mt-1 font-normal leading-relaxed max-w-xl">
                    {selectedFeature.tagline}
                  </p>

                  {/* ── OVERVIEW ── */}
                  <div className="mt-6">
                    <p className="text-[11px] font-semibold text-[#767F93] uppercase tracking-wider mb-2">
                      OVERVIEW
                    </p>
                    <p className="text-sm text-[#344054] font-normal leading-relaxed">
                      {selectedFeature.overview}
                    </p>
                  </div>

                  {/* ── KEY CAPABILITIES (4 Themed Cards) ── */}
                  <div className="mt-6">
                    <p className="text-[11px] font-semibold text-[#767F93] uppercase tracking-wider mb-3">
                      KEY CAPABILITIES
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedFeature.capabilities.map((cap, i) => (
                        <motion.div
                          key={i}
                          whileHover={{ y: -2 }}
                          transition={{ duration: 0.15 }}
                          className="p-4 rounded-[13px] bg-gradient-to-br from-[#FAF9FD] via-[#F6F4FA]/60 to-[#EFEBF6]/40 border border-[#E7E3F1] hover:border-[#9072A3]/50 hover:bg-white hover:shadow-[0_4px_18px_-2px_rgba(77,75,118,0.12)] transition-all text-left group/cap"
                        >
                          <h4 className="font-semibold text-[#101828] text-sm group-hover/cap:text-[#282E51] transition-colors mb-1">
                            {cap.title}
                          </h4>
                          <p className="text-xs text-[#475467] font-normal leading-relaxed">
                            {cap.body}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* ── SAFETY & CONTROL (Emerald + Themed Alert Card) ── */}
                  <div className="mt-5 p-4 rounded-[13px] bg-gradient-to-r from-[#ECFDF3] to-[#F5F4FA] border border-[#A6F4C5]/80 flex items-start gap-3">
                    <ShieldCheck
                      size={18}
                      className="text-[#039855] shrink-0 mt-0.5"
                    />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-[#027A48]">
                        Safety &amp; Control
                      </p>
                      <p className="text-xs text-[#05603A] font-normal leading-relaxed mt-0.5">
                        {selectedFeature.safety}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── ACTIONS FOOTER ── */}
                <div className="mt-7 pt-5 border-t border-[#EAE7F2] flex items-center justify-between">
                  <Link
                    href={`/docs#doc-${selectedFeature.slug}`}
                    className="text-xs font-semibold text-[#4D4B76] hover:text-[#282E51] inline-flex items-center gap-1.5 transition-colors group"
                  >
                    <span>View full documentation</span>
                    <ArrowRight
                      size={13}
                      className="text-[#9072A3] group-hover:text-[#282E51] group-hover:translate-x-0.5 transition-all"
                    />
                  </Link>

                  <button
                    onClick={() => setSelectedFeature(null)}
                    className="text-xs font-semibold text-[#282E51] bg-[#F4F3F8] hover:bg-[#EAE6F4] border border-[#E2DFED] px-5 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── FLOATING HELP PILL (matching bottom-right Untitled UI widget) ── */}
        <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40">
          <Link
            href="/docs"
            aria-label="Open Documentation"
            className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#101828] text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-200 group relative border border-white/10"
          >
            <MessageSquare size={19} className="text-white" />
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
              Read Documentation
            </span>
          </Link>
        </div>
      </div>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
