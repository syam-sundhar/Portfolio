import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

type CursorState = "default" | "hover" | "image" | "text" | "button";

const SPRING = { stiffness: 500, damping: 38, mass: 0.5 };
const RING_SPRING = { stiffness: 160, damping: 22, mass: 0.8 };

export function CustomCursor() {
  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);

  const rawRingX = useMotionValue(-100);
  const rawRingY = useMotionValue(-100);
  const ringX = useSpring(rawRingX, RING_SPRING);
  const ringY = useSpring(rawRingY, RING_SPRING);

  const [state, setState] = useState<CursorState>("default");
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        dotX.set(e.clientX);
        dotY.set(e.clientY);
        rawRingX.set(e.clientX);
        rawRingY.set(e.clientY);
        if (!visible) setVisible(true);
      });
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    const detect = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const link = el.closest("a");
      const btn = el.closest("button");
      const img = el.closest("img, [data-cursor='image']");
      const txt = el.closest("p, h1, h2, h3, h4, h5, span, [data-cursor='text']");

      if (img)        setState("image");
      else if (btn)   setState("button");
      else if (link)  setState("hover");
      else if (txt)   setState("text");
      else            setState("default");
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousemove", detect, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousemove", detect);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [dotX, dotY, rawRingX, rawRingY, visible]);

  /* ── per-state ring config ── */
  const ringConfig: Record<CursorState, {
    size: number; opacity: number; bg: string; border: string; blur: boolean;
  }> = {
    default: { size: 32, opacity: 1,   bg: "transparent",         border: "rgba(15,23,42,0.35)", blur: false },
    hover:   { size: 48, opacity: 1,   bg: "rgba(37,99,235,0.10)", border: "rgba(37,99,235,0.8)", blur: false },
    button:  { size: 56, opacity: 1,   bg: "rgba(37,99,235,0.12)", border: "rgba(37,99,235,0.9)", blur: false },
    image:   { size: 64, opacity: 0.9, bg: "rgba(15,23,42,0.06)",  border: "rgba(15,23,42,0.4)",  blur: true  },
    text:    { size: 3,  opacity: 0,   bg: "transparent",          border: "transparent",          blur: false },
  };

  const cfg = ringConfig[state];

  const dotVisible = state !== "image";
  const dotScale   = state === "hover" || state === "button" ? 0.5 : state === "text" ? 2 : 1;
  const dotColor   = state === "hover" || state === "button" ? "rgb(37,99,235)" : "rgb(15,23,42)";

  return (
    <>
      {/* ── ring ── */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width:  cfg.size,
          height: cfg.size,
          opacity: visible ? cfg.opacity : 0,
          backgroundColor: cfg.bg,
          borderColor: cfg.border,
          borderWidth: 1.5,
          borderStyle: "solid",
          backdropFilter: cfg.blur ? "blur(2px)" : "none",
        }}
        transition={{
          width:   { ...RING_SPRING, type: "spring" },
          height:  { ...RING_SPRING, type: "spring" },
          opacity: { duration: 0.15 },
          backgroundColor: { duration: 0.2 },
          borderColor:     { duration: 0.2 },
        }}
      >
        {/* "view" label on image hover */}
        {state === "image" && (
          <motion.span
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold tracking-widest text-foreground uppercase select-none"
          >
            view
          </motion.span>
        )}
        {/* "↗" on link hover */}
        {state === "hover" && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center text-[11px] text-primary select-none"
          >
            ↗
          </motion.span>
        )}
      </motion.div>

      {/* ── dot ── */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[10000] rounded-full"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width:   dotVisible ? 5 : 0,
          height:  dotVisible ? 5 : 0,
          opacity: visible && dotVisible ? 1 : 0,
          scale:   dotScale,
          backgroundColor: dotColor,
        }}
        transition={{
          ...SPRING,
          type: "spring",
          opacity: { duration: 0.12 },
          backgroundColor: { duration: 0.2 },
        }}
      />
    </>
  );
}
