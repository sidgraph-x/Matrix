"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { Quality } from "../../types";
import { DIE, HBM_DIM, HBM_X, HBM_Z, INT, rng } from "./layout";

/*
 * Procedural textures for the compute station. All drawn once into canvases with seeded randomness.
 * Canvas x maps to station x; canvas y (top to bottom) maps to station z (back to front) on a BoxGeometry top face.
 */

type Mode = "color" | "rough" | "bump" | "irid";
const g = (v: number) => { const c = Math.round(Math.max(0, Math.min(1, v)) * 255); return `rgb(${c},${c},${c})`; };

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function toTex(c: HTMLCanvasElement, srgb: boolean, aniso = 8) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = aniso;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.needsUpdate = true;
  return t;
}

/* ------------------------------------------------------------------ die floorplan */

/** Floorplan grid, in normalised die coordinates (u across x, v across z). Shared with the systolic inset. */
export const FLOOR = {
  core: { u0: 0.105, u1: 0.895, v0: 0.075, v1: 0.925 },
  cols: 10,
  rows: 12,
  spine: 0.018, // horizontal global-buffer spine between rows 5 and 6
};

/** Station-local (x, z) of the centre of compute tile (col, row), plus its size. */
export function tileRect(col: number, row: number) {
  const { u0, u1, v0, v1 } = FLOOR.core;
  const cw = (u1 - u0) / FLOOR.cols;
  const rh = (v1 - v0 - FLOOR.spine) / FLOOR.rows;
  const u = u0 + (col + 0.5) * cw;
  const v = v0 + (row + 0.5) * rh + (row >= FLOOR.rows / 2 ? FLOOR.spine : 0);
  return { x: (u - 0.5) * DIE.w, z: (v - 0.5) * DIE.d, w: cw * DIE.w, d: rh * DIE.d };
}

