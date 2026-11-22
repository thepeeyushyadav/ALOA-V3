"use client";

/**
 * /frontend/components/pricing/PricingPageView.tsx
 *
 * World-class SaaS Pricing Section & Page inspired by Untitled UI.
 * Features:
 * - 3D mesh / silk-wave gradient banner matching /features (#282E51, #4D4B76, #767F93, #9072A3, #B49ABD).
 * - Frosted glass elements (rgba(255, 255, 255, 0.15) with backdrop-filter: blur(10px)).
 * - Interactive Duration Switcher: 1 Month ($9), 3 Months ($21), 6 Months ($41), 1 Year ($89).
 * - Magic UI GlareHover interactive cards with Glare spotlight sweep.
 * - Comprehensive Free vs Pro comparison and detailed FAQ accordion.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GlareHover } from "@/registry/magicui/glare-hover";
import { EASE } from "@/lib/motion";

/* ── Billing Cycle Configuration ────────────────────────────────────────── */
export type BillingDuration = "1m" | "3m" | "6m" | "1y";

export interface PlanCycle {
  id: BillingDuration;
  label: string;
  badge?: string;
  totalPrice: number;
  periodText: string;
  perMonthText: string;
  savingsText?: string;
  popular?: boolean;
}

export const BILLING_CYCLES: Record<BillingDuration, PlanCycle> = {
  "1m": {
    id: "1m",
    label: "1 Month",
    totalPrice: 9,
    periodText: "/mo",
    perMonthText: "$9 / month",
    savingsText: "Flexible monthly",
  },
  "3m": {
    id: "3m",
    label: "3 Months",
    badge: "Most Popular",
    totalPrice: 21,
    periodText: "for 3 months",
    perMonthText: "$7.00 / mo",
    savingsText: "Save 22%",
    popular: true,
  },
  "6m": {
    id: "6m",
    label: "6 Months",
    totalPrice: 41,
    periodText: "for 6 months",
    perMonthText: "$6.83 / mo",
    savingsText: "Save 24%",
  },
  "1y": {
    id: "1y",
    label: "1 Year",
    badge: "Best Value",
    totalPrice: 89,
    periodText: "for 1 year",
    perMonthText: "$7.41 / mo",
    savingsText: "Save big on annual",
    popular: true,
  },
};

/* ── Pricing FAQs ───────────────────────────────────────────────────────── */
interface PricingFAQ {
  id: string;
  question: string;
  answer: string | React.ReactNode;
}

const PRICING_FAQS: PricingFAQ[] = [
  {
    id: "trial-details",
    question: "How does the 30-day unrestricted free trial work?",
    answer: (
      <p className="text-sm text-[#475467] leading-relaxed">
        Every new user receives 30 days of full, unrestricted access to ALOA V3
        and all 10 autonomous modules—including App Manager, System Insights,
        Code Healer, and Cloud Healer. No credit card or upfront payment is
        required to start.
      </p>
    ),
  },
  {
    id: "billing-durations",
    question: "What pricing durations are available?",
    answer: (
      <div className="space-y-2 text-sm text-[#475467] leading-relaxed">
        <p>You can choose from four flexible duration plans:</p>
        <ul className="list-disc list-inside space-y-1 font-medium text-gray-800">
          <li>
            <strong>1 Month:</strong> $9 per month (flexible, cancel anytime)
          </li>
          <li>
            <strong>3 Months:</strong> $21 total (~$7/month, Save 22%)
          </li>
          <li>
            <strong>6 Months:</strong> $41 total (~$6.83/month, Save 24%)
          </li>
          <li>
            <strong>1 Year:</strong> $89 total (~$7.41/month, Best Value)
          </li>
        </ul>
        <p className="pt-1">
          All paid plans include unmetered multi-model inference through Groq
          Llama 3.3 70B with OpenRouter failover.
        </p>
      </div>
    ),
  },
  {
    id: "after-trial",
    question: "What happens after my subscription or trial ends?",
    answer: (
      <p className="text-sm text-[#475467] leading-relaxed">
        If you choose not to renew, your account smoothly drops to the permanent
        <strong> Free Community Tier</strong>. You retain full access to local
        desktop tools (App Manager, System Insights vitals, and local scripting)
        using your own free API keys forever. Your local settings and files are
        never locked or deleted.
      </p>
    ),
  },
  {
    id: "privacy-guarantee",
    question: "Does ALOA send my code or system data to any remote server?",
    answer: (
      <p className="text-sm text-[#475467] leading-relaxed">
        No. ALOA adheres to a strict{" "}
        <strong>Local First &amp; Privacy First</strong> architecture. All
        scripts, file scans, process terminations, and code transformations run
        directly inside your laptop&apos;s OS sandbox. Only the text prompt
        instructing the model travels across HTTPS to the AI router.
      </p>
    ),
  },
  {
    id: "payment-methods",
    question: "Which payment methods are accepted?",
    answer: (
      <p className="text-sm text-[#475467] leading-relaxed">
        We support all major international Credit/Debit cards (Visa, MasterCard,
        American Express), Apple Pay, Google Pay, and UPI / NetBanking. All
        transactions are encrypted via Stripe with 256-bit SSL security.
      </p>
    ),
  },
];

