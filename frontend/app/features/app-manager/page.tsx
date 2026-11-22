"use client";

/**
 * /frontend/app/features/app-manager/page.tsx
 *
 * Feature Module 01: App Manager
 * Full interactive documentation and live terminal simulation console.
 */

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeatureHeader from "@/components/features/FeatureHeader";
import DocSection from "@/components/features/DocSection";
import CommandConsole from "@/components/features/CommandConsole";

export default function AppManagerPage() {
  const [selectedExample, setSelectedExample] = useState("");

  const handleSelectExample = (cmd: string) => {
    setSelectedExample(cmd);
    const consoleEl = document.getElementById("console");
    if (consoleEl) {
      consoleEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white flex flex-col selection:bg-indigo-500/30 selection:text-white">
      {/* Navbar with dark styling */}
      <div className="border-b border-neutral-900 bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-50">
        <Navbar />
      </div>

      {/* Feature Hero Header */}
      <FeatureHeader
        moduleNumber="01"
        badge="System Automation"
        title="App Manager"
        tagline="Install, launch, update, and manage Windows apps using natural language."
        description="Bypasses manual browser searches, deceptive download portals, and command-line package flags. ALOA interprets your intent, verifies package integrity via Windows Winget, and safely executes commands with explicit user confirmation."
        provider="DualModelChain: Groq Llama-3.3-70b (Primary) • Gemini 1.5 Pro (Fallback)"
        consoleAnchorId="console"
        docsAnchorId="docs"
      />

      {/* Interactive Command Console Section */}
      <CommandConsole initialCommand={selectedExample} />

      {/* Documentation & Specifications Section */}
      <DocSection onSelectExample={handleSelectExample} />

      {/* Footer */}
      <Footer />
    </main>
  );
}
