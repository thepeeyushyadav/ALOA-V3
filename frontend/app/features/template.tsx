"use client";

/**
 * /frontend/app/features/template.tsx
 *
 * Page enter animation: opacity 0→1, y 8→0, duration 0.35s.
 * Uses pure CSS animation (no Framer Motion) to completely eliminate SSR hydration mismatch.
 */

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="page-enter">{children}</div>
      <style>{`
        @keyframes pageEnter {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0px); }
        }
        .page-enter {
          animation: pageEnter 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </>
  );
}