export default function PricingPageView() {
  const [selectedCycle, setSelectedCycle] = useState<BillingDuration>("3m");
  const [openFaqId, setOpenFaqId] = useState<string | null>("trial-details");

  const currentPlan = BILLING_CYCLES[selectedCycle];

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 selection:bg-[#4D4B76] selection:text-white flex flex-col justify-between">
      <div>
        {/* ── TOP HERO BANNER (Untitled UI 3D mesh / silk-wave gradient) ── */}
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4">
          <div className="relative rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-sm border border-gray-200/60">
            {/* Silk-Wave Background Gradient */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: "#282E51",
                backgroundImage:
                  "linear-gradient(135deg, #282E51 0%, #3B3861 20%, #4D4B76 42%, #767F93 68%, #9072A3 86%, #B49ABD 100%)",
              }}
            >
              {/* Abstract 3D silk curves */}
              <svg
                className="absolute inset-0 w-full h-full opacity-40 mix-blend-screen"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1440 420"
                preserveAspectRatio="none"
              >
                <path
                  d="M-100,160 C300,320 600,-40 1000,180 C1250,300 1450,120 1600,200 L1600,480 L-100,480 Z"
                  fill="url(#silk-pricing-1)"
                />
                <path
                  d="M-100,260 C250,80 650,380 1100,140 C1300,50 1480,240 1600,160 L1600,480 L-100,480 Z"
                  fill="url(#silk-pricing-2)"
                />
                <defs>
                  <linearGradient
                    id="silk-pricing-1"
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
                    id="silk-pricing-2"
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

              {/* Fine mesh stipple texture overlay */}
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

              <div className="hidden sm:flex items-center gap-2 text-xs text-white/90 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>30-Day Free Trial Active</span>
              </div>
            </div>

            {/* ── Hero Center Content ── */}
            <div className="relative z-10 px-6 pt-12 pb-20 sm:pt-16 sm:pb-24 text-center max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold text-white/90 mb-5"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.22)",
                }}
              >
                <Sparkles size={13} className="text-purple-200" />
                <span>Transparent &amp; Predictable Pricing</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
                className="text-3xl sm:text-5xl md:text-6xl font-semibold text-white tracking-tight leading-[1.08]"
              >
                Plans that grow with you
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
                className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-white/85 font-normal max-w-2xl mx-auto leading-relaxed"
              >
                Start free with our unrestricted 30-day trial of all 10 modules.
                Upgrade to Pro whenever you&apos;re ready for ultra-low latency
                Groq inference and cloud auto-healing.
              </motion.p>

              {/* ── DURATION SELECTOR TABS ── */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.18 }}
                className="mt-8 sm:mt-10 inline-flex items-center p-1.5 rounded-full max-w-xl mx-auto shadow-xl"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.18)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.28)",
                }}
              >
                {(Object.keys(BILLING_CYCLES) as BillingDuration[]).map(
                  (cycleKey) => {
                    const cycle = BILLING_CYCLES[cycleKey];
                    const isActive = selectedCycle === cycleKey;

                    return (
                      <button
                        key={cycleKey}
                        onClick={() => setSelectedCycle(cycleKey)}
                        className="relative px-3.5 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer select-none flex items-center gap-1.5"
                      >
                        {isActive && (
                          <motion.div
                            layoutId="active-pricing-cycle"
                            className="absolute inset-0 bg-white rounded-full shadow-md"
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 38,
                            }}
                          />
                        )}
                        <span
                          className={`relative z-10 transition-colors ${
                            isActive
                              ? "text-[#101828] font-bold"
                              : "text-white/85 hover:text-white"
                          }`}
                        >
                          {cycle.label}
                        </span>
                        {cycle.badge && (
                          <span
                            className={`relative z-10 hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded-full ${
                              isActive
                                ? "bg-[#282E51] text-white"
                                : "bg-white/20 text-white"
                            }`}
                          >
                            {cycle.badge}
                          </span>
                        )}
                      </button>
                    );
                  },
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── MAIN PRICING SECTION: Clean White Cards with GlareHover ── */}
        <section className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#101828] tracking-tight">
              Choose the right tier for your workflow
            </h2>
            <p className="text-sm sm:text-base text-[#475467] mt-2 font-normal">
              Billed transparently in USD. Zero hidden fees, no auto-charge on
              trial, and cancel anytime in 1-click.
            </p>
          </div>

          {/* ── 3 Core Pricing Cards Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-6xl mx-auto">
            {/* ── CARD 1: FREE COMMUNITY ── */}
            <GlareHover
              duration={600}
              className="rounded-2xl h-full flex flex-col"
            >
              <Card className="h-full flex flex-col justify-between border-[#EAECF0] hover:border-gray-300 shadow-sm transition-all duration-300 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl sm:text-2xl">
                      Community
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="text-gray-600 bg-gray-50"
                    >
                      Forever Free
                    </Badge>
                  </div>
                  <CardDescription>
                    Explore local desktop AI on your machine.
                  </CardDescription>

                  <div className="flex items-baseline gap-1 pt-4">
                    <span className="text-4xl sm:text-5xl font-bold tracking-tight text-[#101828]">
                      $0
                    </span>
                    <span className="text-gray-400 text-sm font-normal">
                      / forever
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600 font-medium mt-1">
                    Includes 30-Day Full Pro Trial
                  </p>
                </CardHeader>

                <CardContent className="flex flex-col gap-3 flex-1">
                  {[
                    "30-Day unrestricted trial of all 10 modules",
                    "App Manager & System Insights local tools",
                    "Bring Your Own API Keys (Groq / OpenRouter)",
                    "100% Local sandbox execution on laptop",
                    "Double-Lock safety confirmation gates",
                    "Full community documentation & guides",
                  ].map((feat) => (
                    <div
                      key={feat}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-[#344054]"
                    >
                      <svg
                        className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                        viewBox="0 0 15 15"
                        fill="none"
                      >
                        <path
                          d="M12.5 3.5L6 10L2.5 6.5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>{feat}</span>
                    </div>
                  ))}

                  {/* Muted coming soon / excluded features */}
                  {[
                    "Cloud Healer repo auto-fixing",
                    "Auto-Deployer multi-cloud CI/CD",
                  ].map((feat) => (
                    <div
                      key={feat}
                      className="flex items-center gap-2.5 text-xs text-gray-400"
                    >
                      <svg
                        className="w-4 h-4 shrink-0 opacity-40"
                        viewBox="0 0 15 15"
                        fill="none"
                      >
                        <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
                      </svg>
                      <span>{feat} (Pro only)</span>
                    </div>
                  ))}
                </CardContent>

                <CardFooter className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full text-xs sm:text-sm font-semibold rounded-xl"
                  >
                    Start 30-Day Free Trial
                  </Button>
                </CardFooter>
              </Card>
            </GlareHover>

            {/* ── CARD 2: PRO (Featured Card with Exact GlareHover specification) ── */}
            <GlareHover
              duration={600}
              glareColor="rgba(144, 114, 163, 0.45)"
              glareOpacity={0.25}
              className="rounded-2xl h-full flex flex-col relative md:-translate-y-2"
            >
              <Card className="h-full flex flex-col justify-between border-2 border-[#282E51] shadow-xl relative bg-white overflow-hidden">
                {/* Top Silk Wave Accent Ribbon */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#282E51] via-[#4D4B76] via-[#767F93] to-[#B49ABD]" />

                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl sm:text-2xl text-[#101828]">
                      Pro
                    </CardTitle>
                    <Badge className="bg-[#101828] text-white hover:bg-black px-3 py-0.5 text-xs font-semibold rounded-full shadow-xs">
                      {currentPlan.badge || "Popular"}
                    </Badge>
                  </div>
                  <CardDescription>
                    For developers &amp; power users needing autonomous
                    execution.
                  </CardDescription>

                  {/* Dynamic Price Display */}
                  <div className="flex items-baseline gap-1.5 pt-4">
                    <span className="text-4xl sm:text-5xl font-bold tracking-tight text-[#101828]">
                      ${currentPlan.totalPrice}
                    </span>
                    <span className="text-gray-500 text-sm font-normal">
                      {currentPlan.periodText}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-semibold text-[#4D4B76] bg-[#9072A3]/10 border border-[#9072A3]/25 px-2 py-0.5 rounded-md font-mono">
                      {currentPlan.perMonthText}
                    </span>
                    {currentPlan.savingsText && (
                      <span className="text-xs text-emerald-600 font-medium">
                        {currentPlan.savingsText}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-3 flex-1">
                  {[
                    "All 10 Autonomous Modules unmetered",
                    "Pooled Groq Llama 3.3 70B AI inference (<200ms)",
                    "Automatic OpenRouter failover routing",
                    "Cloud Healer repo inspection & auto-patching",
                    "Auto-Deployer multi-cloud deployment automation",
                    "YouTube Note Generator with structured PDF exports",
                    "Attendance Automator with Excel file locking",
                    "ALOA Radar daily morning engineering briefings",
                    "Double-Lock safety guarantee on all irreversible actions",
                  ].map((feat) => (
                    <div
                      key={feat}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-[#101828] font-medium"
                    >
                      <svg
                        className="w-4 h-4 text-[#4D4B76] shrink-0 mt-0.5"
                        viewBox="0 0 15 15"
                        fill="none"
                      >
                        <path
                          d="M12.5 3.5L6 10L2.5 6.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>{feat}</span>
                    </div>
                  ))}

                  <div className="text-gray-400 flex items-center gap-2.5 text-xs pt-1">
                    <svg
                      className="w-4 h-4 shrink-0 opacity-40"
                      viewBox="0 0 15 15"
                      fill="none"
                    >
                      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
                    </svg>
                    <span>SSO &amp; Team Vault (coming soon)</span>
                  </div>
                </CardContent>

                <CardFooter className="pt-4">
                  <Button
                    variant="theme"
                    className="w-full text-xs sm:text-sm font-semibold rounded-xl shadow-md"
                  >
                    Get Started with Pro ({currentPlan.label})
                  </Button>
                </CardFooter>
              </Card>
            </GlareHover>

            {/* ── CARD 3: STUDIO & TEAM ── */}
            <GlareHover
              duration={600}
              className="rounded-2xl h-full flex flex-col"
            >
              <Card className="h-full flex flex-col justify-between border-[#EAECF0] hover:border-gray-300 shadow-sm transition-all duration-300 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl sm:text-2xl">
                      Studio / Team
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="text-[#4D4B76] bg-[#FAF9FD] border-[#E5E2EE]"
                    >
                      Multi-Seat
                    </Badge>
                  </div>
                  <CardDescription>
                    For engineering pods, research labs, and agencies.
                  </CardDescription>

                  <div className="flex items-baseline gap-1 pt-4">
                    <span className="text-4xl sm:text-5xl font-bold tracking-tight text-[#101828]">
                      $199
                    </span>
                    <span className="text-gray-400 text-sm font-normal">
                      / lifetime
                    </span>
                  </div>
                  <p className="text-xs text-[#4D4B76] font-medium mt-1">
                    Up to 5 engineer seats included
                  </p>
                </CardHeader>

                <CardContent className="flex flex-col gap-3 flex-1">
                  {[
                    "Everything in Pro across 5 workstation seats",
                    "Custom local LLM endpoints (Ollama / vLLM / LM Studio)",
                    "Shared team prompt chains & workflow presets",
                    "Centralized offline activation & license key",
                    "Priority Discord & private Slack channel support",
                    "Direct 1-on-1 architectural advisory with founders",
                    "Custom module development assistance",
                  ].map((feat) => (
                    <div
                      key={feat}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-[#344054]"
                    >
                      <svg
                        className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5"
                        viewBox="0 0 15 15"
                        fill="none"
                      >
                        <path
                          d="M12.5 3.5L6 10L2.5 6.5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>{feat}</span>
                    </div>
                  ))}
                </CardContent>

                <CardFooter className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#101828] hover:text-white transition-colors"
                  >
                    Contact Team Sales
                  </Button>
                </CardFooter>
              </Card>
            </GlareHover>
          </div>

          {/* ── ALL 4 PRO DURATIONS DIRECT SELECTION STRIP ── */}
          <div className="mt-14 max-w-5xl mx-auto p-6 sm:p-8 rounded-[20px] bg-gradient-to-br from-[#FAF9FD] via-white to-[#F5F3FA] border border-[#E9E6F2] shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[#101828] tracking-tight">
                  Pro Duration Breakdown
                </h3>
                <p className="text-xs sm:text-sm text-[#475467] mt-0.5">
                  Pick the duration that fits your project timeline. Switch or
                  cancel at any time.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#039855]" />
                <span className="text-xs font-medium text-[#027A48]">
                  30-Day Money-Back Guarantee
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(Object.keys(BILLING_CYCLES) as BillingDuration[]).map((key) => {
                const cycle = BILLING_CYCLES[key];
                const isSelected = selectedCycle === key;

                return (
                  <motion.div
                    key={key}
                    whileHover={{ y: -2 }}
                    onClick={() => setSelectedCycle(key)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "bg-white border-[#282E51] shadow-md ring-2 ring-[#282E51]/10"
                        : "bg-white/80 border-[#EAECF0] hover:border-[#D0D5DD] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm text-[#101828]">
                        {cycle.label}
                      </span>
                      {cycle.badge && (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#101828] text-white">
                          {cycle.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-[#101828]">
                        ${cycle.totalPrice}
                      </span>
                      <span className="text-xs text-gray-500 font-normal">
                        {cycle.periodText}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#4D4B76] mt-1.5 font-mono">
                      {cycle.perMonthText}
                    </p>
                    <p className="text-[11px] text-[#475467] mt-1">
                      {cycle.savingsText}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── SECTION 3: FEATURES COMPARISON MATRIX ── */}
        <section className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h3 className="text-xl sm:text-2xl font-bold text-[#101828]">
              Compare plan capabilities
            </h3>
            <p className="text-sm text-[#475467] mt-1.5">
              Everything you need for autonomous local and cloud engineering.
            </p>
          </div>

          <div className="overflow-x-auto border border-[#EAECF0] rounded-2xl bg-white shadow-xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F8F9FC] border-b border-[#EAECF0] text-[#101828]">
                <tr>
                  <th className="py-4 px-6 font-semibold">Capability</th>
                  <th className="py-4 px-6 font-semibold text-center w-36">
                    Free Trial
                  </th>
                  <th className="py-4 px-6 font-semibold text-center w-40 bg-[#FAF9FD] text-[#282E51]">
                    Pro Plan
                  </th>
                  <th className="py-4 px-6 font-semibold text-center w-36">
                    Studio
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECF0] text-[#344054]">
                {[
                  {
                    name: "App Manager & System Insights",
                    free: "Full Access",
                    pro: "Full Access",
                    team: "Full Access",
                  },
                  {
                    name: "Code Healer Debugger",
                    free: "30-Day Trial",
                    pro: "Unmetered",
                    team: "Unmetered",
                  },
                  {
                    name: "Cloud Healer Repo Auto-Patcher",
                    free: "30-Day Trial",
                    pro: "Unmetered",
                    team: "Unmetered",
                  },
                  {
                    name: "Auto-Deployer Multi-Cloud CI/CD",
                    free: "30-Day Trial",
                    pro: "Unmetered",
                    team: "Unmetered",
                  },
                  {
                    name: "YouTube Note Generator & PDF Export",
                    free: "30-Day Trial",
                    pro: "Unmetered",
                    team: "Unmetered",
                  },
                  {
                    name: "Attendance Automator Excel Lock",
                    free: "30-Day Trial",
                    pro: "Unmetered",
                    team: "Unmetered",
                  },
                  {
                    name: "ALOA Radar Daily Briefing",
                    free: "30-Day Trial",
                    pro: "Daily Push",
                    team: "Custom Channels",
                  },
                  {
                    name: "AI Inference Router",
                    free: "BYO API Key",
                    pro: "Groq 70B Pooled",
                    team: "Ollama / vLLM + Pooled",
                  },
                  {
                    name: "Execution Privacy",
                    free: "100% Local Sandbox",
                    pro: "100% Local Sandbox",
                    team: "100% Local Sandbox",
                  },
                  {
                    name: "Double-Lock Safety Gate",
                    free: "Included",
                    pro: "Included",
                    team: "Enforced Teamwide",
                  },
                ].map((row, idx) => (
                  <tr
                    key={row.name}
                    className={idx % 2 === 0 ? "bg-white" : "bg-[#FDFDFD]"}
                  >
                    <td className="py-3.5 px-6 font-medium text-[#101828]">
                      {row.name}
                    </td>
                    <td className="py-3.5 px-6 text-center text-gray-600">
                      {row.free}
                    </td>
                    <td className="py-3.5 px-6 text-center font-semibold text-[#282E51] bg-[#FAF9FD]/50">
                      {row.pro}
                    </td>
                    <td className="py-3.5 px-6 text-center text-gray-600">
                      {row.team}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── SECTION 4: PRICING FAQS ── */}
        <section className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
          <div className="mb-10 text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#101828] tracking-tight">
              Frequently asked questions
            </h3>
            <p className="text-sm text-[#475467] mt-2 font-normal">
              Have questions about billing, cancellations, or our 30-day trial?
              We&apos;re here to help.
            </p>
          </div>

          <div className="divide-y divide-[#EAECF0] border-t border-b border-[#EAECF0]">
            {PRICING_FAQS.map((faq) => {
              const isOpen = openFaqId === faq.id;

              return (
                <div key={faq.id} className="py-5 sm:py-6 transition-colors">
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between text-left gap-4 group cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base sm:text-lg font-semibold text-[#101828] group-hover:text-[#4D4B76] transition-colors">
                      {faq.question}
                    </span>
                    <span className="w-8 h-8 rounded-full border border-[#EAECF0] flex items-center justify-center text-gray-400 group-hover:text-gray-900 group-hover:border-gray-300 transition-all shrink-0 bg-[#F9FAFB]">
                      {isOpen ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 text-sm text-[#475467] leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── FLOATING HELP PILL ── */}
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
