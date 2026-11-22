"use client";

/**
 * /frontend/components/features-hub/DocsSection.tsx
 *
 * Full documentation section housing DocsSidebar, GettingStarted, and all 10 ModuleDoc entries.
 */

import DocsSidebar from "./DocsSidebar";
import GettingStarted from "./GettingStarted";
import ModuleDoc from "./ModuleDoc";
import { FEATURES } from "@/lib/features-data";
import { useActiveSection } from "@/hooks/useActiveSection";

export interface DocsSectionProps {
  showStart?: boolean;
}

export default function DocsSection({ showStart = true }: DocsSectionProps) {
  const sectionIds = [
    "doc-getting-started",
    ...FEATURES.map((f) => `doc-${f.slug}`),
  ];

  const activeId = useActiveSection(sectionIds, "doc-getting-started");

  return (
    <section id="docs" className="scroll-mt-20 bg-[#0F0F0F] relative py-28 md:py-36">
      {/* 1px gradient top line */}
      <div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Layout Grid: Sidebar + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-12 lg:gap-16 items-start">
          {/* DocsSidebar (sticky desktop + horizontal mobile) */}
          <DocsSidebar activeId={activeId} />

          {/* Main Content Column */}
          <div className="max-w-3xl w-full">
            {/* Getting Started Overview */}
            <GettingStarted />

            {/* All 10 Module Docs */}
            {FEATURES.map((feature) => (
              <ModuleDoc key={feature.slug} feature={feature} showStart={showStart} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
