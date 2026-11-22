"use client";

import React, { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface GlareHoverProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  glareOpacity?: number;
  glareColor?: string;
}

export function GlareHover({
  children,
  className,
  duration = 600,
  glareOpacity = 0.18,
  glareColor = "rgba(144, 114, 163, 0.4)",
  ...props
}: GlareHoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x, y });
  }, []);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        className
      )}
      {...props}
    >
      {/* Glare spotlight layer */}
      <div
        className="pointer-events-none absolute -inset-px z-20 rounded-[inherit] transition-opacity"
        style={{
          opacity: isHovered ? glareOpacity : 0,
          transitionDuration: `${duration}ms`,
          background: `radial-gradient(400px circle at ${position.x}% ${position.y}%, ${glareColor}, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}
