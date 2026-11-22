import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HowItWorksPage from "@/components/how-it-works/HowItWorksPage";

export const metadata: Metadata = {
  title: "How It Works — ALOA V3",
  description:
    "The architecture behind ALOA V3 — how the AI backbone, local agent, and ten modules work together to run your laptop autonomously.",
};

export default function HowItWorks() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white selection:bg-sky-400/20 selection:text-white">
      <div className="sticky top-0 z-50">
        <Navbar variant="dark" />
      </div>
      <HowItWorksPage />
      <Footer />
    </main>
  );
}
