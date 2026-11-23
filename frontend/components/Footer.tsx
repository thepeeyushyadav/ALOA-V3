"use client";

import { GitFork, ExternalLink } from "lucide-react";

// ── Link group data ───────────────────────────────────────────────────────────
const productLinks = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Modules", href: "/features" },
];

const resourceLinks = [
  { label: "Documentation", href: "/docs" },
  { label: "GitHub Repo", href: "https://github.com/thepeeyushyadav/THE-ALOA" },
  { label: "Changelog", href: "#" },
  { label: "Support", href: "#" },
];

const connectLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/piyush-pal-751067306/" },
  { label: "GitHub", href: "https://github.com/thepeeyushyadav" },
  { label: "Email", href: "mailto:hello.aloav3@gmail.com" },
];

function LinkGroup({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="text-xs font-medium tracking-[0.2em] text-neutral-600 uppercase mb-5">
        {title}
      </p>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-sm text-neutral-400 hover:text-white transition-colors duration-200"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer
      className="w-full border-t border-neutral-800 pt-20 pb-10 px-6 md:px-12 lg:px-20"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      <div>
        {/* ── Top 4-column grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Column 1: Brand block (spans 2 units on lg via col-span-2 is not needed — 
              we just make it slightly wider by keeping natural grid flow) */}
          <div className="lg:col-span-1">
            {/* Logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/Logo/aloa-v3-logo-light-transparent.png"
              alt="ALOA V3"
              style={{ height: 40, width: "auto", maxWidth: 180, objectFit: "contain" }}
            />

            {/* Tagline */}
            <p className="mt-3 text-sm text-neutral-500 max-w-xs leading-relaxed">
              Your laptop, run by an agent.
            </p>

            {/* Social icons */}
            <div className="flex flex-row items-center gap-3 mt-6">
              <a
                href="https://github.com/thepeeyushyadav"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="flex items-center justify-center w-9 h-9 rounded-full border border-neutral-800 text-neutral-500 hover:border-neutral-500 hover:text-white transition-all duration-200"
              >
                <GitFork size={15} />
              </a>
              <a
                href="https://www.linkedin.com/in/piyush-pal-751067306/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex items-center justify-center w-9 h-9 rounded-full border border-neutral-800 text-neutral-500 hover:border-neutral-500 hover:text-white transition-all duration-200"
              >
                <ExternalLink size={15} />
              </a>
            </div>
          </div>

          {/* Columns 2–4: Link groups */}
          <LinkGroup title="Product" links={productLinks} />
          <LinkGroup title="Resources" links={resourceLinks} />
          <LinkGroup title="Connect" links={connectLinks} />
        </div>

        {/* ── Bottom bar ────────────────────────────────────────────── */}
        <div className="mt-16 pt-8 border-t border-neutral-800">
          <p className="text-sm text-neutral-500">
            © 2026 ALOA V3. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
