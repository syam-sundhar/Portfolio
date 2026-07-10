/**
 * PaperCut — Ultra-premium paper cutting & tearing interaction.
 *
 * Press + drag anywhere on the page to drag a precision X-Acto knife
 * through the paper. The knife follows the cursor exactly — curves, loops,
 * zigzags, circles. Fast drag triggers tear mode instead of a clean slice.
 *
 * Visual anatomy:
 *   · Catmull-Rom spline through every recorded cursor point
 *   · FBM (fractal Brownian motion) noise → organic ragged edges per cut
 *   · Two independent noisy edge curves — no two cuts look alike
 *   · Paper fibers bridging the gap (longer + wilder in tear mode)
 *   · Microscopic paper-dust particles that fall under gravity
 *   · Ambient shadow in the gap + curl highlight on the top edge
 *   · Spring-animated gap that opens then slowly fades over 2 s
 *   · X-Acto knife SVG cursor rotates in real-time with drag angle
 */
import { useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────
type Pt = { x: number; y: number };

interface Fiber {
  x: number; y: number;    // start
  cx: number; cy: number;  // bezier control
  ex: number; ey: number;  // end
  op: number;              // base opacity
  w: number;               // line width
}

interface Dust {
  x: number; y: number;
  vx: number; vy: number;
  w: number; h: number;
  r: number; rv: number;   // rotation, angular velocity
  op: number;
}

interface CutRecord {
  id:      number;
  raw:     Pt[];           // raw mouse points during drag
  spline:  Pt[] | null;    // catmull-rom — null while dragging
  fibers:  Fiber[];
  dust:    Dust[];
  seed:    number;
  born:    number;         // performance.now() at first point
  fadeAt:  number | null;  // set on mouseup + 200 ms delay
  tear:    boolean;        // true = fast drag → tear mode
  velPeak: number;         // peak smoothed velocity during drag
}

// ─── Noise ────────────────────────────────────────────────────────────────
/** Deterministic hash → [0, 1) */
function h(n: number): number {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return v - Math.floor(v);
}

/** 1-D fractional Brownian motion, output ≈ [−1, 1] */
function fbm(x: number, seed: number, octaves = 5): number {
  let val = 0, amp = 0.5, freq = 1, wt = 0;
  for (let i = 0; i < octaves; i++) {
    const xi = Math.floor(x * freq);
    const xf = x * freq - xi;
    const u  = xf * xf * (3 - 2 * xf);           // smoothstep
    const n0 = h(xi     + seed + i * 1973) * 2 - 1;
    const n1 = h(xi + 1 + seed + i * 1973) * 2 - 1;
    val += (n0 * (1 - u) + n1 * u) * amp;
    wt  += amp;
    amp  *= 0.5;
    freq *= 2.07;                                  // slightly non-integer → richer
  }
  return val / wt;
}

// ─── Geometry ─────────────────────────────────────────────────────────────
/** Catmull-Rom spline — returns subdivided smooth curve (8 pts per segment). */
function catmull(pts: Pt[]): Pt[] {
  if (pts.length < 2) return [...pts];
  const out: Pt[] = [];
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, n - 1)];
    for (let j = 0; j < 8; j++) {
      const t  = j / 8, t2 = t * t, t3 = t2 * t;
      out.push({
        x: 0.5*((-p0.x+3*p1.x-3*p2.x+p3.x)*t3+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+p2.x)*t)+p1.x,
        y: 0.5*((-p0.y+3*p1.y-3*p2.y+p3.y)*t3+(2*p0.y-5*p1.y+4*p2.y-p3.y)*t2+(-p0.y+p2.y)*t)+p1.y,
      });
    }
  }
  out.push(pts[n - 1]);
  return out;
}

/** Perpendicular unit vector at index i of a polyline. */
function perp(pts: Pt[], i: number): [number, number] {
  const a = pts[Math.max(i - 1, 0)];
  const b = pts[Math.min(i + 1, pts.length - 1)];
  const dx = b.x - a.x, dy = b.y - a.y;
  const l  = Math.sqrt(dx * dx + dy * dy) || 1;
  return [-dy / l, dx / l];
}

