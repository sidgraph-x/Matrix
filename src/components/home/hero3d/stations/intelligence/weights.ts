import * as THREE from "three";

/*
 * Procedural weight matrices for the intelligence station.
 *
 * Each frozen layer gets a 128 x 128 matrix that is shaped like a real trained projection rather than
 * random static: Gaussian entries scaled by smooth per-row and per-column gains (banding), per-head
 * blocks on attention layers, a handful of outlier feature columns and rows, and heavy tails.
 *
 * The adapter is LoRA: ΔW = B·A with B (128 x 16) starting at zero and A (16 x 128) starting random,
 * both drifting toward a structured target with decaying singular values, so the low-rank plaid is
 * visible and grows step by step.
 */

export const N = 128;
export const RANK = 16;

export function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function gauss(r: () => number) {
  const u = Math.max(1e-7, r()), v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** 1D value noise: random knots every `step` samples, cosine interpolated. */
function smooth1d(r: () => number, n: number, step: number) {
  const knots = Array.from({ length: Math.ceil(n / step) + 2 }, () => r() * 2 - 1);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i / step, k = Math.floor(x), f = x - k, w = (1 - Math.cos(Math.PI * f)) / 2;
    out[i] = knots[k] * (1 - w) + knots[k + 1] * w;
  }
  return out;
}

/** A frozen layer's matrix, roughly unit scale with tails out to about 4. Row-major, rows = output dims. */
export function layerWeights(layer: number): Float32Array {
  const r = rng(1009 + layer * 7919);
  const attn = layer % 2 === 0;
  const rowA = smooth1d(r, N, 10), rowB = smooth1d(r, N, 3), colA = smooth1d(r, N, 12), colB = smooth1d(r, N, 4);
  const rowGain = new Float32Array(N), colGain = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    rowGain[i] = Math.exp(0.7 * rowA[i] + 0.28 * rowB[i]);
    colGain[i] = Math.exp(0.6 * colA[i] + 0.25 * colB[i]);
  }
  // a coarse 2D gain field, so magnitude drifts in broad patches as in trained matrices
  const G = 7, field = Array.from({ length: (G + 1) * (G + 1) }, () => r() * 2 - 1);
  const patch = (i: number, j: number) => {
    const x = (j / N) * G, y = (i / N) * G, xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const f = (a: number, b: number) => field[Math.min(G, a) * (G + 1) + Math.min(G, b)];
    return (f(yi, xi) * (1 - fx) + f(yi, xi + 1) * fx) * (1 - fy) + (f(yi + 1, xi) * (1 - fx) + f(yi + 1, xi + 1) * fx) * fy;
  };
  // attention: 8 heads, each a band of 16 output rows with its own scale; MLP: periodic gated-unit banding
  const heads = Array.from({ length: 8 }, () => 0.35 + 1.3 * r() ** 1.5);
  const period = 5 + Math.floor(r() * 6), phase = r() * 6.28;
  // outlier feature dimensions: a few columns, coherent in sign, several times the typical magnitude
  const outCols = new Map(Array.from({ length: 2 + Math.floor(r() * 3) }, () => [Math.floor(r() * N), r() < 0.5 ? -1 : 1] as const));
  const outRows = Array.from({ length: 1 + Math.floor(r() * 2) }, () => Math.floor(r() * N));
  const diag = layer % 5 === 3 ? 1.1 : 0;

  const w = new Float32Array(N * N);
  for (let i = 0; i < N; i++) {
    let rg = rowGain[i];
    if (attn) rg *= heads[i >> 4];
    else rg *= 0.55 + 0.9 * Math.max(0, Math.sin(i * (6.283 / period) + phase)) ** 2;
    if (outRows.includes(i)) rg *= 2.2;
    for (let j = 0; j < N; j++) {
      const cg = colGain[j];
      let g = gauss(r);
      if (r() < 0.01) g *= 2.4;
      const o = outCols.get(j);
      // outlier columns: large and mostly one sign, so they read as continuous stripes
      if (o) g = o * (Math.abs(g) * 0.6 + 1.6) * 2.2;
      let v = g * rg * cg * Math.exp(0.45 * patch(i, j)) * 0.5;
      if (diag && i === j) v += diag;
      w[i * N + j] = v;
    }
  }
  return w;
}

const NEG = [104, 136, 178]; // cool slate-blue for negative weights
const POS = [244, 232, 212]; // warm ivory for positive weights

/**
 * Diverging map into RGBA bytes, like a backlit film inside the glass: near-zero weights are dark smoke,
 * positive weights warm ivory, negative cool slate, brightness by magnitude.
 */
export function weightsToRGBA(w: Float32Array): Uint8Array {
  const out = new Uint8Array(N * N * 4);
  for (let k = 0; k < N * N; k++) {
    const v = Math.tanh(w[k] / 1.6), m = Math.abs(v), c = v < 0 ? NEG : POS;
    const b = 0.05 + 0.95 * Math.pow(m, 0.95);
    out[k * 4] = 12 + (c[0] - 12) * b;
    out[k * 4 + 1] = 13 + (c[1] - 13) * b;
    out[k * 4 + 2] = 15 + (c[2] - 15) * b;
    out[k * 4 + 3] = 255 * (0.8 + 0.2 * m);
  }
  return out;
}

