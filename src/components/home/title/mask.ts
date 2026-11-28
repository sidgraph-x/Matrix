/*
 * Shared by every title form: turn the live <h1> into a coverage grid. Each glyph is drawn at
 * the exact position the browser laid it out, supersampled and box-filtered down to the grid,
 * so a canvas laid over the h1 lines up with the (transparent) selectable text underneath.
 */

export type Mask = {
  cols: number;
  rows: number;
  /** CSS px per grid cell. */
  cell: number;
  /** CSS px of bleed around the h1 on every side. */
  pad: number;
  /** 0..1 per cell, row 0 at the top. */
  cov: Float32Array;
};

export const BAYER = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
].map((v) => (v + 0.5) / 64);

export const INK = [25, 23, 20] as const;
export const EMBER = [184, 70, 27] as const;

export const fontSize = (el: HTMLElement) => parseFloat(getComputedStyle(el).fontSize);

/**
 * @param cell CSS px per cell
 * @param padCells bleed in cells
 * @param fade 0 draws solid glyphs; >0 thins each glyph towards its foot (the print's halftone fade)
 */
export function buildMask(el: HTMLElement, cell: number, padCells: number, fade = 0, ss = 4): Mask | null {
  const box = el.getBoundingClientRect();
  if (box.width < 10) return null;
  const cs = getComputedStyle(el);
  const fs = parseFloat(cs.fontSize);
  const pad = cell * padCells;
  const cols = Math.ceil((box.width + pad * 2) / cell);
  const rows = Math.ceil((box.height + pad * 2) / cell);

  const m = document.createElement("canvas");
  m.width = cols * ss;
  m.height = rows * ss;
  const mc = m.getContext("2d", { willReadFrequently: true });
  if (!mc) return null;
  const k = ss / cell;
  mc.font = `${cs.fontStyle} ${cs.fontWeight} ${fs * k}px ${cs.fontFamily}`;
  mc.textBaseline = "alphabetic";
  mc.fillStyle = "#fff";
  const asc = mc.measureText("Hg").fontBoundingBoxAscent;
  const node = el.firstChild;
  if (!node || node.nodeType !== Node.TEXT_NODE) return null;
  const range = document.createRange();
  const str = node.textContent ?? "";
  for (let i = 0; i < str.length; i++) {
    if (str[i] === " ") continue;
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const r = range.getClientRects()[0];
    if (!r) continue;
    const top = (r.top - box.top + pad) * k, h = r.height * k;
    if (fade > 0) {
      const g = mc.createLinearGradient(0, top, 0, top + h);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.5, "rgba(255,255,255,1)");
      g.addColorStop(0.8, `rgba(255,255,255,${1 - 0.38 * fade})`);
      g.addColorStop(1, `rgba(255,255,255,${1 - 0.64 * fade})`);
      mc.fillStyle = g;
    }
    mc.fillText(str[i], (r.left - box.left + pad) * k, top + asc);
  }
  const px = mc.getImageData(0, 0, m.width, m.height).data;
  const cov = new Float32Array(cols * rows);
  const norm = 1 / (ss * ss * 255);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let s = 0;
      for (let sy = 0; sy < ss; sy++) {
        const row = (y * ss + sy) * m.width + x * ss;
        for (let sx = 0; sx < ss; sx++) s += px[(row + sx) * 4 + 3];
      }
      cov[y * cols + x] = s * norm;
    }
  }
  return { cols, rows, cell, pad, cov };
}

/** Size and place a canvas over the h1 so one canvas pixel covers `cell / scale` CSS px. */
export function placeCanvas(c: HTMLCanvasElement, m: Mask, scale = 1) {
  c.width = Math.round(m.cols * scale);
  c.height = Math.round(m.rows * scale);
  c.style.width = `${m.cols * m.cell}px`;
  c.style.height = `${m.rows * m.cell}px`;
  c.style.left = `${-m.pad}px`;
  c.style.top = `${-m.pad}px`;
}

export function blur(src: Float32Array, cols: number, rows: number, r: number) {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const n = 2 * r + 1;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += src[y * cols + Math.min(cols - 1, Math.max(0, x + k))];
      tmp[y * cols + x] = s / n;
    }
  }
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += tmp[Math.min(rows - 1, Math.max(0, y + k)) * cols + x];
      out[y * cols + x] = s / n;
    }
  }
  return out;
}

/** Small deterministic PRNG so a reset with the same parameters reads as the same experiment. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
