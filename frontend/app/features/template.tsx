"use client";

/**
 * /frontend/app/features/template.tsx
 *
 * Page enter animation: opacity 0→1, y 8→0, duration 0.35s.
 */

import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
