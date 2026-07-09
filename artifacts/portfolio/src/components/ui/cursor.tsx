import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

type CursorState = "default" | "hover" | "image" | "button";

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
  const rafRef  = useRef<number | null>(null);
  const stateRef = useRef<CursorState>("default");

  useEffect(() => {
    // Single consolidated mousemove handler — position + detection in one pass
    const onMove = (e: MouseEvent) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        dotX.set(e.clientX);
        dotY.set(e.clientY);
        rawRingX.set(e.clientX);
        rawRingY.set(e.clientY);

        // Element-type detection
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

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // stable: motion values never change identity, state setters are stable

  /* ── per-state ring config ── */
  const ringConfig = {
    default: { size: 32, bg: "transparent",          border: "rgba(15,23,42,0.35)"  },
    hover:   { size: 48, bg: "rgba(37,99,235,0.10)", border: "rgba(37,99,235,0.80)" },
    button:  { size: 56, bg: "rgba(37,99,235,0.12)", border: "rgba(37,99,235,0.90)" },
    image:   { size: 64, bg: "rgba(15,23,42,0.06)",  border: "rgba(15,23,42,0.40)"  },
  } satisfies Record<CursorState, { size: number; bg: string; border: string }>;

  const cfg = ringConfig[state];
  const dotScale = state === "hover" || state === "button" ? 0.5 : 1;
  const dotColor = state === "hover" || state === "button" ? "rgb(37,99,235)" : "rgb(15,23,42)";

  return (
    <>
      {/* ── ring ── */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full"
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width:           cfg.size,
          height:          cfg.size,
          opacity:         visible ? 1 : 0,
          backgroundColor: cfg.bg,
          borderColor:     cfg.border,
          borderWidth:     1.5,
          borderStyle:     "solid",
        }}
        transition={{
          width:           { ...RING_SPRING, type: "spring" },
          height:          { ...RING_SPRING, type: "spring" },
          opacity:         { duration: 0.15 },
          backgroundColor: { duration: 0.2 },
          borderColor:     { duration: 0.2 },
        }}
      >
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
          width:           state === "image" ? 0 : 5,
          height:          state === "image" ? 0 : 5,
          opacity:         visible && state !== "image" ? 1 : 0,
          scale:           dotScale,
          backgroundColor: dotColor,
        }}
        transition={{ ...SPRING, type: "spring", opacity: { duration: 0.12 }, backgroundColor: { duration: 0.2 } }}
      />
    </>
  );
}
