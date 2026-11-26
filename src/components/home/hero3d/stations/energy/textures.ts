import * as THREE from "three";
import { fbm, fontVar, hash, rng, smooth, vnoise } from "./util";

/*
 * Procedural canvas textures for the energy station. All deterministic, all generated on the client.
 * Geology scale: the block is 7 units deep and stands for 5 km, so 1 km = 1.4 units.
 */

export const KM = 1.4;
export const BLOCK = { w: 24, h: 7, d: 14 };
/** Isotherm depths (station-local y) before doming; ~60 °C/km from a 15 °C surface. */
export const ISOTHERMS = [
  { t: 100, y: -2.0 },
  { t: 150, y: -3.15 },
  { t: 200, y: -4.3 },
];
/** Doming of isotherms over the stimulated reservoir (front face, centred near x = -4). */
export const dome = (s: number) => 0.42 * Math.exp(-((s - 8) ** 2) / 34) + 0.12 * Math.sin(s * 0.31 + 1.2);

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return [c, c.getContext("2d")!] as const;
}
function tex(c: HTMLCanvasElement, srgb = true, aniso = 8) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  t.needsUpdate = true;
  return t;
}
const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/* ------------------------------------------------------------------ strata */

/** Boundary depths (y < 0) between the six layers at perimeter coordinate s (0..38, front then right face). */
function boundaries(s: number) {
  const n = (k: number, f: number, a: number) => (fbm(s * f, k * 3.1, 11 + k, 4) - 0.5) * a;
  return [
    -0.2 + n(0, 0.9, 0.12),
    -1.05 + 0.18 * Math.sin(s * 0.21 + 0.4) + n(1, 0.35, 0.35),
    -1.95 + 0.22 * Math.sin(s * 0.17 + 2.1) + n(2, 0.3, 0.42),
    -2.75 + 0.16 * Math.sin(s * 0.23 + 4.0) + n(3, 0.28, 0.4),
    -3.35 + 0.3 * Math.sin(s * 0.12 + 1.0) + n(4, 0.4, 0.55),
  ];
}
const LAYERS = ["#3d3125", "#8c7353", "#4f4b46", "#86827a", "#7d655a", "#5f5150"].map(hex);
/** Normal fault on the front face near x = +7 (s = 19), dipping; hanging wall dropped 0.38. */
const faultSide = (s: number, y: number) => s - (19.2 + 0.32 * y) > 0;

