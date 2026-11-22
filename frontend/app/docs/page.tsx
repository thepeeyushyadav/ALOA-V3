import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DocsHero from "@/components/features-hub/DocsHero";
import DocsSection from "@/components/features-hub/DocsSection";
import HashScroller from "@/components/features-hub/HashScroller";

export const metadata: Metadata = {
  title: "Documentation — ALOA V3",
  description:
    "How each ALOA V3 module works, what it needs from you, and how it keeps you in control.",
};

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white selection:bg-sky-400/20 selection:text-white">
      {/* Navbar with dark styling */}
      <div className="sticky top-0 z-50">
        <Navbar variant="dark" />
      </div>

      {/* Documentation Hero — compact, calm, no wheel, no CTA */}
      <DocsHero />

      {/* Full Documentation Section (no StartBlock) */}
      <DocsSection showStart={false} />

      {/* Footer */}
      <Footer />

      {/* Scroll to hash on hard refresh (e.g. /docs#doc-code-healer) */}
      <HashScroller />
    </main>
  );
}
