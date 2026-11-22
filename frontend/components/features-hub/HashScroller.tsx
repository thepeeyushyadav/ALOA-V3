"use client";

/**
 * /frontend/components/features-hub/HashScroller.tsx
 *
 * Scrolls to location.hash after hydration on /docs so that
 * /docs#doc-code-healer lands at the correct section even on hard refresh.
 */

import { useEffect } from "react";

export default function HashScroller() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const id = hash.replace("#", "");

    const tryScroll = (attempts = 0) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (attempts < 10) {
        setTimeout(() => tryScroll(attempts + 1), 150);
      }
    };

    // Small delay to let the DOM hydrate fully
    setTimeout(tryScroll, 100);
  }, []);

  return null;
}
