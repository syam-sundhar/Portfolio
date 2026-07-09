import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

/* ─── SVG torn-paper profiles at 1440 px wide ──────────────────────────────
   TOP_EDGE  : the ragged bottom of the strip (peaks point upward)
   BOT_EDGE  : the ragged top of the strip (peaks point downward)
───────────────────────────────────────────────────────────────────────────── */
const W       = 1440;
const STRIP_H = 72;
const TOP_Y   = 26;           // where the paper body starts
const BOT_Y   = STRIP_H - 22; // where the paper body ends

const TOP_EDGE: readonly (readonly [number, number])[] = [
  [0, TOP_Y],    [22, 8],  [44, 20], [68, 4],  [90, 16],  [114, 2],
  [138, 18],     [162, 6], [186, 22],[210, 4],  [234, 18], [258, 8],
  [282, 24],     [308, 6], [332, 20],[356, 4],  [380, 16], [404, 2],
  [430, 18],     [454, 8], [478, 22],[502, 4],  [526, 18], [550, 6],
  [574, 24],     [600, 4], [624, 20],[648, 6],  [672, 18], [696, 2],
  [720, 18],     [744, 8], [768, 22],[792, 4],  [816, 20], [840, 6],
  [866, 22],     [892, 4], [918, 18],[944, 8],  [970, 24], [996, 6],
  [1022, 20],  [1048, 4],[1074, 16],[1100, 2], [1126, 18],[1152, 8],
  [1178, 22],  [1204, 4],[1230, 20],[1256, 6], [1282, 18],[1308, 4],
  [1334, 20],  [1360, 8],[1386, 22],[1412, 6], [1440, 14],
];

const BOT_EDGE: readonly (readonly [number, number])[] = [
  [0, BOT_Y],           [24, STRIP_H - 6],  [48, STRIP_H - 18],
  [72, STRIP_H - 4],    [96, STRIP_H - 16], [120, STRIP_H - 2],
  [146, STRIP_H - 18], [170, STRIP_H - 8],  [194, STRIP_H - 22],
  [218, STRIP_H - 6],  [242, STRIP_H - 18], [266, STRIP_H - 4],
  [292, STRIP_H - 20], [316, STRIP_H - 8],  [340, STRIP_H - 22],
  [364, STRIP_H - 4],  [388, STRIP_H - 16], [414, STRIP_H - 2],
  [438, STRIP_H - 20], [462, STRIP_H - 8],  [486, STRIP_H - 22],
  [510, STRIP_H - 6],  [534, STRIP_H - 18], [560, STRIP_H - 4],
  [584, STRIP_H - 22], [608, STRIP_H - 8],  [632, STRIP_H - 18],
  [658, STRIP_H - 4],  [682, STRIP_H - 20], [706, STRIP_H - 6],
  [730, STRIP_H - 18], [754, STRIP_H - 8],  [778, STRIP_H - 22],
  [804, STRIP_H - 4],  [828, STRIP_H - 20], [852, STRIP_H - 6],
  [878, STRIP_H - 22], [904, STRIP_H - 4],  [930, STRIP_H - 18],
  [956, STRIP_H - 8],  [982, STRIP_H - 24], [1008, STRIP_H - 6],
  [1034, STRIP_H - 20],[1060, STRIP_H - 4], [1086, STRIP_H - 16],
  [1112, STRIP_H - 2], [1138, STRIP_H - 18],[1164, STRIP_H - 8],
  [1190, STRIP_H - 22],[1216, STRIP_H - 4], [1242, STRIP_H - 20],
  [1268, STRIP_H - 6], [1294, STRIP_H - 18],[1320, STRIP_H - 8],
  [1346, STRIP_H - 22],[1372, STRIP_H - 6], [1400, STRIP_H - 18],
  [1440, STRIP_H - 10],
];

