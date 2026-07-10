/**
 * PaperCut — biomorphic paper-tearing effect.
 *
 * When the user scrolls, the cursor acts as a knife dragging through paper.
 * A torn path is traced exactly along the cursor's trajectory — any direction,
 * any shape — with two ragged edges that open up and eventually heal/fade.
 *
 * Visual anatomy of one tear:
 *   · Two irregular parallel curves (top & bottom paper edge)
 *   · Each edge has its own organic wobble (different frequency + phase)
 *   · The gap between them widens after the cut, then fades out
 *   · Soft shadow cast from each edge toward the gap (depth illusion)
 *   · A hairline white highlight on the top edge (light catching the curl)
 */
import { useEffect, useRef } from "react";

/* ── Types ──────────────────────────────────────────────────────────────── */
interface TearPoint {
  x:   number;
  y:   number;
  // pre-baked per-point perpendicular offsets (px)
  top: number;
  bot: number;
}

interface Tear {
  id:      number;
  pts:     TearPoint[];
  born:    number;        // performance.now() when created
  fadeAt:  number | null; // set when scroll stops, null while active
}

/* ── Config ─────────────────────────────────────────────────────────────── */
const FADE_DURATION = 1600;  // ms: fade-out after scroll stops
const MIN_DIST      = 4;     // px: min travel before adding a new point
const MAX_TEARS     = 12;    // max simultaneous tears
const SCROLL_LULL   = 80;    // ms after last scroll before sealing a tear

/* ── Seeded noise (LCG) — deterministic, no Math.random() in render loop ── */
function noise(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* ── Perpendicular direction at point i of a path ───────────────────────── */
function perp(pts: TearPoint[], i: number): [number, number] {
  const a = pts[Math.max(i - 1, 0)];
  const b = pts[Math.min(i + 1, pts.length - 1)];
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return [-dy / len, dx / len]; // rotate 90°
}

/* ── Draw a catmull-rom spline through pts ───────────────────────────────── */
function drawSpline(
  ctx: CanvasRenderingContext2D,
  pts: Array<{ x: number; y: number }>
) {
  if (pts.length < 2) return;
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
}

/* ── Build the two ragged edge arrays for a tear ────────────────────────── */
function buildEdges(pts: TearPoint[], gapScale: number) {
  const top: Array<{ x: number; y: number }> = [];
  const bot: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < pts.length; i++) {
    const [px, py] = perp(pts, i);
    const p = pts[i];

    // organic wobble layered on top of the base gap
    const waveTop = Math.sin(i * 0.72 + 1.3) * 0.9 + Math.sin(i * 1.9 + 0.5) * 0.4;
    const waveBot = Math.sin(i * 0.55 + 2.7) * 0.9 + Math.sin(i * 2.1 + 1.1) * 0.4;

    const tOff = (p.top + waveTop) * gapScale;
    const bOff = (p.bot + waveBot) * gapScale;

    top.push({ x: p.x + px * tOff, y: p.y + py * tOff });
    bot.push({ x: p.x - px * bOff, y: p.y - py * bOff });
  }
  return { top, bot };
}

/* ── Component ──────────────────────────────────────────────────────────── */
let _tearId = 0;

