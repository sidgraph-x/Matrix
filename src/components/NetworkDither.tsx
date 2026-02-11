"use client";

import { useEffect, useRef } from "react";

// ── Hash-based noise ──
function smoothNoise3(x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const sz = fz * fz * (3 - 2 * fz);

  const h = (a: number, b: number, c: number) => {
    let v = a * 374761393 + b * 668265263 + c * 1274126177;
    v = (v ^ (v >> 13)) * 1274126177;
    return ((v ^ (v >> 16)) & 0x7fffffff) / 0x7fffffff;
  };

  const n00 = h(ix, iy, iz) * (1 - sx) + h(ix + 1, iy, iz) * sx;
  const n10 = h(ix, iy + 1, iz) * (1 - sx) + h(ix + 1, iy + 1, iz) * sx;
  const n01 = h(ix, iy, iz + 1) * (1 - sx) + h(ix + 1, iy, iz + 1) * sx;
  const n11 = h(ix, iy + 1, iz + 1) * (1 - sx) + h(ix + 1, iy + 1, iz + 1) * sx;

  const ny0 = n00 * (1 - sy) + n10 * sy;
  const ny1 = n01 * (1 - sy) + n11 * sy;

  return ny0 * (1 - sz) + ny1 * sz;
}

function fbm3(x: number, y: number, z: number): number {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < 4; i++) {
    v += a * smoothNoise3(x * f, y * f, z * f);
    a *= 0.5;
    f *= 2.0;
  }
  return v;
}

// ── Voronoi seeds ──
interface VoronoiSeed {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
}

function generateSeeds(count: number, gw: number, gh: number): VoronoiSeed[] {
  const seeds: VoronoiSeed[] = [];
  for (let i = 0; i < count; i++) {
    let h1 = ((i * 7 + 3) * 1274126177 + (i * 13 + 7) * 668265263) ^ 0x5bd1e995;
    h1 = (h1 >>> 0);
    let h2 = ((i * 7 + 3) * 374761393 + (i * 13 + 7) * 1103515245) ^ 0x5bd1e995;
    h2 = (h2 >>> 0);
    const rx = (h1 & 0x7fffffff) / 0x7fffffff;
    const ry = (h2 & 0x7fffffff) / 0x7fffffff;
    seeds.push({ x: rx * gw, y: ry * gh, baseX: rx * gw, baseY: ry * gh });
  }
  return seeds;
}

export default function NetworkDither() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const COLS = 200;
    const ROWS = 140;
    const SEED_COUNT = 28;

    let seeds: VoronoiSeed[] = [];

    // Precomputed static noise per grid point (doesn't change per frame)
    let noiseGrid: Float32Array = new Float32Array(COLS * ROWS);

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seeds = generateSeeds(SEED_COUNT, w, h);

      // Precompute noise once
      noiseGrid = new Float32Array(COLS * ROWS);
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const nx = col / (COLS - 1);
          const ny = row / (ROWS - 1);
          noiseGrid[row * COLS + col] = fbm3(nx * 3.5 + 1.7, ny * 3.5 + 2.3, 0);
        }
      }
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, w, h);
      const t = time * 0.00025;

      // Animate seeds — slow organic drift
      for (const seed of seeds) {
        const ox = smoothNoise3(seed.baseX * 0.004, seed.baseY * 0.004, t) - 0.5;
        const oy = smoothNoise3(seed.baseX * 0.004 + 50, seed.baseY * 0.004 + 50, t) - 0.5;
        seed.x = seed.baseX + ox * 50;
        seed.y = seed.baseY + oy * 50;
      }

      const heightScale = 28;
      const seedCount = seeds.length;

      // Precompute seed positions for fast access
      const sx = new Float32Array(seedCount);
      const sy = new Float32Array(seedCount);
      for (let s = 0; s < seedCount; s++) {
        sx[s] = seeds[s].x;
        sy[s] = seeds[s].y;
      }

      for (let row = 0; row < ROWS; row++) {
        const ny = row / (ROWS - 1);

        for (let col = 0; col < COLS; col++) {
          const nx = col / (COLS - 1);
          const idx = row * COLS + col;

          const baseX = nx * w;
          const baseY = ny * h;

          // Voronoi: find 2 nearest seeds (inlined for perf)
          let d1 = Infinity;
          let d2 = Infinity;
          for (let s = 0; s < seedCount; s++) {
            const dx = baseX - sx[s];
            const dy = baseY - sy[s];
            const d = dx * dx + dy * dy; // skip sqrt, compare squared
            if (d < d1) {
              d2 = d1;
              d1 = d;
            } else if (d < d2) {
              d2 = d;
            }
          }
          d1 = Math.sqrt(d1);
          d2 = Math.sqrt(d2);

          // Ridge value
          const maxDist = Math.max(w, h) * 0.16;
          const ridgeRaw = 1 - Math.min(1, (d2 - d1) / (maxDist * 0.25));
          const ridge = ridgeRaw * ridgeRaw * ridgeRaw;

          // Static noise for organic variation
          const noiseVal = noiseGrid[idx];

          // Height for Y displacement
          const heightVal = ridge * 0.75 + noiseVal * 0.25;

          // Screen position with height displacement
          const screenX = baseX + (noiseVal - 0.5) * (w / COLS) * 0.4;
          const screenY = baseY - heightVal * heightScale;

          // Brightness: ridges glow, valleys dim
          const baseBright = 0.06 + noiseVal * 0.1;
          const brightness = baseBright + ridge * 0.88;

          // Dot size
          const dotSize = 0.25 + ridge * 2.0 + noiseVal * 0.3;

          // Depth-based fade
          const depthFade = 0.55 + ny * 0.45;
          const alpha = Math.min(1, brightness * depthFade);

          if (alpha < 0.025) continue;

          // Color: green with brightness variation
          const g = Math.min(255, 140 + Math.floor(brightness * 115));
          const r = Math.floor(brightness * 40);
          const b = Math.floor(brightness * 15);

          ctx.beginPath();
          ctx.arc(screenX, screenY, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.fill();

          // Subtle glow halo on strong ridges
          if (ridge > 0.55) {
            ctx.beginPath();
            ctx.arc(screenX, screenY, dotSize * 3.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 100, ${alpha * 0.035})`;
            ctx.fill();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    resize();
    animRef.current = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
