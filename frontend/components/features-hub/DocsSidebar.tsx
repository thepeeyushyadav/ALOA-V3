"use client";

/**
 * /frontend/components/features-hub/DocsSidebar.tsx
 *
 * Sticky side navigation for desktop and horizontal pill bar for mobile.
 * Features scroll-spy and animated glide indicator via layoutId.
 */

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FEATURES } from "@/lib/features-data";

export interface DocsSidebarProps {
  activeId: string;
}

export default function DocsSidebar({ activeId }: DocsSidebarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: "doc-getting-started", label: "Getting started" },
    ...FEATURES.map((f) => ({
      id: `doc-${f.slug}`,
      label: `${f.index} ${f.shortName}`,
    })),
  ];

  // Auto-center active pill on mobile horizontally scrollable bar
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const activeEl = scrollContainerRef.current.querySelector(
      `[data-id="${activeId}"]`
    ) as HTMLElement | null;

    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeId]);

  return (
    <>
      {/* ── Mobile Horizontal Pill Bar (<1024px) ── */}
      <div className="lg:hidden sticky top-[64px] z-40 w-full bg-[#0F0F0F]/85 backdrop-blur-md border-b border-white/[0.06] py-3 px-4">
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth"
        >
          {navItems.map((item) => {
            const isActive = activeId === item.id;

            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                data-id={item.id}
                className={`relative px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors duration-200 shrink-0 ${
                  isActive
                    ? "text-white bg-white/[0.08] font-medium"
                    : "text-neutral-400 hover:text-neutral-200 bg-white/[0.02]"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-doc-active-pill"
                    className="absolute inset-0 rounded-full border border-sky-400/40"
                    transition={{ duration: 0.3 }}
                  />
                )}
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* ── Desktop Sticky Sidebar (≥1024px) ── */}
      <aside className="hidden lg:block sticky top-28 self-start w-60 shrink-0">
        <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-neutral-500 block mb-6">
          On this page
        </span>

        <nav className="space-y-1 relative">
          {navItems.map((item) => {
            const isActive = activeId === item.id;

            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`group relative flex items-center py-1.5 px-3 rounded-lg text-xs transition-colors duration-200 ${
                  isActive
                    ? "text-white font-medium"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {/* 1px accent bar that glides via framer layoutId */}
                {isActive && (
                  <motion.div
                    layoutId="desktop-doc-glide-bar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                    transition={{ duration: 0.3 }}
                  />
                )}
                <span className="truncate">{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
