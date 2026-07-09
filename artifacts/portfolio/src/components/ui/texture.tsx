import { memo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/* ─── Paper grain via SVG feTurbulence ──────────────────────────────────────
   fractalNoise @ 0.65 frequency, 4 octaves = fine paper / film grain.
   Baked as a data URL so the browser caches it on the GPU after first paint.
─────────────────────────────────────────────────────────────────────────── */
const grainSvg = [
  `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">`,
  `<filter id="g">`,
  `<feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch"/>`,
  `<feColorMatrix type="saturate" values="0"/>`,
  `</filter>`,
  `<rect width="256" height="256" filter="url(%23g)"/>`,
  `</svg>`,
].join("");
const GRAIN_URL = `data:image/svg+xml,${encodeURIComponent(grainSvg)}`;

/* ─── Diagonal crosshatch (laid-paper feel) ─────────────────────────────── */
const hatchSvg = [
  `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">`,
  `<line x1="0" y1="40" x2="40" y2="0" stroke="%230f172a" stroke-width="0.5" stroke-opacity="0.10"/>`,
  `<line x1="-10" y1="10" x2="10" y2="-10" stroke="%230f172a" stroke-width="0.5" stroke-opacity="0.10"/>`,
  `<line x1="30" y1="50" x2="50" y2="30" stroke="%230f172a" stroke-width="0.5" stroke-opacity="0.10"/>`,
  `</svg>`,
].join("");
const HATCH_URL = `data:image/svg+xml,${encodeURIComponent(hatchSvg)}`;

/* ─── Component ─────────────────────────────────────────────────────────── */
export const Texture = memo(function Texture() {
  const { scrollY } = useScroll();

  /* Ink-wash blobs drift at different rates for parallax depth */
  const blob1Y = useTransform(scrollY, [0, 4000], [0, -420]);
  const blob2Y = useTransform(scrollY, [0, 4000], [0, -200]);
  const blob3Y = useTransform(scrollY, [0, 4000], [0, -640]);
  const blob4Y = useTransform(scrollY, [0, 4000], [0, -300]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 50 }}
    >
      {/* ── 1. Fine paper grain ───────────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${GRAIN_URL}")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
          opacity: 0.055,
          mixBlendMode: "multiply",
        }}
      />

      {/* ── 2. Diagonal crosshatch — laid / wove paper ───────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${HATCH_URL}")`,
          backgroundRepeat: "repeat",
          backgroundSize: "40px 40px",
          opacity: 0.3,
          mixBlendMode: "multiply",
        }}
      />

      {/* ── 3. Dot matrix — blueprint / Letraset feel ────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(15,23,42,0.10) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          opacity: 0.38,
          mixBlendMode: "multiply",
        }}
      />

      {/* ── 4. Corner burns — aged / handled paper ───────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 55% 45% at   0%   0%, rgba(0,0,0,0.07) 0%, transparent 100%)",
            "radial-gradient(ellipse 55% 45% at 100%   0%, rgba(0,0,0,0.07) 0%, transparent 100%)",
            "radial-gradient(ellipse 55% 45% at   0% 100%, rgba(0,0,0,0.07) 0%, transparent 100%)",
            "radial-gradient(ellipse 55% 45% at 100% 100%, rgba(0,0,0,0.07) 0%, transparent 100%)",
          ].join(", "),
          mixBlendMode: "multiply",
        }}
      />

      {/* ── 5. Ink-wash blobs — watercolor bleeds, scroll-parallaxed ─────── */}

      {/* Top-left — cobalt blue wash */}
      <motion.div
        style={{ y: blob1Y }}
        className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full"
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(37,99,235,0.05) 0%, rgba(37,99,235,0.01) 55%, transparent 75%)",
            filter: "blur(40px)",
            mixBlendMode: "multiply",
          }}
        />
      </motion.div>

      {/* Center-right — indigo wash */}
      <motion.div
        style={{ y: blob2Y }}
        className="absolute top-[35%] -right-40 w-[600px] h-[600px] rounded-full"
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.04) 0%, rgba(99,102,241,0.01) 55%, transparent 75%)",
            filter: "blur(60px)",
            mixBlendMode: "multiply",
          }}
        />
      </motion.div>

      {/* Bottom-left — sky wash */}
      <motion.div
        style={{ y: blob3Y }}
        className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] rounded-full"
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(14,165,233,0.045) 0%, rgba(14,165,233,0.01) 55%, transparent 75%)",
            filter: "blur(50px)",
            mixBlendMode: "multiply",
          }}
        />
      </motion.div>

      {/* Mid-center — warm slate wash to soften the pure white */}
      <motion.div
        style={{ y: blob4Y }}
        className="absolute top-[60%] left-[25%] w-[800px] h-[450px] rounded-full"
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              "radial-gradient(ellipse, rgba(203,213,225,0.07) 0%, transparent 70%)",
            filter: "blur(80px)",
            mixBlendMode: "multiply",
          }}
        />
      </motion.div>
    </div>
  );
});
