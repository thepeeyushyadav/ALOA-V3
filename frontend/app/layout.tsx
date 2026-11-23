import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: "ALOA V3 — Autonomous Agent for Your Laptop",
  description:
    "ALOA V3 is an autonomous AI agent that reads your commands, reasons through a resilient multi-model backbone, and executes directly on your machine.",
  keywords: [
    "ALOA",
    "autonomous agent",
    "AI",
    "Groq",
    "Gemini",
    "OpenRouter",
    "Bedrock",
  ],
  openGraph: {
    title: "ALOA V3 — Autonomous Agent for Your Laptop",
    description:
      "ALOA bridges human intent with autonomous system-level execution — reading your commands, reasoning across a resilient multi-model backbone, and acting directly on your machine.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-black" suppressHydrationWarning>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
