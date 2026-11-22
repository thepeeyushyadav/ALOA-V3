import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeaturesHero from "@/components/features-hub/FeaturesHero";
import FeatureExplorer from "@/components/features-hub/FeatureExplorer";

export const metadata: Metadata = {
  title: "Get Started — ALOA V3",
  description:
    "Explore and launch the 10 ALOA V3 modules. The only place where modules can be started.",
};

export default function GetStartedPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white selection:bg-sky-400/20 selection:text-white">
      {/* Navbar with dark styling */}
      <div className="sticky top-0 z-50">
        <Navbar variant="dark" />
      </div>

      {/* Hero Section */}
      <FeaturesHero />

      {/* OptionWheel Interactive Explorer — the ONLY place Start action exists */}
      <FeatureExplorer />

      {/* Footer */}
      <Footer />
    </main>
  );
}