/** Build two noisy edge curves from a smooth spline. */
function buildEdges(
  spl: Pt[], gap: number, seed: number, tear: boolean
): { top: Pt[]; bot: Pt[] } {
  const top: Pt[] = [], bot: Pt[] = [];
  const noiseAmp  = tear ? 5.5  : 2.2;
  const noiseFreq = tear ? 0.04 : 0.08;
  const microAmp  = tear ? 2.2  : 0.4;    // high-freq micro-jags
  const microFreq = tear ? 0.012 : 0.025;

  for (let i = 0; i < spl.length; i++) {
    const t         = i / Math.max(spl.length - 1, 1);
    const [px, py]  = perp(spl, i);
    const p         = spl[i];

    // FBM for large organic shape
    const nTop  = fbm(t / noiseFreq, seed,        5) * noiseAmp;
    const nBot  = fbm(t / noiseFreq, seed + 8888, 5) * noiseAmp;
    // High-freq micro for jaggedness
    const mTop  = fbm(t / microFreq, seed + 1111, 3) * microAmp;
    const mBot  = fbm(t / microFreq, seed + 2222, 3) * microAmp;

    const offTop = gap + nTop + mTop;
    const offBot = gap + nBot + mBot;

    top.push({ x: p.x + px * offTop, y: p.y + py * offTop });
    bot.push({ x: p.x - px * offBot, y: p.y - py * offBot });
  }
  return { top, bot };
}

/** Stroke a smooth path using midpoint quadratics (no extra library). */
function strokeSmooth(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    ctx.quadraticCurveTo(
      pts[i].x, pts[i].y,
      (pts[i].x + pts[i + 1].x) / 2,
      (pts[i].y + pts[i + 1].y) / 2,
    );
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
}

// ─── Factory helpers ───────────────────────────────────────────────────────
function makeFibers(spl: Pt[], seed: number, tear: boolean): Fiber[] {
  const out: Fiber[] = [];
  const density    = tear ? 5 : 9;           // pt spacing in spline
  const maxLen     = tear ? 9  : 3.5;
  const baseLen    = tear ? 2.5 : 0.8;

  for (let i = 0; i < spl.length; i += density) {
    const p         = spl[i];
    const [px, py]  = perp(spl, i);
    const s         = seed + i;

    for (let side = -1; side <= 1; side += 2) {
      const startOff = (0.5 + h(s + side * 300) * 1.5) * side;
      const len      = baseLen + h(s + side * 500 + 1) * maxLen;
      const devAngle = (h(s + side * 700 + 2) - 0.5) * (tear ? 0.9 : 0.45);
      const cos_d    = Math.cos(devAngle), sin_d = Math.sin(devAngle);
      const fx       = px * cos_d - py * sin_d;
      const fy       = px * sin_d + py * cos_d;

      const sx = p.x + px * startOff;
      const sy = p.y + py * startOff;

      out.push({
        x:  sx, y:  sy,
        cx: sx + fx * len * 0.45 + (h(s + 900) - 0.5) * 1.5,
        cy: sy + fy * len * 0.45 + (h(s + 901) - 0.5) * 1.5,
        ex: sx + fx * len,
        ey: sy + fy * len,
        op: 0.2 + h(s + 400) * 0.55,
        w:  tear ? 0.5 : 0.3,
      });
    }
  }
  return out;
}

function makeDust(spl: Pt[], seed: number): Dust[] {
  const out: Dust[] = [];
  for (let i = 0; i < 50; i++) {
    const idx = (h(seed + i * 31) * spl.length) | 0;
    const p   = spl[Math.min(idx, spl.length - 1)];
    out.push({
      x:  p.x + (h(seed + i * 11) - 0.5) * 10,
      y:  p.y + (h(seed + i * 13) - 0.5) * 10,
      vx: (h(seed + i * 17) - 0.5) * 2.2,
      vy: -(0.5 + h(seed + i * 19) * 2.0),
      w:  0.5 + h(seed + i * 23) * 2.8,
      h:  0.3 + h(seed + i * 29) * 1.5,
      r:  h(seed + i * 37) * Math.PI * 2,
      rv: (h(seed + i * 41) - 0.5) * 0.28,
      op: 0.35 + h(seed + i * 43) * 0.65,
    });
  }
  return out;
}

// ─── Component ────────────────────────────────────────────────────────────
let _nextId = 0;
const FADE_DURATION = 2000; // ms

