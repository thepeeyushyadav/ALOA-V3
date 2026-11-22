"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, X } from "lucide-react";

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

export default function Navbar({ variant = "light" }: NavbarProps) {
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

  const isDark = variant === "dark";

  // Active logic: match current pathname to link href (strip hash for comparison)
  const isLinkActive = (href: string) => {
    const hrefPath = href.split("#")[0]; // strip #hash
    if (hrefPath === "/") return pathname === "/";
    return pathname === hrefPath || pathname.startsWith(hrefPath + "/");
  };

  return (
    <nav
      className={`relative z-50 flex flex-col transition-colors duration-300 ${
        isDark
          ? scrolled
            ? "bg-black/60 backdrop-blur-md border-b border-white/[0.06]"
            : "bg-transparent"
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
              const isActive = isDark && isLinkActive(link.href);

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`text-sm transition-colors duration-200 ${
                    isActive
                      ? "text-white border-b border-sky-400 pb-0.5 font-medium"
                      : isDark
                        ? "text-neutral-400 hover:text-white"
                        : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Desktop search + Mobile hamburger */}
        <div className="flex items-center gap-3">
          {/* Desktop search */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search a module..."
              className={`w-72 rounded-full py-2 pl-4 pr-10 text-sm transition-colors focus:outline-none ${
                isDark
                  ? "bg-white/[0.05] border border-white/10 text-neutral-300 placeholder:text-neutral-500 focus:border-white/30"
                  : "border border-neutral-300 bg-white/70 text-neutral-600 placeholder:text-neutral-400 focus:border-neutral-400"
              }`}
            />
            <Search
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                isDark ? "text-neutral-500" : "text-neutral-400"
              }`}
              size={15}
            />
          </div>

          {/* Mobile hamburger */}
          <button
            className={`flex md:hidden items-center justify-center w-10 h-10 rounded-full border transition-colors ${
              isDark
                ? "border-white/10 text-neutral-300 hover:border-white/20 hover:text-white bg-white/[0.02]"
                : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
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
              : "bg-white/90 border-b border-neutral-200"
          }`}
        >
          {navLinks.map((link) => {
            const isActive = isDark && isLinkActive(link.href);

            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`text-sm transition-colors py-1 ${
                  isActive
                    ? "text-white font-medium"
                    : isDark
                      ? "text-neutral-400 hover:text-white"
                      : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {/* Mobile search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search a module..."
              className={`w-full rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none ${
                isDark
                  ? "bg-white/[0.05] border border-white/10 text-neutral-300 placeholder:text-neutral-500"
                  : "border border-neutral-300 bg-white text-neutral-600 placeholder:text-neutral-400"
              }`}
            />
            <Search
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                isDark ? "text-neutral-500" : "text-neutral-400"
              }`}
              size={15}
            />
          </div>
        </div>
      )}
    </nav>
  );
}
