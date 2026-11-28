import { BAYER, blur, buildMask, EMBER, fontSize, INK, placeCanvas, rng } from "./mask";
import type { Engine, EngineCtx } from "./types";

/*
 * Associative memory. The cells around the title form a Hopfield network (Hopfield 1982) whose
 * Hebbian weights store the printed title plus a few random memories. The weights are never
 * materialised: with W = (1/N) Σ ξᵘ ξᵘᵀ the local field is h_i = Σ_μ ξᵢᵘ m_μ, where m_μ is the
 * overlap of the current state with memory μ, kept up to date on every flip.
 *
 * The network starts from the title with a large share of its cells flipped and runs
 * asynchronous Glauber dynamics until it falls into the stored minimum. Ink is a cell that is
 * on and belongs to the title; ember is a cell that is on but shouldn't be. Moving the pointer
 * scrambles the cells under it, and the network repairs them.
 */

const DECOYS = 3;

export function createMemory({ canvas, h1, params, reduce, seed }: EngineCtx): Engine | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const cell = Math.max(2, Math.round(fontSize(h1) / 28));
  const m = buildMask(h1, cell, 6, 1);
  if (!m) return null;
  placeCanvas(canvas, m);
  canvas.style.imageRendering = "pixelated";
  const { cols, rows, cov } = m;
  const rand = rng(seed);

  // neurons: every cell on or near a glyph
  const halo = blur(cov, cols, rows, 2);
  const where: number[] = [];
  const id = new Int32Array(cols * rows).fill(-1);
  for (let i = 0; i < cov.length; i++) if (cov[i] > 0.01 || halo[i] > 0.06) { id[i] = where.length; where.push(i); }
  const N = where.length;
  if (!N) return null;
  const P = 1 + DECOYS;
  const xi = new Int8Array(P * N);
  for (let n = 0; n < N; n++) {
    const i = where[n], x = i % cols, y = (i / cols) | 0;
    xi[n] = cov[i] > BAYER[((y & 7) << 3) | (x & 7)] ? 1 : -1;
    for (let mu = 1; mu < P; mu++) xi[mu * N + n] = rand() < 0.5 ? 1 : -1;
  }
  const s = new Int8Array(N);
  for (let n = 0; n < N; n++) s[n] = reduce ? xi[n] : rand() < params.noise ? -xi[n] : xi[n];
  const ov = new Float64Array(P);
  const recount = () => {
    ov.fill(0);
    for (let mu = 0; mu < P; mu++) { let a = 0; for (let n = 0; n < N; n++) a += xi[mu * N + n] * s[n]; ov[mu] = a / N; }
  };
  recount();

  const img = ctx.createImageData(cols, rows);
  const d = img.data;
  const draw = () => {
    for (let n = 0; n < N; n++) {
      const o = where[n] * 4;
      if (s[n] > 0) {
        // ink is a correct "on"; ember, lighter, is an error the network still has to repair
        const ok = xi[n] > 0, c = ok ? INK : EMBER;
        d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = ok ? 255 : 150;
      } else d[o + 3] = 0;
    }
    ctx.putImageData(img, 0, 0);
  };

  const T = params.temp;
  const perFrame = Math.max(50, Math.round((N / 160) * params.speed));
  // asynchronous updates in a shuffled sweep order, so every cell is visited once per sweep
  const order = new Int32Array(N);
  for (let n = 0; n < N; n++) order[n] = n;
  for (let n = N - 1; n > 0; n--) { const j = (rand() * (n + 1)) | 0; const t = order[n]; order[n] = order[j]; order[j] = t; }
  let cursor = 0;
  let calm = 0, last = performance.now();
  let scratch: { x: number; y: number } | null = null;

  const update = (n: number) => {
    let h = 0;
    for (let mu = 0; mu < P; mu++) { const v = xi[mu * N + n]; h += v * (ov[mu] - (v * s[n]) / N); }
    const next = T <= 0.001 ? (h >= 0 ? 1 : -1) : rand() < 1 / (1 + Math.exp((-2 * h) / T)) ? 1 : -1;
    if (next === s[n]) return 0;
    s[n] = next;
    for (let mu = 0; mu < P; mu++) ov[mu] += (2 * next * xi[mu * N + n]) / N;
    return 1;
  };

  return {
    tick(now) {
      if (reduce) { draw(); return false; }
      if (scratch) {
        // scramble a disc under the pointer
        const r = Math.max(4, rows * 0.22), cx = scratch.x, cy = scratch.y;
        for (let y = Math.max(0, Math.floor(cy - r)); y < Math.min(rows, cy + r); y++) {
          for (let x = Math.max(0, Math.floor(cx - r)); x < Math.min(cols, cx + r); x++) {
            const n = id[y * cols + x];
            if (n < 0 || (x - cx) ** 2 + (y - cy) ** 2 > r * r || rand() > 0.5) continue;
            const v = (rand() < 0.5 ? 1 : -1) as 1 | -1;
            if (v !== s[n]) { s[n] = v; for (let mu = 0; mu < P; mu++) ov[mu] += (2 * v * xi[mu * N + n]) / N; }
          }
        }
        scratch = null;
        calm = 0;
        last = now;
      }
      let flips = 0;
      for (let k = 0; k < perFrame; k++) { flips += update(order[cursor]); cursor = (cursor + 1) % N; }
      draw();
      calm = flips ? 0 : calm + 1;
      // settled: no flips for a while at zero temperature, or a fixed run when it's noisy
      return T <= 0.001 ? calm < 60 : now - last < 9000;
    },
    pointer(p) {
      if (p) scratch = { x: (p.x + m.pad) / cell, y: (p.y + m.pad) / cell };
    },
    dispose() {},
  };
}