export function PaperCut() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const knifeRef    = useRef<HTMLDivElement>(null);
  const cutsRef     = useRef<CutRecord[]>([]);
  const activeRef   = useRef<CutRecord | null>(null);
  const rafRef      = useRef<number>(0);
  const prevRef     = useRef<Pt>({ x: 0, y: 0 });
  const velRef      = useRef(0);
  const angleRef    = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // ── Knife cursor helpers ───────────────────────────────────────────
    const positionKnife = (x: number, y: number, angle: number) => {
      const el = knifeRef.current;
      if (!el) return;
      el.style.left      = x + "px";
      el.style.top       = y + "px";
      el.style.transform = `translate(-50%, -100%) rotate(${angle}rad)`;
    };
    const showKnife = (x: number, y: number) => {
      const el = knifeRef.current;
      if (!el) return;
      el.style.opacity = "1";
      positionKnife(x, y, angleRef.current);
    };
    const hideKnife = () => {
      const el = knifeRef.current;
      if (el) el.style.opacity = "0";
    };

    // ── Mouse handlers ─────────────────────────────────────────────────
    const onDown = (e: MouseEvent) => {
      const pt: Pt = { x: e.clientX, y: e.clientY };
      prevRef.current = pt;
      velRef.current  = 0;

      const cut: CutRecord = {
        id:      _nextId++,
        raw:     [pt],
        spline:  null,
        fibers:  [],
        dust:    [],
        seed:    (Math.random() * 99999) | 0,
        born:    performance.now(),
        fadeAt:  null,
        tear:    false,
        velPeak: 0,
      };
      activeRef.current = cut;
      cutsRef.current.push(cut);
      if (cutsRef.current.length > 16) cutsRef.current.shift();
      showKnife(e.clientX, e.clientY);
    };

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - prevRef.current.x;
      const dy = e.clientY - prevRef.current.y;
      const spd = Math.sqrt(dx * dx + dy * dy);

      // Update knife angle from movement direction
      if (spd > 0.8) {
        angleRef.current = Math.atan2(dy, dx) + Math.PI / 2;
      }

      const cut = activeRef.current;
      if (cut) {
        positionKnife(e.clientX, e.clientY, angleRef.current);

        // Track velocity with exponential smoothing
        velRef.current  = velRef.current * 0.6 + spd * 0.4;
        cut.velPeak     = Math.max(cut.velPeak, velRef.current);

        // Record path — min distance threshold to avoid redundant points
        const last = cut.raw[cut.raw.length - 1];
        if (Math.hypot(e.clientX - last.x, e.clientY - last.y) >= 3) {
          cut.raw.push({ x: e.clientX, y: e.clientY });
        }
      }

      prevRef.current = { x: e.clientX, y: e.clientY };
    };

    const onUp = () => {
      const cut = activeRef.current;
      if (!cut) return;
      activeRef.current = null;
      hideKnife();

      if (cut.raw.length < 2) {
        cutsRef.current = cutsRef.current.filter(c => c !== cut);
        return;
      }

      // Determine mode from peak velocity
      cut.tear   = cut.velPeak > 18;
      cut.spline = catmull(cut.raw);

      // Pre-generate fibers and dust on the finalized spline
      cut.fibers = makeFibers(cut.spline, cut.seed, cut.tear);
      cut.dust   = makeDust(cut.spline, cut.seed);

      // Brief moment to admire the cut before fading
      setTimeout(() => {
        if (cut.fadeAt === null) cut.fadeAt = performance.now();
      }, 220);
    };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseup",   onUp);

    // ── Render loop ────────────────────────────────────────────────────
    const draw = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Retire expired cuts
      cutsRef.current = cutsRef.current.filter(c =>
        c.fadeAt === null || now - c.fadeAt < FADE_DURATION
      );

      for (const cut of cutsRef.current) {
        if (cut.raw.length < 2) continue;

        // ── Live preview (dragging — no spline yet) ─────────────────
        if (cut.spline === null) {
          const live = catmull(cut.raw);
          ctx.save();
          ctx.beginPath();
          strokeSmooth(ctx, live);
          ctx.strokeStyle = "rgba(15,12,8,0.22)";
          ctx.lineWidth   = 0.8;
          ctx.setLineDash([3, 5]);
          ctx.lineCap     = "round";
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
          continue;
        }

        // ── Completed cut ───────────────────────────────────────────
        const spl = cut.spline;

        // Alpha — smooth quadratic ease-out over 2 s
        let alpha = 1;
        if (cut.fadeAt !== null) {
          const t = Math.min((now - cut.fadeAt) / FADE_DURATION, 1);
          alpha   = (1 - t) * (1 - t);
          if (alpha <= 0.005) continue;
        }

        // Gap spring-open: reaches full width after ~450 ms
        const age    = now - cut.born;
        const openT  = Math.min(age / 450, 1);
        const easeT  = openT < 0.5
          ? 2 * openT * openT
          : 1 - Math.pow(-2 * openT + 2, 2) / 2;   // ease-in-out quad
        const baseGap = (cut.tear ? 3.5 : 2.0) * (0.15 + easeT * 0.85);

        const { top, bot } = buildEdges(spl, baseGap, cut.seed, cut.tear);

        ctx.save();
        ctx.globalAlpha = alpha;

        // ── Layer 1: Ambient shadow in the gap ─────────────────────
        // Wide soft stroke along center spline creates depth
        ctx.beginPath();
        strokeSmooth(ctx, spl);
        ctx.lineWidth    = baseGap * 6;
        ctx.strokeStyle  = "rgba(0,0,0,0.001)";   // invisible stroke for shadow
        ctx.shadowColor  = "rgba(0,0,0,0.22)";
        ctx.shadowBlur   = baseGap * 4;
        ctx.stroke();
        ctx.shadowBlur   = 0;

        // ── Layer 2: Clear the actual gap (destination-out) ─────────
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        // Trace forward along top edge, backward along bottom
        if (top.length > 1 && bot.length > 1) {
          ctx.moveTo(top[0].x, top[0].y);
          for (let i = 1; i < top.length - 1; i++) {
            ctx.quadraticCurveTo(
              top[i].x, top[i].y,
              (top[i].x + top[i+1].x) / 2,
              (top[i].y + top[i+1].y) / 2
            );
          }
          ctx.lineTo(top[top.length-1].x, top[top.length-1].y);
          for (let i = bot.length - 1; i >= 1; i--) {
            ctx.quadraticCurveTo(
              bot[i].x, bot[i].y,
              (bot[i].x + bot[i-1].x) / 2,
              (bot[i].y + bot[i-1].y) / 2
            );
          }
          ctx.lineTo(bot[0].x, bot[0].y);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // ── Layer 3: Top paper edge ─────────────────────────────────
        ctx.beginPath();
        strokeSmooth(ctx, top);
        ctx.strokeStyle   = cut.tear
          ? "rgba(28,18,10,0.58)"
          : "rgba(22,16,8,0.50)";
        ctx.lineWidth     = cut.tear ? 1.3 : 0.9;
        ctx.lineCap       = "round";
        ctx.lineJoin      = "round";
        ctx.shadowColor   = "rgba(0,0,0,0.30)";
        ctx.shadowBlur    = 5;
        ctx.shadowOffsetY = 2.5;
        ctx.stroke();
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

        // Light curl highlight — creamy white edge where paper peels up
        ctx.beginPath();
        strokeSmooth(ctx, top.map(p => ({ x: p.x, y: p.y - 1.1 })));
        ctx.strokeStyle = "rgba(255,250,238,0.80)";
        ctx.lineWidth   = 0.7;
        ctx.stroke();

        // ── Layer 4: Bottom paper edge ──────────────────────────────
        ctx.beginPath();
        strokeSmooth(ctx, bot);
        ctx.strokeStyle   = cut.tear
          ? "rgba(28,18,10,0.42)"
          : "rgba(22,16,8,0.30)";
        ctx.lineWidth     = cut.tear ? 0.9 : 0.6;
        ctx.shadowColor   = "rgba(0,0,0,0.15)";
        ctx.shadowBlur    = 3;
        ctx.shadowOffsetY = -1.5;
        ctx.stroke();
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

        // ── Layer 5: Paper fibers ───────────────────────────────────
        for (const f of cut.fibers) {
          ctx.beginPath();
          ctx.moveTo(f.x, f.y);
          ctx.quadraticCurveTo(f.cx, f.cy, f.ex, f.ey);
          ctx.strokeStyle = `rgba(148,120,82,${f.op})`;
          ctx.lineWidth   = f.w;
          ctx.stroke();
        }

        // ── Layer 6: Paper-dust particles ───────────────────────────
        if (cut.fadeAt !== null) {
          for (const d of cut.dust) {
            d.x  += d.vx;
            d.y  += d.vy;
            d.vy += 0.06;   // gravity
            d.vx *= 0.98;   // air drag
            d.r  += d.rv;
            d.op -= 0.0065;
            if (d.op <= 0) continue;
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(d.r);
            ctx.globalAlpha = Math.min(alpha, d.op);
            ctx.fillStyle   = h(d.x * 0.1 + d.y) > 0.5 ? "#ddd0b8" : "#c8bb9e";
            ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
            ctx.restore();
          }
        }

        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize",    resize);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {/* Canvas overlay for all cut rendering */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position:      "fixed",
          inset:         0,
          pointerEvents: "none",
          zIndex:        9998,
        }}
      />

      {/* X-Acto knife cursor — appears on mousedown, rotates with drag angle */}
      <div
        ref={knifeRef}
        aria-hidden="true"
        style={{
          position:        "fixed",
          zIndex:          10001,
          pointerEvents:   "none",
          opacity:         0,
          transformOrigin: "50% 100%",
          transition:      "opacity 0.12s ease",
          willChange:      "transform",
        }}
      >
        <KnifeSVG />
      </div>
    </>
  );
}