function paintDie(ctx: CanvasRenderingContext2D, W: number, H: number, mode: Mode) {
  const r = rng(91);
  const P = (kind: string, v = 0): string => {
    // per-mode palette: colour is a dark die shot; rough is mirror-smooth SRAM, rougher logic; bump raises metal; irid varies film thickness
    const T: Record<string, [string, number, number, number]> = {
      bg: ["#1a1b21", 0.2, 0.3, 0.5],
      seal: ["#8a8b92", 0.12, 0.9, 0.2],
      scribe: ["#3c3d44", 0.45, 0.1, 0.3],
      phy: ["#3d3628", 0.32, 0.45, 0.65],
      phyPad: ["#8c7650", 0.18, 0.95, 0.65],
      io: ["#25252c", 0.3, 0.35, 0.4],
      serdes: ["#2a2933", 0.25, 0.3, 0.75],
      coil: ["#9a8058", 0.15, 0.9, 0.75],
      chan: ["#15161b", 0.2, 0.2, 0.35],
      sram: ["#2b3046", 0.08, 0.5, 0.85],
      sramLine: ["#353b56", 0.06, 0.7, 0.9],
      dec: ["#33323b", 0.25, 0.55, 0.5],
      mac: ["#38342f", 0.22, 0.4, 0.35],
      macCell: ["#433e37", 0.2, 0.7, 0.3],
      logic: ["#2c2b2e", 0.3, 0.35, 0.55],
      logicRow: ["#353339", 0.3, 0.6, 0.55],
      router: ["#4c4136", 0.2, 0.8, 0.6],
      noc: ["#8b6542", 0.15, 1.0, 0.7],
      spine: ["#2d3245", 0.08, 0.55, 0.9],
    };
    const e = T[kind];
    if (mode === "color") return e[0];
    const val = mode === "rough" ? e[1] : mode === "bump" ? e[2] : e[3];
    return g(val + v);
  };
  const fill = (k: string, x: number, y: number, w: number, h: number, v = 0) => { ctx.fillStyle = P(k, v); ctx.fillRect(x, y, w, h); };

  fill("bg", 0, 0, W, H);
  // scribe street and seal ring
  fill("scribe", 0, 0, W, H);
  const sr = W * 0.006;
  fill("seal", sr, sr, W - 2 * sr, H - 2 * sr);
  fill("bg", sr * 1.9, sr * 1.9, W - 3.8 * sr, H - 3.8 * sr);

  // HBM PHY columns on both long edges (x = ±w/2), one block per stack
  const colU = [0.014, 0.09];
  for (const side of [0, 1]) {
    const x0 = (side === 0 ? colU[0] : 1 - colU[1]) * W, cw = (colU[1] - colU[0]) * W;
    fill("io", x0, H * 0.014, cw, H * 0.972);
    // IO pad ring along the column
    for (let y = H * 0.02; y < H * 0.98; y += H * 0.0105) fill("phyPad", x0 + cw * (side ? 0.78 : 0.08), y, cw * 0.14, H * 0.006);
    for (const zc of [-HBM_Z, HBM_Z]) {
      const vc = zc / DIE.d + 0.5, vh = (HBM_DIM.d * 0.92) / DIE.d;
      const y0 = (vc - vh / 2) * H, hh = vh * H;
      fill("phy", x0, y0, cw, hh);
      // dense microbump field: 8 columns of pads, the 1024-bit HBM bus
      const nx = 8, ny = Math.floor(hh / (W * 0.0052));
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        const px = x0 + cw * (0.1 + (i / nx) * 0.8), py = y0 + hh * 0.03 + (j / ny) * hh * 0.94;
        fill("phyPad", px, py, cw * 0.055, cw * 0.055);
      }
      // DLL / clocking block
      fill("serdes", x0 + cw * 0.18, y0 + hh * 0.44, cw * 0.64, hh * 0.12);
    }
  }

  // SerDes / PCIe lanes along the short edges, with spiral inductors
  for (const top of [true, false]) {
    const y0 = top ? H * 0.016 : H * (1 - 0.016 - 0.05), hh = H * 0.05;
    fill("serdes", W * 0.1, y0, W * 0.8, hh);
    const n = 16;
    for (let i = 0; i < n; i++) {
      const cx = W * (0.1 + ((i + 0.5) / n) * 0.8), cy = y0 + hh * 0.5, s = hh * 0.36;
      ctx.strokeStyle = P("coil"); ctx.lineWidth = Math.max(1, W * 0.0012);
      for (let k = 0; k < 4; k++) { const q = s * (1 - k * 0.22); ctx.strokeRect(cx - q, cy - q, 2 * q, 2 * q); }
      fill("logicRow", cx + s * 1.3, y0 + hh * 0.15, W * 0.006, hh * 0.7);
    }
  }

  // core: routing channel background, then tiles
  const { u0, u1, v0, v1 } = FLOOR.core;
  fill("chan", u0 * W, v0 * H, (u1 - u0) * W, (v1 - v0) * H);
  const cw = ((u1 - u0) / FLOOR.cols) * W;
  const rh = ((v1 - v0 - FLOOR.spine) / FLOOR.rows) * H;
  // global-buffer spine across the middle
  const spineY = (v0 + (FLOOR.rows / 2) * ((v1 - v0 - FLOOR.spine) / FLOOR.rows)) * H;
  fill("spine", u0 * W, spineY + H * 0.002, (u1 - u0) * W, FLOOR.spine * H - H * 0.004);
  for (let x = u0 * W; x < u1 * W; x += 3) fill("sramLine", x, spineY + H * 0.003, 1, FLOOR.spine * H - H * 0.006);

  for (let c = 0; c < FLOOR.cols; c++) for (let rr = 0; rr < FLOOR.rows; rr++) {
    const x = u0 * W + c * cw, y = v0 * H + rr * rh + (rr >= FLOOR.rows / 2 ? FLOOR.spine * H : 0);
    const m = cw * 0.07, tx = x + m, ty = y + m, tw = cw - 2 * m, th = rh - 2 * m;
    const jit = (r() - 0.5) * 0.04;
    // SRAM bank strip (left 30%), four banks with row decoders
    const sw = tw * 0.3;
    fill("sram", tx, ty, sw, th, jit);
    for (let yy = ty; yy < ty + th; yy += 2) if (((yy - ty) | 0) % 4 < 2) fill("sramLine", tx, yy, sw, 1, jit);
    for (let b = 1; b < 4; b++) fill("dec", tx, ty + (th * b) / 4 - 1.5, sw, 3);
    fill("dec", tx + sw * 0.46, ty, sw * 0.08, th);
    // MAC array (right 60%), 8 x 8 PE cells
    const mx = tx + sw + tw * 0.04, mw = tw * 0.66, mh = th * 0.78;
    fill("mac", mx, ty, mw, mh, jit);
    const n = 8, cs = mw / n, ch = mh / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) fill("macCell", mx + i * cs + cs * 0.12, ty + j * ch + ch * 0.12, cs * 0.76, ch * 0.76, jit);
    // control logic: standard-cell rows under the MAC array
    const ly = ty + mh + th * 0.03, lh = th - mh - th * 0.03;
    fill("logic", mx, ly, mw, lh);
    for (let yy = ly; yy < ly + lh; yy += 3) {
      let xx = mx;
      while (xx < mx + mw) { const L = 2 + r() * 10; if (r() < 0.6) fill("logicRow", xx, yy, Math.min(L, mx + mw - xx), 2); xx += L + 1; }
    }
    // NoC router at the tile corner
    const rs = cw * 0.12;
    fill("router", x + cw - rs - m * 0.4, y + rh - rs - m * 0.4, rs, rs);
  }

  // NoC mesh: thin links along every channel, router to router
  const lw = Math.max(1, W * 0.0014);
  for (let c = 0; c <= FLOOR.cols; c++) {
    const x = u0 * W + c * cw - lw / 2;
    fill("noc", x, v0 * H, lw, (v1 - v0) * H);
  }
  for (let rr = 0; rr <= FLOOR.rows; rr++) {
    const y = v0 * H + rr * rh + (rr > FLOOR.rows / 2 ? FLOOR.spine * H : 0) - lw / 2;
    fill("noc", u0 * W, y, (u1 - u0) * W, lw);
  }

  // corner fiducials
  for (const [fx, fy] of [[0.03, 0.03], [0.97, 0.03], [0.03, 0.97], [0.97, 0.97]]) {
    const s = W * 0.012;
    fill("seal", fx * W - s / 2, fy * H - s * 0.12, s, s * 0.24);
    fill("seal", fx * W - s * 0.12, fy * H - s / 2, s * 0.24, s);
  }
}

