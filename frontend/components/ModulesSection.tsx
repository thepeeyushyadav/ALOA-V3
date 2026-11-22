"use client";

import { useState } from "react";
import Link from "next/link";

type Tab = {
  id: string;
  label: string;
  title: string;
  description: string;
  category: string;
  moduleCount: string;
  docsHref: string;
  imageSrc: string;
  imageAlt: string;
};

const tabs: Tab[] = [
  {
    id: "debugging",
    label: "Debugging",
    title: "Code Healer & Cloud Healer",
    description:
      "Diagnoses runtime errors, AST-validates patches, and fixes code autonomously — locally or directly inside a GitHub repo.",
    category: "Debugging",
    moduleCount: "2 Modules",
    docsHref: "/features",
    imageSrc: "/screenshots/debugging.png",
    imageAlt: "Cloud Healer & Code Healer debugging interface",
  },
  {
    id: "deployment",
    label: "Deployment",
    title: "Auto-Deployer & System Insights",
    description:
      "Detects your framework, provisions infrastructure, and deploys to Vercel or Render — while keeping your machine healthy.",
    category: "Deployment",
    moduleCount: "2 Modules",
    docsHref: "/features",
    imageSrc: "/screenshots/deployment.png",
    imageAlt:
      "System Insights real-time hardware health and diagnostic insights",
  },
  {
    id: "productivity",
    label: "Productivity",
    title: "Resume Engine, ALOA Radar & More",
    description:
      "Generates ATS-optimized resumes, daily tech briefings, exam assistance, and automates repetitive academic and admin tasks.",
    category: "Productivity",
    moduleCount: "6 Modules",
    docsHref: "/features",
    imageSrc: "/screenshots/productivity.png",
    imageAlt: "App Manager & autonomous productivity workflows",
  },
];

export default function ModulesSection() {
  const [activeTab, setActiveTab] = useState<string>("debugging");

  const current = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <section
      id="modules"
      style={{ backgroundColor: "#0F0F0F" }}
      className="px-8 md:px-16 lg:px-20 xl:px-28 pt-24 pb-32"
    >
      {/* Large italic heading */}
      <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5rem] font-light italic tracking-tight text-white leading-[1.05] max-w-5xl mb-20 md:mb-28">
        LIMITLESS AUTOMATION WITH ALOA
      </h2>

      {/* Tab + content layout */}
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 xl:gap-20">
        {/* Left: vertical tabs */}
        <div className="flex flex-row lg:flex-col gap-6 lg:gap-8 lg:w-[160px] xl:w-[200px] shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-left text-sm lg:text-base cursor-pointer font-${
                activeTab === tab.id ? "medium" : "normal"
              } transition-colors duration-200 select-none ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {tab.label}
              {/* Active indicator */}
              {activeTab === tab.id && (
                <span className="hidden lg:block w-6 h-px bg-white mt-1" />
              )}
            </button>
          ))}
        </div>

        {/* Right: content area */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 xl:gap-16 flex-1">
          {/* Visual: Live Module Screenshot in Sleek Window Frame */}
          <div className="lg:w-[460px] xl:w-[540px] aspect-[4/3] rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-neutral-950 shadow-2xl flex flex-col group">
            {/* Top Window Bar */}
            <div className="h-7 px-4 bg-neutral-900/90 border-b border-white/[0.06] flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <span className="text-[10px] font-mono text-neutral-400 tracking-wider">
                aloa://{current.id}
              </span>
              <div className="w-8" />
            </div>

            {/* Screenshot Display */}
            <div className="relative flex-1 w-full overflow-hidden bg-neutral-900 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={current.id}
                src={current.imageSrc}
                alt={current.imageAlt}
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
              />

              {/* Bottom gradient fade for seamless integration */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
            </div>
          </div>

          {/* Text content */}
          <div className="flex flex-col justify-between flex-1">
            <div>
              {/* Title */}
              <h3 className="text-2xl md:text-3xl font-light text-white leading-snug max-w-sm mb-5">
                {current.title}
              </h3>

              {/* Description */}
              <p className="text-sm md:text-base text-neutral-400 leading-relaxed max-w-sm mb-8">
                {current.description}
              </p>

              {/* Learn More link */}
              <Link
                href={current.docsHref}
                className="text-sm text-white font-medium underline underline-offset-4 hover:text-neutral-300 transition-colors inline-flex items-center gap-1.5"
              >
                <span>Learn More</span>
                <span>→</span>
              </Link>
            </div>

            {/* Bottom meta */}
            <div className="border-t border-neutral-800 pt-6 mt-10 flex flex-row items-center gap-6">
              <span className="text-xs font-medium tracking-[0.2em] text-neutral-500 uppercase">
                {current.category}
              </span>
              <span className="w-px h-4 bg-neutral-700" />
              <span className="text-xs text-neutral-500">
                {current.moduleCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
