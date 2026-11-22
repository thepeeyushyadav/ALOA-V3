"use client";

/**
 * /frontend/components/features-hub/OptionWheel/OptionWheel.tsx
 *
 * Modified React Bits OptionWheel engine for ALOA V3 Features Hub:
 * 1) Page-scroll release: onWheel does not preventDefault when at start/end bounds.
 * 2) No unstyled flash: 'ready' state fades root in after first frame layout.
 * 3) Visible focus ring: focus-visible:ring-1 focus-visible:ring-white/20 rounded-2xl.
 * 4) onItemClick prop: triggers only on click or Enter/Space on centered item.
 * 5) activeIndex prop: shows a glowing 6px accent dot before the active module label.
 *
 * WHEEL RULE: The wheel shows ONLY the 10 module names.
 * Scrolling and dragging move the wheel ONLY and never open a module.
 */

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type CSSProperties,
} from "react";
import "./OptionWheel.css";

export type Side = "left" | "right";

export interface OptionWheelProps {
  items?: string[];
  defaultSelected?: number;
  activeIndex?: number | null;
  onChange?: (index: number, item: string) => void;
  onItemClick?: (index: number, item: string) => void;
  textColor?: string;
  activeColor?: string;
  side?: Side;
  fontSize?: number;
  spacing?: number;
  curve?: number;
  tilt?: number;
  blur?: number;
  fade?: number;
  minOpacity?: number;
  smoothing?: number;
  inset?: number;
  loop?: boolean;
  draggable?: boolean;
  soundUrl?: string;
  soundVolume?: number;
  className?: string;
}

interface WheelConfig {
  count: number;
  items: string[];
  rowH: number;
  curve: number;
  tilt: number;
  blur: number;
  fade: number;
  minOpacity: number;
  side: Side;
  loop: boolean;
  smoothing: number;
  draggable: boolean;
  soundUrl: string;
  soundVolume: number;
}

const DEFAULT_ITEMS = [
  "App Manager",
  "System Insights",
  "Attendance",
  "YouTube Notes",
  "Exam Pilot",
  "Code Healer",
  "Cloud Healer",
  "Auto-Deployer",
  "Resume Engine",
  "ALOA Radar",
];

