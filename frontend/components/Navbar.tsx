"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export interface NavbarProps {
  variant?: "light" | "dark";
}

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Docs", href: "/docs" },
];

export default function Navbar({ variant }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Variant resolution:
  // If explicitly passed, use it.
  // Otherwise, default to "light" for "/" (homepage), and "dark" for all other pages.
  const isDark = variant !== undefined ? variant === "dark" : pathname !== "/";

  // Active logic: match current pathname to link href (strip hash for comparison)
  const isLinkActive = (href: string) => {
    const hrefPath = href.split("#")[0]; // strip #hash
    if (hrefPath === "/") return pathname === "/";
    return pathname === hrefPath || pathname.startsWith(hrefPath + "/");
  };

  return (
    <nav
      className={`relative z-50 flex flex-col transition-colors duration-300 ${
        scrolled
          ? isDark
            ? "bg-black/80 backdrop-blur-md border-b border-white/[0.08]"
            : "bg-white/80 backdrop-blur-md border-b border-neutral-200/80 shadow-sm"
          : "bg-transparent"
      }`}
    >
      {/* Main bar */}
      <div className="flex flex-row items-center justify-between px-5 py-4 md:px-12 md:py-6">
        {/* Left: Logo + desktop links */}
        <div className="flex flex-row items-center gap-12">
          {/* Logo */}
          <Link
            href="/"
            className="select-none transition-opacity hover:opacity-80"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                isDark
                  ? "/images/Logo/aloa-v3-mark-light-transparent.png"
                  : "/images/Logo/aloa-v3-mark-dark.png"
              }
              alt="ALOA V3"
              style={{
                height: 35,
                width: 35,
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex flex-row items-center gap-7">
            {navLinks.map((link) => {
              const isActive = isLinkActive(link.href);

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`text-sm transition-colors duration-200 ${
                    isDark
                      ? isActive
                        ? "text-white border-b border-blue-400 pb-0.5 font-medium"
                        : "text-slate-300 hover:text-white"
                      : isActive
                        ? "text-neutral-900 border-b-2 border-neutral-900 pb-0.5 font-semibold"
                        : "text-neutral-700 hover:text-neutral-950 font-medium"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Mobile hamburger */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            className={`flex md:hidden items-center justify-center w-10 h-10 rounded-full border transition-colors ${
              isDark
                ? "border-white/10 text-neutral-300 hover:border-white/20 hover:text-white bg-white/[0.02]"
                : "border-neutral-300 text-neutral-700 hover:border-neutral-400 hover:text-neutral-950 bg-neutral-100"
            }`}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className={`md:hidden flex flex-col gap-4 px-5 pb-5 backdrop-blur-md ${
            isDark
              ? "bg-[#0A0A0A]/95 border-b border-white/[0.06]"
              : "bg-white/95 border-b border-neutral-200 shadow-lg"
          }`}
        >
          {navLinks.map((link) => {
            const isActive = isLinkActive(link.href);

            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`text-sm transition-colors py-1 ${
                  isDark
                    ? isActive
                      ? "text-white font-medium"
                      : "text-neutral-400 hover:text-white"
                    : isActive
                      ? "text-neutral-900 font-semibold"
                      : "text-neutral-700 hover:text-neutral-950 font-medium"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