export function useDieTextures(quality: Quality) {
  const tex = useMemo(() => {
    const H = quality === "high" ? 2048 : 1024, W = Math.round((H * DIE.w) / DIE.d);
    const out = {} as Record<Mode, THREE.CanvasTexture>;
    for (const mode of ["color", "rough", "bump", "irid"] as Mode[]) {
      const s = mode === "irid" ? 0.25 : 1;
      const [c, ctx] = canvas(Math.round(W * s), Math.round(H * s));
      ctx.save(); ctx.scale(s, s);
      paintDie(ctx, W, H, mode);
      ctx.restore();
      out[mode] = toTex(c, mode === "color");
    }
    return out;
  }, [quality]);
  useEffect(() => () => Object.values(tex).forEach((t) => t.dispose()), [tex]);
  return tex;
}

/* ------------------------------------------------------------------ organic substrate (solder mask, traces, marking) */

export function useSubstrateTexture(quality: Quality) {
  const tex = useMemo(() => {
    const W = quality === "high" ? 2048 : 1024, H = Math.round(W * 0.8);
    const [c, ctx] = canvas(W, H);
    const r = rng(23);
    ctx.fillStyle = "#1c2b22"; ctx.fillRect(0, 0, W, H);
    // mottled solder mask
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = `rgba(${r() < 0.5 ? "40,60,46" : "18,28,22"},${0.08 + r() * 0.1})`;
      const s = 6 + r() * 40; ctx.fillRect(r() * W, r() * H, s, s * (0.4 + r()));
    }
    // fan-out traces from the interposer footprint to the edges, faintly visible through the mask
    const ix = ((INT.w / 10) * W) / 2, iz = ((INT.d / 8) * H) / 2, cx = W / 2, cy = H / 2;
    ctx.lineWidth = Math.max(1, W / 900);
    for (let i = 0; i < 700; i++) {
      const side = Math.floor(r() * 4), k = r() * 2 - 1;
      let x = 0, y = 0, dx = 0, dy = 0;
      if (side === 0) { x = cx + k * ix; y = cy - iz; dx = 0; dy = -1; }
      if (side === 1) { x = cx + k * ix; y = cy + iz; dx = 0; dy = 1; }
      if (side === 2) { x = cx - ix; y = cy + k * iz; dx = -1; dy = 0; }
      if (side === 3) { x = cx + ix; y = cy + k * iz; dx = 1; dy = 0; }
      ctx.strokeStyle = `rgba(52,78,58,${0.35 + r() * 0.35})`;
      ctx.beginPath(); ctx.moveTo(x, y);
      const a = 10 + r() * 60; x += dx * a; y += dy * a; ctx.lineTo(x, y);
      // 45-degree jog, then out
      const j = (r() - 0.5) * 120; x += dx === 0 ? j : dx * Math.abs(j); y += dy === 0 ? j : dy * Math.abs(j); ctx.lineTo(x, y);
      const b = 40 + r() * 260; x += dx * b; y += dy * b; ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = "rgba(70,96,74,0.7)"; ctx.beginPath(); ctx.arc(x, y, W / 700, 0, Math.PI * 2); ctx.fill();
    }
    // via field
    for (let i = 0; i < 2500; i++) { ctx.fillStyle = `rgba(60,86,66,${0.3 + r() * 0.4})`; ctx.fillRect(r() * W, r() * H, W / 1000 + 1, W / 1000 + 1); }
    // interposer keep-out outline and corner fiducials (bare gold pads)
    ctx.strokeStyle = "rgba(120,150,120,0.35)"; ctx.lineWidth = W / 700;
    ctx.strokeRect(cx - ix - W * 0.008, cy - iz - W * 0.008, 2 * ix + W * 0.016, 2 * iz + W * 0.016);
    for (const [fx, fy] of [[0.075, 0.09], [0.925, 0.09], [0.075, 0.91], [0.925, 0.91]]) {
      ctx.fillStyle = "#b8955a"; ctx.beginPath(); ctx.arc(fx * W, fy * H, W * 0.006, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(160,190,160,0.4)"; ctx.beginPath(); ctx.arc(fx * W, fy * H, W * 0.011, 0, Math.PI * 2); ctx.stroke();
    }
    // silkscreen marking
    const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono") || "monospace";
    ctx.fillStyle = "rgba(225,222,210,0.78)";
    ctx.font = `500 ${Math.round(W * 0.0125)}px ${mono}`;
    ctx.fillText("MX-T1  A0", W * 0.1, H * 0.955);
    ctx.font = `400 ${Math.round(W * 0.0095)}px ${mono}`;
    ctx.fillText("2647  ·  ES  ·  E3", W * 0.1, H * 0.975);
    ctx.fillText("▲", W * 0.06, H * 0.965);
    return toTex(c, true);
  }, [quality]);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/* ------------------------------------------------------------------ silicon interposer (RDL wiring, bump footprints) */

export function useInterposerTexture(quality: Quality) {
  const tex = useMemo(() => {
    const W = quality === "high" ? 2048 : 1024, H = Math.round((W * INT.d) / INT.w);
    const [c, ctx] = canvas(W, H);
    const r = rng(57);
    const X = (x: number) => (x / INT.w + 0.5) * W, Z = (z: number) => (z / INT.d + 0.5) * H;
    ctx.fillStyle = "#62656d"; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 900; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? "90,94,104" : "52,55,62"},0.08)`; ctx.fillRect(r() * W, r() * H, 30 + r() * 90, 6 + r() * 30); }
    // bump fields under the die and each HBM stack
    const field = (x0: number, z0: number, x1: number, z1: number, p: number, col: string) => {
      ctx.fillStyle = col;
      for (let x = X(x0); x < X(x1); x += p) for (let y = Z(z0); y < Z(z1); y += p) ctx.fillRect(x, y, p * 0.5, p * 0.5);
    };
    ctx.fillStyle = "#3e4148"; ctx.fillRect(X(-DIE.w / 2), Z(-DIE.d / 2), X(DIE.w / 2) - X(-DIE.w / 2), Z(DIE.d / 2) - Z(-DIE.d / 2));
    field(-DIE.w / 2 + 0.05, -DIE.d / 2 + 0.05, DIE.w / 2 - 0.05, DIE.d / 2 - 0.05, W / 260, "#7c7f86");
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * HBM_X, z = sz * HBM_Z;
      ctx.fillStyle = "#3e4148"; ctx.fillRect(X(x - HBM_DIM.w / 2), Z(z - HBM_DIM.d / 2), X(HBM_DIM.w) - X(0), Z(HBM_DIM.d) - Z(0));
      field(x - HBM_DIM.w / 2 + 0.04, z - HBM_DIM.d / 2 + 0.04, x + HBM_DIM.w / 2 - 0.04, z + HBM_DIM.d / 2 - 0.04, W / 300, "#6f7279");
      // the wide, short wires between die PHY and HBM: the reason the interposer exists
      ctx.fillStyle = "rgba(196,140,92,0.75)";
      const xa = sx < 0 ? X(-DIE.w / 2 - 0.02) : X(DIE.w / 2 - 0.25);
      const xb = sx < 0 ? X(x + HBM_DIM.w / 2 - 0.3) : X(x - HBM_DIM.w / 2 + 0.3);
      for (let y = Z(z - HBM_DIM.d * 0.44); y < Z(z + HBM_DIM.d * 0.44); y += W / 520) ctx.fillRect(Math.min(xa, xb), y, Math.abs(xb - xa), Math.max(1, W / 1400));
    }
    // power grid: coarse mesh across the open area
    ctx.fillStyle = "rgba(110,114,122,0.25)";
    for (let x = 0; x < W; x += W / 48) ctx.fillRect(x, 0, Math.max(1, W / 1200), H);
    for (let y = 0; y < H; y += W / 48) ctx.fillRect(0, y, W, Math.max(1, W / 1200));
    // seal ring
    ctx.strokeStyle = "#8d9098"; ctx.lineWidth = W / 400; ctx.strokeRect(W * 0.006, W * 0.006, W - W * 0.012, H - W * 0.012);
    return toTex(c, true);
  }, [quality]);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/* ------------------------------------------------------------------ soft contact shadow */

export function useShadowTexture() {
  const tex = useMemo(() => {
    const [c, ctx] = canvas(256, 256);
    ctx.filter = "blur(18px)";
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.beginPath(); ctx.roundRect(52, 56, 152, 144, 18); ctx.fill();
    return toTex(c, false, 1);
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/* ------------------------------------------------------------------ HBM stack sidewall (12 core dies + base die, bond lines) */

/** Mip-mapped sidewall for the intact stacks, so the 13 layers stay clean at any distance instead of aliasing. */
export function useHbmSideTexture() {
  const tex = useMemo(() => {
    const W = 64, H = 1024;
    const [c, ctx] = canvas(W, H);
    const r = rng(19);
    const total = HBM_DIM.base + HBM_DIM.layers * (HBM_DIM.core + HBM_DIM.gapY);
    const px = (v: number) => (v / total) * H;
    let y = H; // draw bottom-up
    const band = (h: number, col: string) => { ctx.fillStyle = col; ctx.fillRect(0, y - px(h), W, px(h)); y -= px(h); };
    band(HBM_DIM.base, "#56585f");
    for (let i = 0; i < HBM_DIM.layers; i++) {
      band(HBM_DIM.gapY, "#141418");
      band(HBM_DIM.core, i % 2 ? "#8a8c93" : "#80828a");
    }
    // grinding marks across each die edge
    for (let i = 0; i < 900; i++) { ctx.fillStyle = `rgba(255,255,255,${r() * 0.05})`; ctx.fillRect(0, r() * H, W, 1); }
    const t = toTex(c, true, 8);
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/* ------------------------------------------------------------------ die sidewall (bulk silicon, BEOL stack, saw marks) */

export function useDieSideTexture() {
  const tex = useMemo(() => {
    const W = 1024, H = 128;
    const [c, ctx] = canvas(W, H);
    const r = rng(41);
    ctx.fillStyle = "#4a4c53"; ctx.fillRect(0, 0, W, H);
    // grinding and saw marks: fine horizontal streaks, a few faint chips along the lower edge
    for (let i = 0; i < 160; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? "255,255,255" : "0,0,0"},${0.006 + r() * 0.012})`; ctx.fillRect(r() * W * 0.5, r() * H, W * (0.2 + r() * 0.6), 1); }
    for (let i = 0; i < 40; i++) { ctx.fillStyle = "rgba(20,20,24,0.5)"; ctx.fillRect(r() * W, H - 3 - r() * 3, 2 + r() * 6, 3); }
    // the metal interconnect stack at the top edge: thin, darker and bluer, capped by a bright passivation line
    ctx.fillStyle = "#30333f"; ctx.fillRect(0, 0, W, H * 0.07);

    ctx.fillStyle = "#8d909a"; ctx.fillRect(0, 0, W, 1.5);
    return toTex(c, true, 8);
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}