function drawSection(s0: number, s1: number, pxPerUnit: number) {
  const W = Math.round((s1 - s0) * pxPerUnit), H = Math.round(BLOCK.h * pxPerUnit);
  const [c, g] = canvas(W, H);
  const img = g.createImageData(W, H);
  const d = img.data;
  const cool = hex("#5a6670"), warm = hex("#8f3a17");
  const bcache: number[][] = [];
  for (let px = 0; px < W; px++) bcache.push(boundaries(s0 + (px + 0.5) / pxPerUnit));
  for (let py = 0; py < H; py++) {
    const y = -(py + 0.5) / pxPerUnit;
    for (let px = 0; px < W; px++) {
      const s = s0 + (px + 0.5) / pxPerUnit;
      const b = bcache[px];
      const drop = faultSide(s, y) ? 0.38 : 0;
      let L = 0;
      for (let i = 0; i < 5; i++) if (y < b[i] - (i > 0 ? drop : 0)) L = i + 1;
      const top = L === 0 ? 0 : b[L - 1] - (L - 1 > 0 ? drop : 0);
      const bot = L < 5 ? b[L] - drop : -BLOCK.h;
      const col = LAYERS[L];
      let k = 1;
      // grain
      k += (vnoise(s * 70, y * 70, 3 + L) - 0.5) * 0.22 + (fbm(s * 6, y * 6, 5 + L, 3) - 0.5) * 0.3;
      if (L >= 1 && L <= 3) {
        // bedding planes follow the layer's own boundaries
        const u = (y - top) / (bot - top + 1e-6);
        k += 0.07 * Math.sin(u * (L === 2 ? 70 : 42) + fbm(s * 0.8, u * 4, 9 + L, 3) * 6);
        if (L === 2 && hash(Math.floor(s * 18), Math.floor(u * 60), 77) > 0.985) k -= 0.25;
      }
      if (L >= 4) {
        const sp = vnoise(s * 55, y * 55, 21);
        if (sp > 0.82) k += 0.45; else if (sp < 0.12) k -= 0.35;
        // joints in the basement
        const j = Math.abs(Math.sin(s * 1.9 + fbm(s * 0.5, y * 0.5, 31) * 5 + y * 0.9));
        if (j < 0.012) k -= 0.3;
      }
      if (L === 0) k += (vnoise(s * 120, y * 120, 41) - 0.5) * 0.3;
      // temperature: cool grey-blue at the surface, ember-brown at depth
      const tw = smooth(-1.2, -7, y) * 0.5, tc = (1 - smooth(-0.2, -2.2, y)) * 0.14;
      const i4 = (py * W + px) * 4;
      for (let ch = 0; ch < 3; ch++) {
        let v = col[ch] * k;
        v = v * (1 - tw) + warm[ch] * (0.55 + 0.45 * k) * tw;
        v = v * (1 - tc) + cool[ch] * tc;
        d[i4 + ch] = Math.max(0, Math.min(255, v));
      }
      d[i4 + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);

  const X = (s: number) => (s - s0) * pxPerUnit, Y = (y: number) => -y * pxPerUnit;
  const mono = fontVar("--font-geist-mono", "ui-monospace, monospace");

  // fault trace
  if (s0 < 19 && s1 > 22) {
    g.strokeStyle = "rgba(20,16,12,0.85)"; g.lineWidth = 2.2;
    g.beginPath();
    for (let y = -0.9; y >= -7; y -= 0.05) {
      const s = 19.2 + 0.32 * y + (fbm(y * 2, 3, 61, 3) - 0.5) * 0.12;
      if (y === -0.9) g.moveTo(X(s), Y(y)); else g.lineTo(X(s), Y(y));
    }
    g.stroke();
  }

  // stimulated reservoir halo on the front face
  if (s0 === 0) {
    const gr = g.createRadialGradient(X(8.2), Y(-5.3), 10, X(8.2), Y(-5.3), 3.6 * pxPerUnit);
    gr.addColorStop(0, "rgba(255,150,90,0.22)"); gr.addColorStop(1, "rgba(255,150,90,0)");
    g.save(); g.translate(X(8.2), Y(-5.3)); g.scale(1.9, 0.62); g.translate(-X(8.2), -Y(-5.3));
    g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  }

  // water table
  g.setLineDash([10, 7]); g.strokeStyle = "rgba(150,190,215,0.45)"; g.lineWidth = 1.5;
  g.beginPath();
  for (let s = s0; s <= s1; s += 0.1) {
    const y = -0.62 + 0.08 * Math.sin(s * 0.4);
    if (s === s0) g.moveTo(X(s), Y(y)); else g.lineTo(X(s), Y(y));
  }
  g.stroke();

  // isotherms
  const fs = Math.round(pxPerUnit * 0.2);
  g.font = `500 ${fs}px ${mono}`;
  ISOTHERMS.forEach((it) => {
    g.setLineDash([16, 9]); g.lineWidth = 2;
    g.strokeStyle = it.t >= 200 ? "rgba(255,150,95,0.9)" : it.t >= 150 ? "rgba(240,170,120,0.75)" : "rgba(236,214,190,0.65)";
    g.beginPath();
    for (let s = s0; s <= s1 + 0.01; s += 0.08) {
      const y = it.y + dome(s);
      if (s === s0) g.moveTo(X(s), Y(y)); else g.lineTo(X(s), Y(y));
    }
    g.stroke();
    g.setLineDash([]);
    const labelS = s0 === 0 ? 16.4 : 33.5;
    const yl = it.y + dome(labelS);
    const txt = `${it.t} °C`;
    const tw = g.measureText(txt).width;
    g.fillStyle = "rgba(23,21,18,0.72)";
    g.fillRect(X(labelS) - 6, Y(yl) - fs - 8, tw + 12, fs + 8);
    g.fillStyle = g.strokeStyle;
    g.fillText(txt, X(labelS), Y(yl) - 8);
  });

  // depth ruler on the front face's left edge
  if (s0 === 0) {
    g.fillStyle = "rgba(237,230,218,0.8)"; g.strokeStyle = "rgba(237,230,218,0.8)"; g.lineWidth = 2;
    g.beginPath(); g.moveTo(X(0.18), Y(0)); g.lineTo(X(0.18), Y(-7)); g.stroke();
    for (let k = 0; k <= 10; k++) {
      const y = -k * 0.5 * KM;
      if (y < -7) break;
      const major = k % 2 === 0;
      g.beginPath(); g.moveTo(X(0.18), Y(y)); g.lineTo(X(major ? 0.62 : 0.42), Y(y)); g.stroke();
      if (major && k > 0 && y > -6.9) g.fillText(`${k / 2} km`, X(0.72), Y(y) + fs * 0.35);
    }
  }
  return tex(c);
}

export function sectionTextures() {
  return { front: drawSection(0, 24, 88), right: drawSection(24, 38, 88) };
}

/* ------------------------------------------------------------------ top surface */

export function topTexture() {
  const P = 64, W = 24 * P, H = 14 * P;
  const [c, g] = canvas(W, H);
  const img = g.createImageData(W, H);
  const d = img.data;
  const a = hex("#6a5a47"), b = hex("#4e4236");
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const x = px / P, z = py / P;
    const m = fbm(x * 0.35, z * 0.35, 3, 5);
    const gr = vnoise(x * 30, z * 30, 8);
    const k = 0.9 + (gr - 0.5) * 0.35 + (hash(px, py, 4) - 0.5) * 0.12;
    const i4 = (py * W + px) * 4;
    for (let ch = 0; ch < 3; ch++) d[i4 + ch] = Math.min(255, (a[ch] * m + b[ch] * (1 - m)) * k * 1.05);
    d[i4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const X = (x: number) => (x + 12) * P, Z = (z: number) => (z + 7) * P;
  const r = rng(91);
  const gravel = (x0: number, z0: number, x1: number, z1: number) => {
    g.fillStyle = "rgba(150,138,118,0.55)";
    g.fillRect(X(x0), Z(z0), (x1 - x0) * P, (z1 - z0) * P);
    for (let i = 0; i < (x1 - x0) * (z1 - z0) * 260; i++) {
      g.fillStyle = r() < 0.5 ? "rgba(60,52,44,0.5)" : "rgba(190,180,160,0.5)";
      g.fillRect(X(x0 + r() * (x1 - x0)), Z(z0 + r() * (z1 - z0)), 1 + r() * 2, 1 + r() * 2);
    }
    // tyre tracks
    g.strokeStyle = "rgba(70,60,50,0.35)"; g.lineWidth = 3;
    const horiz = x1 - x0 > z1 - z0;
    for (const o of [0.32, 0.68]) {
      g.beginPath();
      if (horiz) { g.moveTo(X(x0), Z(z0 + (z1 - z0) * o)); g.lineTo(X(x1), Z(z0 + (z1 - z0) * o)); }
      else { g.moveTo(X(x0 + (x1 - x0) * o), Z(z0)); g.lineTo(X(x0 + (x1 - x0) * o), Z(z1)); }
      g.stroke();
    }
  };
  const pad = (x0: number, z0: number, x1: number, z1: number) => {
    const sh = g.createRadialGradient(X((x0 + x1) / 2), Z((z0 + z1) / 2), 0, X((x0 + x1) / 2), Z((z0 + z1) / 2), Math.max(x1 - x0, z1 - z0) * P * 0.75);
    sh.addColorStop(0, "rgba(10,8,6,0.45)"); sh.addColorStop(1, "rgba(10,8,6,0)");
    g.fillStyle = sh; g.fillRect(X(x0 - 1), Z(z0 - 1), (x1 - x0 + 2) * P, (z1 - z0 + 2) * P);
    g.fillStyle = "#8b867d"; g.fillRect(X(x0), Z(z0), (x1 - x0) * P, (z1 - z0) * P);
    g.strokeStyle = "rgba(40,36,32,0.6)"; g.lineWidth = 2; g.strokeRect(X(x0), Z(z0), (x1 - x0) * P, (z1 - z0) * P);
    for (let i = 0; i < (x1 - x0) * (z1 - z0) * 120; i++) {
      g.fillStyle = `rgba(${r() < 0.5 ? "60,56,50" : "170,164,154"},0.35)`;
      g.fillRect(X(x0 + r() * (x1 - x0)), Z(z0 + r() * (z1 - z0)), 1.5, 1.5);
    }
  };
  // roads: spine between the PV field and the power yard, and a front access road
  gravel(1.7, -7, 3.1, 7);
  gravel(-12, 5.25, 12, 6.0);
  // PV rows: soft occlusion under each tracker
  for (const z of PV_ROWS) {
    const gr = g.createLinearGradient(0, Z(z - 0.9), 0, Z(z + 0.9));
    gr.addColorStop(0, "rgba(10,8,6,0)"); gr.addColorStop(0.5, "rgba(10,8,6,0.42)"); gr.addColorStop(1, "rgba(10,8,6,0)");
    g.fillStyle = gr; g.fillRect(X(-11.9), Z(z - 0.9), 12.8 * P, 1.8 * P);
  }
  // concrete pads: battery containers, inverter skid, wellheads, tokamak-side yard
  pad(3.85, 3.4, 8.75, 5.15);
  pad(3.85, 0.3, 8.75, 2.05);
  pad(3.85, -2.8, 8.75, -1.05);
  pad(9.05, 3.5, 11.65, 5.3);
  gravel(9.05, -3.1, 11.85, 1.4);
  pad(-8.9, 6.05, -7.1, 6.95);
  pad(0.6, 6.05, 2.4, 6.95);
  // cable trench from the field's combiner to the yard
  g.strokeStyle = "rgba(35,30,26,0.75)"; g.lineWidth = 5;
  g.beginPath(); g.moveTo(X(0.9), Z(-0.1)); g.lineTo(X(3.6), Z(-0.1)); g.lineTo(X(3.6), Z(3.6)); g.stroke();
  g.strokeStyle = "rgba(160,150,135,0.5)"; g.lineWidth = 1; g.setLineDash([6, 6]);
  g.beginPath(); g.moveTo(X(0.9), Z(-0.1)); g.lineTo(X(3.6), Z(-0.1)); g.lineTo(X(3.6), Z(3.6)); g.stroke();
  return tex(c);
}

/** Tracker row z positions (station-local). Shared by the top texture and TandemPV. */
export const PV_ROWS = [-5.45, -3.2, -0.95, 1.3, 3.55];

/* ------------------------------------------------------------------ PV module */

export function moduleTexture() {
  const W = 256, H = 512;
  const [c, g] = canvas(W, H);
  g.fillStyle = "#2c3038"; g.fillRect(0, 0, W, H);
  const cols = 6, rows = 24, m = 6, gap = 2.2;
  const cw = (W - 2 * m - (cols - 1) * gap) / cols, chh = (H - 2 * m - (rows - 1) * gap - 6) / rows;
  const r = rng(5);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = m + i * (cw + gap), y = m + j * (chh + gap) + (j >= rows / 2 ? 6 : 0);
    const v = 12 + r() * 7;
    const gr = g.createLinearGradient(x, y, x + cw, y + chh);
    gr.addColorStop(0, `rgb(${v},${v + 4},${v + 18})`); gr.addColorStop(1, `rgb(${v - 4},${v},${v + 10})`);
    g.fillStyle = gr; g.fillRect(x, y, cw, chh);
    // fingers
    g.fillStyle = "rgba(120,130,150,0.18)";
    for (let k = 1; k < 8; k++) g.fillRect(x, y + (k * chh) / 8, cw, 0.6);
    // busbars (multi-busbar)
    g.fillStyle = "rgba(170,178,190,0.42)";
    for (let k = 1; k <= 5; k++) g.fillRect(x + (k * cw) / 6 - 0.4, y, 0.9, chh);
    // chamfered corners
    g.fillStyle = "#2c3038";
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3, y); g.lineTo(x, y + 3); g.fill();
    g.beginPath(); g.moveTo(x + cw, y); g.lineTo(x + cw - 3, y); g.lineTo(x + cw, y + 3); g.fill();
  }
  // string ribbons at top and bottom
  g.fillStyle = "#8d939c"; g.fillRect(m, 2, W - 2 * m, 2.5); g.fillRect(m, H - 4.5, W - 2 * m, 2.5);
  return tex(c);
}

/* ------------------------------------------------------------------ battery module faceplate */

export function batteryTexture() {
  const W = 256, H = 64;
  const [c, g] = canvas(W, H);
  g.fillStyle = "#2b2d30"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#3a3d41"; g.fillRect(3, 3, W - 6, H - 6);
  // vent slots
  g.fillStyle = "#16171a";
  for (let i = 0; i < 14; i++) g.fillRect(70 + i * 7, 14, 3.2, 36);
  // label
  g.fillStyle = "#d9d6cf"; g.fillRect(178, 12, 52, 22);
  g.fillStyle = "#3a3d41"; for (let i = 0; i < 4; i++) g.fillRect(182, 16 + i * 4.5, 30 + (i % 2) * 12, 1.6);
  // HV connectors (orange, as on real packs) and handles
  g.fillStyle = "#9c5430"; g.fillRect(16, 18, 14, 12); g.fillRect(16, 36, 14, 12);
  g.fillStyle = "#808487"; g.fillRect(40, 8, 6, 48); g.fillRect(W - 14, 8, 6, 48);
  g.fillStyle = "#1a1b1d"; g.fillRect(180, 40, 30, 10);
  return tex(c);
}

/* ------------------------------------------------------------------ labels */

export function labelTexture(text: string, opts: { color?: string; width?: number; align?: "left" | "right" } = {}) {
  const W = opts.width ?? 640, H = 72;
  const [c, g] = canvas(W, H);
  const mono = fontVar("--font-geist-mono", "ui-monospace, monospace");
  g.font = `500 34px ${mono}`;
  g.fillStyle = opts.color ?? "#ede6da";
  g.strokeStyle = opts.color ?? "#ede6da";
  g.lineWidth = 2;
  if (opts.align === "right") {
    g.textAlign = "right";
    g.fillText(text, W - 70, 47);
    g.beginPath(); g.moveTo(W - 58, 36); g.lineTo(W - 4, 36); g.stroke();
  } else {
    g.beginPath(); g.moveTo(4, 36); g.lineTo(58, 36); g.stroke();
    g.fillText(text, 70, 47);
  }
  const t = tex(c);
  t.anisotropy = 4;
  return t;
}

/* ------------------------------------------------------------------ small material textures */

/** Perovskite: polycrystalline film, dark brown grains (Worley cells). */
export function grainTexture() {
  const N = 256;
  const [c, g] = canvas(N, N);
  const img = g.createImageData(N, N);
  const r = rng(13);
  const pts = Array.from({ length: 90 }, () => [r() * N, r() * N, r()]);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let d1 = 1e9, d2 = 1e9, v = 0;
    for (const [px, py, pv] of pts) {
      for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) {
        const dd = (x - px - ox) ** 2 + (y - py - oy) ** 2;
        if (dd < d1) { d2 = d1; d1 = dd; v = pv; } else if (dd < d2) d2 = dd;
      }
    }
    const edge = Math.sqrt(d2) - Math.sqrt(d1) < 1.6 ? 0.55 : 1;
    const i4 = (y * N + x) * 4;
    img.data[i4] = (52 + v * 30) * edge; img.data[i4 + 1] = (30 + v * 16) * edge; img.data[i4 + 2] = (24 + v * 10) * edge; img.data[i4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Textured silicon: random pyramid sheen as a greyscale bump map. */
export function pyramidTexture() {
  const N = 256;
  const [c, g] = canvas(N, N);
  const img = g.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const v = Math.abs(Math.sin(x * 0.9 + vnoise(x * 0.2, y * 0.2, 4) * 6)) * Math.abs(Math.sin(y * 0.9 + vnoise(x * 0.2, y * 0.2, 9) * 6));
    const i4 = (y * N + x) * 4;
    img.data[i4] = img.data[i4 + 1] = img.data[i4 + 2] = 255 * v; img.data[i4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = tex(c, false);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** First-wall armour tiles for the tokamak vessel interior. */
export function tileTexture() {
  const W = 512, H = 256;
  const [c, g] = canvas(W, H);
  g.fillStyle = "#1c1b1a"; g.fillRect(0, 0, W, H);
  const r = rng(17);
  const nx = 48, ny = 16;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const v = 70 + r() * 40;
    g.fillStyle = `rgb(${v},${v - 3},${v - 6})`;
    g.fillRect(i * (W / nx) + 1, j * (H / ny) + 1, W / nx - 2, H / ny - 2);
  }
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
