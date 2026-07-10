import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

type CursorState = "default" | "hover" | "image" | "button" | "cutting";

const SPRING      = { stiffness: 500, damping: 38, mass: 0.5 };
const RING_SPRING = { stiffness: 160, damping: 22, mass: 0.8 };

export function CustomCursor() {
  const dotX  = useMotionValue(-100);
  const dotY  = useMotionValue(-100);

  const rawRingX = useMotionValue(-100);
  const rawRingY = useMotionValue(-100);
  const ringX = useSpring(rawRingX, RING_SPRING);
  const ringY = useSpring(rawRingY, RING_SPRING);

  const [state,   setState]   = useState<CursorState>("default");
  const [visible, setVisible] = useState(false);
  const rafRef     = useRef<number | null>(null);
  const stateRef   = useRef<CursorState>("default");
  // Scroll timeout ref — revert to non-cutting state after scroll stops
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    /* ── mouse position + element-type detection ─────────────── */
    const onMove = (e: MouseEvent) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        dotX.set(e.clientX);
        dotY.set(e.clientY);
        rawRingX.set(e.clientX);
        rawRingY.set(e.clientY);

        // Don't override cutting state mid-scroll
        if (stateRef.current === "cutting") return;

        const el = e.target as HTMLElement;
        let next: CursorState = "default";
        if      (el.closest("img, [data-cursor='image']")) next = "image";
        else if (el.closest("button"))                      next = "button";
        else if (el.closest("a"))                           next = "hover";

        if (next !== stateRef.current) {
          stateRef.current = next;
          setState(next);
        }
      });
    };

    /* ── scroll → knife mode ─────────────────────────────────── */
    const onScroll = () => {
      if (stateRef.current !== "cutting") {
        stateRef.current = "cutting";
        setState("cutting");
      }
      // Reset to default ~350 ms after scroll stops
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        stateRef.current = "default";
        setState("default");
      }, 350);
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove",  onMove,    { passive: true });
    window.addEventListener("scroll",     onScroll,  { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll",    onScroll);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (scrollTimerRef.current)  clearTimeout(scrollTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── per-state ring config ── */
  const ringConfig = {
    default: { size: 32,  bg: "transparent",          border: "rgba(15,23,42,0.35)",  rotate: 0  },
    hover:   { size: 48,  bg: "rgba(37,99,235,0.10)", border: "rgba(37,99,235,0.80)", rotate: 0  },
    button:  { size: 56,  bg: "rgba(37,99,235,0.12)", border: "rgba(37,99,235,0.90)", rotate: 0  },
    image:   { size: 64,  bg: "rgba(15,23,42,0.06)",  border: "rgba(15,23,42,0.40)",  rotate: 0  },
    // Knife: oval ring rotated 45° like a blade path
    cutting: { size: 40,  bg: "rgba(15,23,42,0.06)",  border: "rgba(15,23,42,0.55)",  rotate: 45 },
  } satisfies Record<CursorState, { size: number; bg: string; border: string; rotate: number }>;

  const cfg = ringConfig[state];

  const dotScale = state === "hover" || state === "button" ? 0.5
                 : state === "cutting" ? 0 // hide dot in knife mode
                 : 1;
  const dotColor = state === "hover" || state === "button"
    ? "rgb(37,99,235)"
    : "rgb(15,23,42)";

  return (
    <>
      {/* ── ring ── */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width:           cfg.size,
          height:          state === "cutting" ? cfg.size * 0.55 : cfg.size,
          opacity:         visible ? 1 : 0,
          backgroundColor: cfg.bg,
          borderColor:     cfg.border,
          borderWidth:     state === "cutting" ? 1 : 1.5,
          borderStyle:     "solid",
          rotate:          cfg.rotate,
        }}
        transition={{
          width:           { ...RING_SPRING, type: "spring" },
          height:          { ...RING_SPRING, type: "spring" },
          opacity:         { duration: 0.15 },
          backgroundColor: { duration: 0.2 },
          borderColor:     { duration: 0.2 },
          rotate:          { type: "spring", stiffness: 300, damping: 25 },
        }}
      >
        {/* Knife blade icon in cutting mode */}
        {state === "cutting" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1,  scale: 1   }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 flex items-center justify-center select-none"
            style={{ fontSize: 14, rotate: -45 }}
          >
            {/* SVG knife/blade silhouette */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Blade */}
              <path
                d="M2 12 L12 2 L13 3 L4 13 Z"
                fill="rgba(15,23,42,0.65)"
              />
              {/* Edge highlight */}
              <line x1="12" y1="2" x2="13" y2="3" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
            </svg>
          </motion.div>
        )}

        {state === "image" && (
          <motion.span
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1,  scale: 1   }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold tracking-widest text-foreground uppercase select-none"
          >
            view
          </motion.span>
        )}
        {state === "hover" && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1,  scale: 1   }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center text-[11px] text-primary select-none"
          >
            ↗
          </motion.span>
        )}
      </motion.div>

      {/* ── dot ── */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[10000] rounded-full"
        style={{ x: dotX, y: dotY, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width:           state === "image" || state === "cutting" ? 0 : 5,
          height:          state === "image" || state === "cutting" ? 0 : 5,
          opacity:         visible && state !== "image" && state !== "cutting" ? 1 : 0,
          scale:           dotScale,
          backgroundColor: dotColor,
        }}
        transition={{
          ...SPRING,
          type:            "spring",
          opacity:         { duration: 0.12 },
          backgroundColor: { duration: 0.2 },
        }}
      />
    </>
  );
}
