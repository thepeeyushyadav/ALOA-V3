"use client";

/**
 * /frontend/components/features-hub/FeaturesCatalog.tsx
 *
 * Dedicated Modules Catalog & Capabilities Matrix for the /features page.
 * Replaces the redundant DocsSection dump with an interactive, categorized showcase.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
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
  Search,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Check,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { FEATURES } from "@/lib/features-data";
import { EASE } from "@/lib/motion";

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

const CATEGORIES = [
  "All",
  "System",
  "Productivity",
  "Debugging",
  "Deployment",
  "Career",
  "Intelligence",
] as const;

export default function FeaturesCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredFeatures = useMemo(() => {
    return FEATURES.filter((f) => {
      const matchesCategory =
        selectedCategory === "All" || f.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        f.fullName.toLowerCase().includes(q) ||
        f.tagline.toLowerCase().includes(q) ||
        f.summary.toLowerCase().includes(q) ||
        f.tech.some((t) => t.toLowerCase().includes(q)) ||
        f.capabilities.some(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.body.toLowerCase().includes(q),
        );

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section
      id="catalog"
      className="bg-[#0A0A0A] py-28 md:py-36 border-t border-white/[0.04]"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-neutral-500">
              Module Directory
            </span>
            <div className="h-px w-12 bg-white/20" />
          </div>
          <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight">
            Complete autonomous module suite.
          </h2>
          <p className="text-neutral-400 font-light mt-4 text-base md:text-lg leading-relaxed">
            Ten distinct autonomous capabilities designed for your desktop
            workflow. Explore each module&apos;s capabilities, underlying
            engine, and launch readiness.
          </p>
        </div>

        {/* Filter Bar: Category Tabs + Search Input */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pb-8 border-b border-white/[0.06]">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => {
              const count =
                cat === "All"
                  ? FEATURES.length
                  : FEATURES.filter((f) => f.category === cat).length;
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                    isSelected
                      ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                      : "bg-white/[0.03] text-neutral-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? "bg-black/10 text-black font-semibold"
                        : "bg-white/[0.08] text-neutral-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search modules or tech..."
              className="w-full rounded-full py-2 pl-4 pr-10 text-xs bg-white/[0.03] border border-white/10 text-neutral-300 placeholder:text-neutral-500 focus:outline-none focus:border-sky-400/50 transition-colors"
            />
            <Search
              size={14}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
            />
          </div>
        </div>

        {/* Features Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredFeatures.map((feature, idx) => {
              const Icon = ICON_MAP[feature.icon] ?? AppWindow;

              return (
                <motion.div
                  key={feature.slug}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.4, ease: EASE, delay: idx * 0.04 }}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.035] p-7 flex flex-col justify-between transition-all duration-300 hover:border-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.6)] group"
                >
                  <div>
                    {/* Top Row: Index + Icon + Category Badge */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-sky-400 group-hover:border-sky-400/40 group-hover:shadow-[0_0_15px_rgba(56,189,248,0.2)] transition-all duration-300">
                          <Icon size={22} strokeWidth={1.75} />
                        </div>
                        <div>
                          <span className="text-[11px] font-mono text-neutral-500">
                            MODULE {feature.index}
                          </span>
                          <span className="text-xs font-medium text-neutral-300 block">
                            {feature.category}
                          </span>
                        </div>
                      </div>

                      {feature.available ? (
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live in UI
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400">
                          Core Engine Ready
                        </span>
                      )}
                    </div>

                    {/* Title & Tagline */}
                    <h3 className="text-xl font-medium text-white mb-2 group-hover:text-sky-300 transition-colors">
                      {feature.fullName}
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed font-light mb-6">
                      {feature.summary}
                    </p>

                    {/* 3 Highlights */}
                    <div className="space-y-2 mb-6 pt-4 border-t border-white/[0.04]">
                      {feature.highlights.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 text-xs text-neutral-300 font-light"
                        >
                          <Check
                            size={13}
                            className="text-sky-400 shrink-0 mt-0.5"
                          />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom: Tech Stack Pills + Action Links */}
                  <div className="pt-6 border-t border-white/[0.04] space-y-4">
                    <div className="flex flex-wrap gap-1.5">
                      {feature.tech.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-neutral-400"
                        >
                          {t}
                        </span>
                      ))}
                      {feature.tech.length > 4 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-neutral-500 font-mono">
                          +{feature.tech.length - 4}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Link
                        href={`/docs#doc-${feature.slug}`}
                        className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        Technical Docs
                        <ArrowRight size={12} />
                      </Link>

                      {feature.available ? (
                        <Link
                          href={`/get-started/${feature.slug}`}
                          className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                        >
                          Launch Studio
                          <ExternalLink size={12} />
                        </Link>
                      ) : (
                        <Link
                          href={`/docs#doc-${feature.slug}`}
                          className="text-[11px] font-mono text-neutral-500 hover:text-neutral-400"
                        >
                          CLI / Python Ready
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredFeatures.length === 0 && (
          <div className="text-center py-20 rounded-2xl border border-white/[0.06] bg-white/[0.01]">
            <p className="text-neutral-400 text-sm">
              No modules found matching &ldquo;{searchQuery}&rdquo; in category{" "}
              {selectedCategory}.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="mt-4 text-xs text-sky-400 hover:underline"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* ── Architecture & Capability Comparison Matrix ── */}
        <div className="mt-24 pt-16 border-t border-white/[0.06]">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-neutral-500 block mb-2">
              Deep Comparison
            </span>
            <h3 className="text-2xl md:text-3xl font-light text-white tracking-tight">
              Module Execution &amp; Safety Matrix
            </h3>
            <p className="text-sm text-neutral-400 font-light mt-2 leading-relaxed">
              Every ALOA module follows strict safety boundaries. Irreversible
              actions require your explicit permission before execution.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-white/[0.015]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.08] bg-white/[0.03] text-neutral-300 font-medium">
                <tr>
                  <th className="py-3.5 px-5">Module</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Primary Engine</th>
                  <th className="py-3.5 px-4">Execution Target</th>
                  <th className="py-3.5 px-4">Human Approval</th>
                  <th className="py-3.5 px-5 text-right">Docs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-neutral-400 font-light">
                {FEATURES.map((f) => (
                  <tr
                    key={f.slug}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 px-5 font-medium text-white flex items-center gap-2.5">
                      <span className="font-mono text-sky-400 text-[11px]">
                        {f.index}
                      </span>
                      <span>{f.fullName}</span>
                    </td>
                    <td className="py-4 px-4">{f.category}</td>
                    <td className="py-4 px-4 font-mono text-neutral-300 text-[11px]">
                      {f.tech[0]} / {f.tech[f.tech.length - 1]}
                    </td>
                    <td className="py-4 px-4">
                      {f.category === "Deployment" || f.slug === "cloud-healer"
                        ? "Cloud / GitHub API"
                        : "Local Windows OS"}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 text-emerald-400/90 text-[11px]">
                        <ShieldCheck size={13} className="text-emerald-400" />
                        Mandatory
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Link
                        href={`/docs#doc-${f.slug}`}
                        className="text-sky-400 hover:text-sky-300 font-mono text-[11px] inline-flex items-center gap-1"
                      >
                        Read
                        <ArrowRight size={10} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="mt-16 p-8 md:p-12 rounded-3xl border border-white/[0.08] bg-gradient-to-r from-sky-950/20 via-white/[0.02] to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-400/10 border border-sky-400/20 text-sky-400 text-xs font-mono mb-3">
              <Sparkles size={12} />
              <span>Full Technical Specifications</span>
            </div>
            <h4 className="text-xl md:text-2xl font-light text-white tracking-tight">
              Need deep technical architecture and API contracts?
            </h4>
            <p className="text-sm text-neutral-400 font-light mt-1 max-w-xl">
              Visit our comprehensive documentation page for line-by-line
              breakdown of how every module operates.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/docs"
              className="px-6 py-3 rounded-full bg-white text-black font-medium text-xs hover:scale-[1.03] transition-transform duration-200"
            >
              Open Full Docs
            </Link>
            <Link
              href="/how-it-works"
              className="px-6 py-3 rounded-full border border-white/15 text-white font-medium text-xs hover:border-white/30 transition-colors"
            >
              Architecture Tour
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