export function dataTexture(data: Uint8Array, w: number, h: number, nearest = true) {
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = nearest ? THREE.NearestFilter : THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

/* ---------------- adapter ---------------- */

export type AdapterSim = {
  /** Target factors, column k of B and row k of A scaled by a decaying singular value. */
  bT: Float32Array; aT: Float32Array;
  /** A's random initialisation (LoRA initialises A random and B at zero). */
  a0: Float32Array;
  seed: number;
  /** Largest |ΔW| at convergence, used to normalise the overlay so it brightens as training proceeds. */
  scale: number;
};

/** A structured vector: a few narrow signed bands plus a slow wave, so each rank-1 term is a set of stripes and ΔW reads as plaid. */
function mode(r: () => number) {
  const v = new Float32Array(N);
  const bands = Array.from({ length: 2 + Math.floor(r() * 3) }, () => ({ c: r() * N, w: 1.2 + r() * 4.5, a: (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.6) }));
  const f = 0.5 + r() * 2.5, ph = r() * 6.28;
  for (let i = 0; i < N; i++) {
    let x = 0.22 * Math.sin((i / N) * 6.283 * f + ph);
    for (const b of bands) x += b.a * Math.exp(-(((i - b.c) / b.w) ** 2));
    v[i] = x;
  }
  return v;
}

export function makeAdapter(layer: number): AdapterSim {
  const r = rng(424242 + layer * 131);
  const bT = new Float32Array(N * RANK), aT = new Float32Array(RANK * N), a0 = new Float32Array(RANK * N);
  for (let k = 0; k < RANK; k++) {
    const s = Math.exp(-k / 1.6);
    const b = mode(r), a = mode(r);
    for (let i = 0; i < N; i++) bT[i * RANK + k] = b[i] * Math.sqrt(s) + 0.08 * gauss(r);
    for (let j = 0; j < N; j++) {
      aT[k * N + j] = a[j] * Math.sqrt(s) + 0.08 * gauss(r);
      a0[k * N + j] = 0.35 * gauss(r);
    }
  }
  const sim: AdapterSim = { bT, aT, a0, seed: layer, scale: 1 };
  const b = new Float32Array(N * RANK), a = new Float32Array(RANK * N), d = new Float32Array(N * N);
  factorsAt(sim, 1e3, b, a);
  product(b, a, d);
  let mx = 0;
  for (let k = 0; k < d.length; k++) mx = Math.max(mx, Math.abs(d[k]));
  sim.scale = mx * 0.6;
  return sim;
}

/** Deterministic state after `step` simulated optimiser steps (so reduced motion and stills are stable). */
export function factorsAt(sim: AdapterSim, step: number, b: Float32Array, a: Float32Array) {
  const p = 1 - Math.exp(-step / 6);
  const r = rng(9001 + sim.seed * 17 + Math.floor(step) * 101);
  const jit = 0.12 * (1 - 0.7 * p);
  for (let k = 0; k < N * RANK; k++) b[k] = sim.bT[k] * p + (step > 0 ? jit * p * gauss(r) : 0);
  for (let k = 0; k < RANK * N; k++) a[k] = sim.a0[k] * (1 - p) + sim.aT[k] * p + jit * 0.5 * gauss(r);
}

export function product(b: Float32Array, a: Float32Array, out: Float32Array) {
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      let s = 0;
      for (let k = 0; k < RANK; k++) s += b[i * RANK + k] * a[k * N + j];
      out[i * N + j] = s;
    }
  }
}

const EMBER = [255, 107, 44], EMBER_DEEP = [214, 64, 22];

/** ΔW as premultiplied ember for additive blending. */
export function deltaToRGBA(d: Float32Array, scale: number, out: Uint8Array) {
  for (let k = 0; k < N * N; k++) {
    const v = d[k] / scale, m = Math.min(1, Math.abs(v)), c = v < 0 ? EMBER_DEEP : EMBER;
    const b = Math.pow(m, 0.85);
    out[k * 4] = c[0] * b;
    out[k * 4 + 1] = c[1] * b;
    out[k * 4 + 2] = c[2] * b;
    out[k * 4 + 3] = 255 * b;
  }
}

/** Texels per rank column in the factor strips; the last texel of each is a dark gap, so the 16 columns read as discrete. */
export const SUB = 4;

function emberCell(v: number, out: Uint8Array, k: number, gap: boolean) {
  const m = Math.abs(v), b = gap ? 0.03 : 0.1 + 0.9 * Math.pow(m, 0.9), c = v < 0 ? EMBER_DEEP : EMBER;
  out[k * 4] = c[0] * b; out[k * 4 + 1] = c[1] * b; out[k * 4 + 2] = c[2] * b; out[k * 4 + 3] = 255;
}

/** B (N x RANK) into a texture RANK*SUB wide and N tall: rows line up with the layer's rows. */
export function bToRGBA(b: Float32Array, scale: number, out: Uint8Array) {
  const w = RANK * SUB;
  for (let i = 0; i < N; i++) for (let x = 0; x < w; x++) emberCell(Math.tanh(b[i * RANK + (x / SUB | 0)] / scale), out, i * w + x, x % SUB === SUB - 1);
}

/** A (RANK x N) into a texture N wide and RANK*SUB tall: columns line up with the layer's columns. */
export function aToRGBA(a: Float32Array, scale: number, out: Uint8Array) {
  for (let y = 0; y < RANK * SUB; y++) for (let j = 0; j < N; j++) emberCell(Math.tanh(a[(y / SUB | 0) * N + j] / scale), out, y * N + j, y % SUB === SUB - 1);
}