export function PaperCut() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const tearsRef     = useRef<Tear[]>([]);
  const activeRef    = useRef<Tear | null>(null);
  const mouseRef     = useRef({ x: -999, y: -999 });
  const rafRef       = useRef<number>(0);
  const scrollTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;

    /* resize */
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    /* track mouse */
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    /* seal the active tear when scroll stops */
    const sealActive = () => {
      if (activeRef.current && activeRef.current.fadeAt === null) {
        activeRef.current.fadeAt = performance.now();
      }
      activeRef.current = null;
    };

    /* on each scroll event, extend (or start) the active tear */
    const onScroll = () => {
      const { x, y } = mouseRef.current;
      const now = performance.now();

      // Start a new tear if none active or prev was already sealed
      if (!activeRef.current || activeRef.current.fadeAt !== null) {
        const tear: Tear = { id: _tearId++, pts: [], born: now, fadeAt: null };
        tearsRef.current.push(tear);
        if (tearsRef.current.length > MAX_TEARS) tearsRef.current.shift();
        activeRef.current = tear;
      }

      const tear = activeRef.current;
      const last = tear.pts[tear.pts.length - 1];

      // Only add a point if the cursor moved enough
      if (
        !last ||
        Math.hypot(x - last.x, y - last.y) >= MIN_DIST
      ) {
        const seed = tear.pts.length * 1000 + tear.id;
        tear.pts.push({
          x,
          y,
          // pre-bake per-point gap with some jaggedness
          top: 1.8 + noise(seed)       * 2.8,   // 1.8 – 4.6 px
          bot: 1.8 + noise(seed + 500) * 2.8,
        });
      }

      // Reset the seal timer on every scroll event
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(sealActive, SCROLL_LULL);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ── render loop ─────────────────────────────────────────────────── */
    const draw = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Expire finished tears
      tearsRef.current = tearsRef.current.filter(t => {
        if (t.fadeAt === null) return true; // still active
        return now - t.fadeAt < FADE_DURATION;
      });

      for (const tear of tearsRef.current) {
        if (tear.pts.length < 2) continue;

        // Gap opens up over first 400 ms after the cut starts, then stays
        const age         = now - tear.born;
        const openT       = Math.min(age / 400, 1);
        const gapScale    = 0.3 + openT * 0.7;  // 0.3 → 1.0

        // Fade alpha
        let alpha = 1;
        if (tear.fadeAt !== null) {
          alpha = 1 - (now - tear.fadeAt) / FADE_DURATION;
          alpha = Math.max(0, alpha);
        }

        const { top, bot } = buildEdges(tear.pts, gapScale);

        ctx.save();
        ctx.globalAlpha = alpha;

        /* ── top paper edge ─────────────────────────────────────── */
        ctx.beginPath();
        drawSpline(ctx, top);
        ctx.strokeStyle    = "rgba(15,23,42,0.45)";
        ctx.lineWidth      = 1.1;
        ctx.lineCap        = "round";
        ctx.lineJoin       = "round";
        ctx.shadowColor    = "rgba(0,0,0,0.22)";
        ctx.shadowBlur     = 5;
        ctx.shadowOffsetX  = 0;
        ctx.shadowOffsetY  = 2;
        ctx.stroke();

        /* ── hairline highlight on top edge (light catching curl) ── */
        ctx.beginPath();
        drawSpline(ctx, top.map(p => ({ x: p.x, y: p.y - 0.8 })));
        ctx.strokeStyle   = "rgba(255,255,255,0.55)";
        ctx.lineWidth     = 0.6;
        ctx.shadowBlur    = 0;
        ctx.shadowOffsetY = 0;
        ctx.stroke();

        /* ── bottom paper edge ──────────────────────────────────── */
        ctx.beginPath();
        drawSpline(ctx, bot);
        ctx.strokeStyle    = "rgba(15,23,42,0.25)";
        ctx.lineWidth      = 0.8;
        ctx.shadowColor    = "rgba(0,0,0,0.12)";
        ctx.shadowBlur     = 4;
        ctx.shadowOffsetY  = -1;
        ctx.stroke();

        /* ── erase the gap (the actual cut) ────────────────────── */
        // Draw a filled strip between top and bottom using destination-out
        if (top.length >= 2 && bot.length >= 2) {
          ctx.globalCompositeOperation = "destination-out";
          ctx.beginPath();
          // Go forward along top edge, backward along bottom edge
          ctx.moveTo(top[0].x, top[0].y);
          for (let i = 1; i < top.length; i++) {
            const prev = top[i - 1];
            const curr = top[i];
            ctx.quadraticCurveTo(
              (prev.x + curr.x) / 2,
              (prev.y + curr.y) / 2,
              curr.x, curr.y
            );
          }
          for (let i = bot.length - 1; i >= 0; i--) {
            const next = bot[Math.max(i - 1, 0)];
            const curr = bot[i];
            ctx.quadraticCurveTo(
              (next.x + curr.x) / 2,
              (next.y + curr.y) / 2,
              next.x, next.y
            );
          }
          ctx.closePath();
          ctx.fillStyle = "rgba(0,0,0,1)";
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";
        }

        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize",    resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll",    onScroll);
      cancelAnimationFrame(rafRef.current);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, []);

  return (
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
  );
}
