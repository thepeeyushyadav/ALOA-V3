"use client";

import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
}

export default function VideoModal({ isOpen, onClose, src }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      // Small delay so CSS transition fires after mount
      requestAnimationFrame(() => {
        if (modalRef.current) {
          modalRef.current.dataset.visible = "true";
        }
      });
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  // Pause & reset video when closed
  useEffect(() => {
    if (!isOpen && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    if (isOpen && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        animation: "fadeIn 0.25s ease forwards",
      }}
      onClick={(e) => {
        // Close when clicking the dark backdrop
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Demo video"
    >
      {/* Modal container */}
      <div
        ref={modalRef}
        className="relative w-full max-w-7xl mx-4 md:mx-8"
        style={{ animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors duration-200 group"
          aria-label="Close demo video"
        >
          <span className="text-sm tracking-wide">Close</span>
          <span className="w-8 h-8 rounded-full border border-neutral-600 flex items-center justify-center group-hover:border-neutral-300 transition-colors">
            <X size={14} />
          </span>
        </button>

        {/* Video player */}
        <div
          className="relative w-full overflow-hidden rounded-2xl"
          style={{
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.08), 0 32px 80px rgba(0,0,0,0.8)",
          }}
        >
          <video
            ref={videoRef}
            className="w-full h-auto block"
            style={{ maxHeight: "82vh", objectFit: "contain", background: "#000" }}
            src={src}
            controls
            playsInline
            preload="metadata"
          />
        </div>
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.93) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0px); }
        }
      `}</style>
    </div>
  );
}
