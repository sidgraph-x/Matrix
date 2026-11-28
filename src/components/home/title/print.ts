import { BAYER, buildMask, EMBER, fontSize, INK, placeCanvas } from "./mask";
import type { Engine, EngineCtx } from "./types";

/*
 * Quantised print. One bit per cell, thresholded against an 8×8 Bayer matrix. Each glyph is solid
 * through its upper half and thins into halftone towards its foot. On load a thin ember print
 * head lays the title down left to right; a fine pointer lifts the ink under it into halftone.
 */

const INTRO_MS = 1300;

export function createPrint({ canvas, h1, params, reduce }: EngineCtx): Engine | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const cell = Math.max(2, Math.round(fontSize(h1) / params.density));
  const m = buildMask(h1, cell, 6, params.fade);
  if (!m) return null;
  placeCanvas(canvas, m);
  canvas.style.imageRendering = "pixelated";
  const { cols, rows, cov } = m;
  const img = ctx.createImageData(cols, rows);
  const d = img.data;
  const t0 = performance.now();
  // the cursor "lens": eased position and radius in cells
  const L = { x: cols * 1.2, y: -rows, r: 0 };
  let goal = { x: L.x, y: L.y, r: 0 };

  const draw = (reveal: number) => {
    const front = reveal * (cols + 80) - 40;
    const invR = 1 / Math.max(1, L.r);
    for (let y = 0; y < rows; y++) {
      const dy = (y - L.y) * 1.7;
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const c = cov[i];
        let ink = 0, glow = 0;
        if (c > 0.01 || reveal < 1) {
          const dx = x - L.x;
          let l = 1 - Math.sqrt(dx * dx + dy * dy) * invR;
          l = l <= 0 ? 0 : l * l * (3 - 2 * l);
          ink = c * (1 - 0.5 * l);
          if (reveal < 1) {
            ink *= Math.min(1, Math.max(0, (front - x) / 14));
            // the print head: a thin ember line that only exists where there is ink to lay
            const near = c > 0 ? 1 : 0;
            glow = near * Math.exp(-(((x - front) / 3) ** 2)) * 1.4;
          }
        }
        const t = BAYER[((y & 7) << 3) | (x & 7)];
        const o = i * 4;
        const col = ink > t ? INK : glow > t ? EMBER : null;
        if (col) { d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255; } else d[o + 3] = 0;
      }
    }
    ctx.putImageData(img, 0, 0);
  };

  return {
    tick(now) {
      const p = reduce ? 1 : Math.min(1, (now - t0) / INTRO_MS);
      const reveal = 1 - (1 - p) ** 3;
      const e = reduce ? 1 : 0.12;
      L.x += (goal.x - L.x) * e;
      L.y += (goal.y - L.y) * e;
      L.r += (goal.r - L.r) * e;
      draw(reveal);
      return reveal < 1 || Math.abs(goal.x - L.x) + Math.abs(goal.y - L.y) + Math.abs(goal.r - L.r) * 0.2 > 0.15;
    },
    pointer(p) {
      goal = p
        ? { x: (p.x + m.pad) / cell, y: (p.y + m.pad) / cell, r: Math.min(cols * 0.2, rows * 1.4) }
        : { x: cols * 1.2, y: -rows, r: 0 };
    },
    dispose() {},
  };
}