function buildPath(
  points: readonly (readonly [number, number])[],
  closeTop: boolean,
): string {
  const [first, ...rest] = points;
  let d = `M${first[0]},${first[1]}`;
  for (const [x, y] of rest) d += ` L${x},${y}`;
  d += closeTop ? ` L${W},0 L0,0 Z` : ` L${W},${STRIP_H} L0,${STRIP_H} Z`;
  return d;
}

const topPath = buildPath(TOP_EDGE, true);
const botPath = buildPath(BOT_EDGE, false);

/* ─── fiber threads at the tear line (deterministic) ──────────────────────── */
const FIBERS = Array.from({ length: 14 }, (_, i) => ({
  x1: 90 + i * 90 + (i % 3) * 14,
  y1: TOP_Y - 4 + (i % 5) * 2,
  x2: 90 + i * 90 + (i % 3) * 14 + (i % 3 - 1) * 4,
  y2: TOP_Y + 4 + (i % 4) * 3,
  color: i % 2 === 0 ? "#94a3b8" : "#cbd5e1",
  width: i % 2 === 0 ? 0.7 : 1.0,
}));

/* ─── component ────────────────────────────────────────────────────────────── */
export function PaperTear() {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 90%", "end 10%"],
  });

  // Spring-smoothed progress for organic feel
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.6 });

  // 3-D peel: hinge at top, bottom lifts toward viewer then the strip flies up
  const rotateX = useTransform(smooth, [0, 0.55], [0, 22]);
  const y       = useTransform(smooth, [0.3, 0.85], [0, -STRIP_H * 2.5]);
  const opacity = useTransform(smooth, [0.55, 0.88], [1, 0]);
  const scaleX  = useTransform(smooth, [0, 0.55], [1, 1.015]);

  // Box shadow computed as a single interpolated string — no invalid style keys
  const boxShadow = useTransform(
    smooth,
    [0, 0.4, 0.85],
    [
      "0 3px 8px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
      "0 16px 32px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.09)",
      "0 2px 4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.02)",
    ],
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="relative z-20 pointer-events-none select-none overflow-visible"
      style={{ height: STRIP_H, marginTop: -STRIP_H / 2, marginBottom: -STRIP_H / 2 }}
    >
      <div className="sticky top-0" style={{ perspective: "1100px", perspectiveOrigin: "50% 0%" }}>
        <motion.div
          style={{
            rotateX,
            y,
            opacity,
            scaleX,
            boxShadow,
            transformOrigin: "top center",
          }}
        >
          <svg
            viewBox={`0 0 ${W} ${STRIP_H}`}
            xmlns="http://www.w3.org/2000/svg"
            className="w-full block"
            style={{ height: STRIP_H }}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`paperGrad`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#ffffff" />
                <stop offset="45%"  stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#f1f5f9" />
              </linearGradient>
            </defs>

            {/* Paper body between the two torn edges */}
            <rect x="0" y={TOP_Y} width={W} height={BOT_Y - TOP_Y} fill="url(#paperGrad)" />

            {/* Top torn flap */}
            <path d={topPath} fill="url(#paperGrad)" />

            {/* Bottom torn flap */}
            <path d={botPath} fill="url(#paperGrad)" />

            {/* Fiber threads at the top tear */}
            <g opacity="0.4" strokeLinecap="round">
              {FIBERS.map((f, i) => (
                <line
                  key={i}
                  x1={f.x1} y1={f.y1}
                  x2={f.x2} y2={f.y2}
                  stroke={f.color}
                  strokeWidth={f.width}
                />
              ))}
            </g>

            {/* Fiber threads at the bottom tear (mirrored offset) */}
            <g opacity="0.3" strokeLinecap="round">
              {FIBERS.map((f, i) => (
                <line
                  key={i}
                  x1={f.x1}
                  y1={BOT_Y + (f.y1 - TOP_Y) * 0.55}
                  x2={f.x2}
                  y2={BOT_Y + (f.y2 - TOP_Y) * 0.55}
                  stroke={f.color}
                  strokeWidth={f.width}
                />
              ))}
            </g>
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