// ─── X-Acto Knife SVG ────────────────────────────────────────────────────
// Blade tip is at the bottom-center (50%, 100%) — transform-origin is there
// so rotation anchors exactly at the cutting point on the cursor.
function KnifeSVG() {
  return (
    <svg
      width="22"
      height="68"
      viewBox="0 0 22 68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {/* ── Handle body ── */}
      <rect x="7" y="0" width="8" height="30" rx="4" fill="#191919" />
      {/* Handle grip grooves */}
      <rect x="7" y="5"  width="8" height="1.1" rx="0.55" fill="#2a2a2a" />
      <rect x="7" y="9"  width="8" height="1.1" rx="0.55" fill="#2a2a2a" />
      <rect x="7" y="13" width="8" height="1.1" rx="0.55" fill="#2a2a2a" />
      <rect x="7" y="17" width="8" height="1.1" rx="0.55" fill="#2a2a2a" />
      <rect x="7" y="21" width="8" height="1.1" rx="0.55" fill="#2a2a2a" />
      <rect x="7" y="25" width="8" height="1.1" rx="0.55" fill="#252525" />
      {/* Handle side highlight */}
      <line x1="7.5" y1="1" x2="7.5" y2="29" stroke="rgba(255,255,255,0.07)" strokeWidth="0.7" />

      {/* ── Ferrule (handle-to-blade collar) ── */}
      <rect x="6.5" y="28" width="9" height="6" rx="1" fill="#6e6e6e" />
      <rect x="6.5" y="29.5" width="9" height="1" fill="#8a8a8a" />
      <rect x="6.5" y="32"   width="9" height="0.5" fill="#5a5a5a" />

      {/* ── Blade (long precision taper ending at a sharp tip) ── */}
      {/* Blade body — slightly wedge shaped */}
      <path
        d="M 9.2 34 L 12.8 34 L 11.3 64.5 L 11 66.5 L 10.7 64.5 Z"
        fill="#c4c4c4"
      />
      {/* Left bevel (sharp edge) — brighter */}
      <path
        d="M 9.2 34 L 10.7 64.5 L 11 66.5 Z"
        fill="#dedede"
      />
      {/* Right bevel — slightly darker (back of blade) */}
      <path
        d="M 12.8 34 L 11.3 64.5 L 11 66.5 Z"
        fill="#b2b2b2"
      />
      {/* Edge highlight — light catching the honed edge */}
      <line
        x1="10.3" y1="35"
        x2="11"   y2="66"
        stroke="rgba(255,255,255,0.80)"
        strokeWidth="0.4"
      />
      {/* Spine shadow */}
      <line
        x1="12.2" y1="35"
        x2="11.2"  y2="65"
        stroke="rgba(0,0,0,0.20)"
        strokeWidth="0.4"
      />
      {/* Tip gleam */}
      <circle cx="11" cy="66.5" r="0.6" fill="rgba(255,255,255,0.95)" />
    </svg>
  );
}