const OptionWheel = ({
  items = DEFAULT_ITEMS,
  defaultSelected = 0,
  activeIndex = null,
  onChange,
  onItemClick,
  textColor = "#5f5f66",
  activeColor = "#ffffff",
  side = "left",
  fontSize = 2.75,
  spacing = 1.5,
  curve = 1,
  tilt = 6,
  blur = 2,
  fade = 0.22,
  minOpacity = 0.05,
  smoothing = 200,
  inset = 72,
  loop = false,
  draggable = true,
  soundUrl = "",
  soundVolume = 0.5,
  className = "",
}: OptionWheelProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const posRef = useRef(defaultSelected);
  const targetRef = useRef(defaultSelected);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const cfgRef = useRef<WheelConfig>({} as WheelConfig);
  const onChangeRef = useRef(onChange);
  const onItemClickRef = useRef(onItemClick);
  const selectedRef = useRef(defaultSelected);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{ y: number; start: number; id: number } | null>(null);
  const dragMovedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef("");
  const lastTickRef = useRef(0);
  const isHoveringItemsRef = useRef(false);

  const [selectedIndex, setSelectedIndex] = useState(defaultSelected);
  const [isDragging, setIsDragging] = useState(false);
  const [ready, setReady] = useState(false);

  const remPx =
    typeof window !== "undefined"
      ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      : 16;

  onChangeRef.current = onChange;
  onItemClickRef.current = onItemClick;

  cfgRef.current = {
    count: items.length,
    items,
    rowH: Math.max(fontSize * spacing * remPx, 1),
    curve,
    tilt,
    blur,
    fade,
    minOpacity,
    side,
    loop,
    smoothing,
    draggable,
    soundUrl,
    soundVolume,
  };

  // Single rAF loop for wheel physics and curvilinear layout
  const runFrame = useCallback(
    (now: number) => {
      const dt = Math.min((now - lastRef.current) / 1000, 0.05);
      lastRef.current = now;
      const cfg = cfgRef.current;
      const tau = Math.max(cfg.smoothing, 1) / 1000;
      const k = 1 - Math.exp(-dt / tau);

      const target = targetRef.current;
      const cur = posRef.current;
      let next = cur + (target - cur) * k;
      const settled = Math.abs(target - next) < 0.001;
      if (settled) next = target;
      posRef.current = next;

      const els = itemRefs.current;
      const n = cfg.count;
      const mirror = cfg.side === "right" ? -1 : 1;
      const tiltRad = (cfg.tilt * Math.PI) / 180;
      const R = tiltRad > 0.0005 ? cfg.rowH / tiltRad : 0;

      for (let i = 0; i < n; i++) {
        const el = els[i];
        if (!el) continue;
        let d = i - next;
        if (cfg.loop && n > 1) {
          d = ((d % n) + n) % n;
          if (d > n / 2) d -= n;
        }
        const dist = Math.abs(d);
        let x = 0;
        let y = d * cfg.rowH;
        let rot = 0;
        if (R > 0) {
          const ang = Math.max(
            -Math.PI / 2,
            Math.min(Math.PI / 2, d * tiltRad),
          );
          y = R * Math.sin(ang);
          x = -mirror * R * (1 - Math.cos(ang)) * cfg.curve;
          rot = (mirror * ang * 180) / Math.PI;
        }
        el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg)`;
        el.style.opacity = String(
          Math.max(cfg.minOpacity, 1 - dist * cfg.fade),
        );
        el.style.filter =
          cfg.blur > 0 ? `blur(${(dist * cfg.blur).toFixed(2)}px)` : "none";
        el.style.setProperty(
          "--ow-p",
          Math.max(0, 1 - Math.min(dist, 1)).toFixed(4),
        );
      }

      if (!ready) {
        setReady(true);
      }

      rafRef.current = settled ? null : requestAnimationFrame(runFrame);
    },
    [ready],
  );

  const startLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
    }
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  const playTick = useCallback(() => {
    const { soundUrl, soundVolume } = cfgRef.current;
    if (!soundUrl) return;
    const now = performance.now();
    if (now - lastTickRef.current < 70) return;
    lastTickRef.current = now;
    if (!audioRef.current || audioUrlRef.current !== soundUrl) {
      audioRef.current = new Audio(soundUrl);
      audioRef.current.preload = "auto";
      audioUrlRef.current = soundUrl;
    }
    const audio = audioRef.current;
    audio.volume = Math.min(Math.max(soundVolume, 0), 1);
    audio.currentTime = 0;
    audio.play()?.catch(() => {});
  }, []);

  const applyTarget = useCallback(
    (value: number, snap: boolean) => {
      const cfg = cfgRef.current;
      let v = value;
      if (!cfg.loop) v = Math.min(Math.max(v, 0), Math.max(cfg.count - 1, 0));
      if (snap) v = Math.round(v);
      targetRef.current = v;
      const idx = ((Math.round(v) % cfg.count) + cfg.count) % cfg.count;
      if (idx !== selectedRef.current) {
        selectedRef.current = idx;
        setSelectedIndex(idx);
        onChangeRef.current?.(idx, cfg.items[idx]);
        playTick();
      }
      startLoop();
    },
    [startLoop, playTick],
  );

  // Synchronize target if defaultSelected changes externally (e.g. from URL hash)
  useEffect(() => {
    applyTarget(defaultSelected, true);
  }, [defaultSelected, applyTarget]);

  // 1) Page-scroll release: in onWheel, allow normal page scroll when at bounds
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Only intercept wheel when cursor is hovering over the text items
      if (!isHoveringItemsRef.current) return;

      const cfg = cfgRef.current;
      const delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;

      // Bound checks: if at top and scrolling up, or at bottom and scrolling down -> release to page
      const atStart = !cfg.loop && targetRef.current <= 0.001 && delta < 0;
      const atEnd =
        !cfg.loop && targetRef.current >= cfg.count - 1 - 0.001 && delta > 0;
      if (atStart || atEnd) return;

      e.preventDefault();

      // Normalize delta: one "notch" of trackpad/wheel = 1 item step
      // delta ~100 per notch on most devices; clamp to [-1, 1] per event
      const normalizedStep =
        Math.sign(delta) * Math.min(Math.abs(delta) / 100, 1);
      applyTarget(targetRef.current + normalizedStep, false);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(
        () => applyTarget(targetRef.current, true),
        200,
      );
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    };
  }, [applyTarget]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!cfgRef.current.draggable) return;
      dragRef.current = {
        y: e.clientY,
        start: targetRef.current,
        id: e.pointerId,
      };
      dragMovedRef.current = false;
      setIsDragging(true);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dy = e.clientY - drag.y;
      if (!dragMovedRef.current && Math.abs(dy) > 4) {
        dragMovedRef.current = true;
        rootRef.current?.setPointerCapture(drag.id);
      }
      if (dragMovedRef.current) {
        applyTarget(drag.start - dy / cfgRef.current.rowH, false);
      }
    },
    [applyTarget],
  );

  const handlePointerEnd = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsDragging(false);
    if (dragMovedRef.current) applyTarget(targetRef.current, true);
  }, [applyTarget]);

  // 4) On item click: ignore if just dragged; navigate, then call onItemClick
  const handleItemClick = useCallback(
    (index: number) => {
      if (dragMovedRef.current) return;
      const cfg = cfgRef.current;
      const cur = targetRef.current;
      let d = index - (((cur % cfg.count) + cfg.count) % cfg.count);
      if (cfg.loop && cfg.count > 1) {
        if (d > cfg.count / 2) d -= cfg.count;
        else if (d < -cfg.count / 2) d += cfg.count;
      }
      applyTarget(cur + d, true);
      onItemClickRef.current?.(index, cfg.items[index]);
    },
    [applyTarget],
  );

  // Keyboard navigation & selection
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      let delta: number | null = null;
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") delta = -1;
      else if (e.key === "ArrowDown" || e.key === "ArrowRight") delta = 1;

      if (delta != null) {
        e.preventDefault();
        applyTarget(Math.round(targetRef.current) + delta, true);
        return;
      }

      // Enter or Space opens currently centered module
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const cfg = cfgRef.current;
        const currentIdx = Math.round(targetRef.current);
        const validIdx = Math.max(0, Math.min(cfg.count - 1, currentIdx));
        onItemClickRef.current?.(validIdx, cfg.items[validIdx]);
      }
    },
    [applyTarget],
  );

  useEffect(() => {
    applyTarget(targetRef.current, false);
  }, [
    items,
    fontSize,
    spacing,
    curve,
    tilt,
    blur,
    fade,
    minOpacity,
    side,
    loop,
    smoothing,
    applyTarget,
  ]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      audioRef.current?.pause();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      role="listbox"
      tabIndex={0}
      aria-label="Module selector wheel"
      className={`option-wheel-root relative h-full w-full select-none overflow-hidden outline-none [touch-action:none] transition-opacity duration-400 focus-visible:ring-1 focus-visible:ring-white/20 rounded-2xl ${
        ready ? "opacity-100" : "opacity-0"
      } ${isDragging ? "cursor-grabbing" : "cursor-grab"} ${className}`}
      style={
        {
          "--ow-text-color": textColor,
          "--ow-active-color": activeColor,
          "--ow-font-size": `${fontSize}rem`,
          "--ow-inset": `${inset}px`,
        } as CSSProperties
      }
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
    >
      {items.map((label, index) => {
        const isSelected = selectedIndex === index;
        const isActive = activeIndex === index;

        return (
          <div
            key={`${label}-${index}`}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            role="option"
            aria-selected={isSelected}
            className={`option-wheel-item ${
              side === "right"
                ? "right-[var(--ow-inset)] origin-right"
                : "left-[var(--ow-inset)] origin-left"
            } ${isSelected ? "font-medium" : "font-light"}`}
            onMouseEnter={() => {
              isHoveringItemsRef.current = true;
            }}
            onMouseLeave={() => {
              isHoveringItemsRef.current = false;
            }}
            onClick={() => handleItemClick(index)}
          >
            {/* 5) Active dot indicator (6px soft glowing accent dot) */}
            {isActive && (
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.85)] mr-2.5 align-middle"
                aria-hidden="true"
              />
            )}
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default OptionWheel;
