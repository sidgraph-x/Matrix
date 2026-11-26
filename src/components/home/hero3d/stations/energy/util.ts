import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Vec3 } from "../../types";

/** Deterministic Park–Miller generator (same as Stage.tsx). */
export function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Cheap 2D value noise + fBm, used by the canvas textures. */
function hash2(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
export function vnoise(x: number, y: number, seed = 1) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed), c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x: number, y: number, seed = 1, oct = 4) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f, seed + i * 17); f *= 2.03; a *= 0.5; }
  return s;
}
export const hash = hash2;

export function fontVar(name: "--font-geist-mono" | "--font-geist" | "--font-newsreader", fallback: string) {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
export function mat(p: Vec3 = [0, 0, 0], r: Vec3 = [0, 0, 0], s: Vec3 | number = 1, out = new THREE.Matrix4()) {
  _q.setFromEuler(_e.set(r[0], r[1], r[2]));
  if (typeof s === "number") _s.set(s, s, s); else _s.set(s[0], s[1], s[2]);
  return out.compose(_p.set(p[0], p[1], p[2]), _q, _s);
}

/**
 * Collects many small static parts and merges them into one geometry per material key,
 * so a detailed assembly (bolts, flanges, rails) costs one draw call per material.
 * `at()` returns a view with a local frame that shares the same buckets.
 */
export class Kit {
  private buckets: Map<string, THREE.BufferGeometry[]>;
  private base: THREE.Matrix4;
  constructor(buckets?: Map<string, THREE.BufferGeometry[]>, base?: THREE.Matrix4) {
    this.buckets = buckets ?? new Map();
    this.base = base ?? new THREE.Matrix4();
  }
  at(p: Vec3 = [0, 0, 0], r: Vec3 = [0, 0, 0], s: Vec3 | number = 1) {
    return new Kit(this.buckets, this.base.clone().multiply(mat(p, r, s)));
  }
  addM(key: string, geo: THREE.BufferGeometry, m: THREE.Matrix4) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!g.attributes.uv) {
      g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") g.deleteAttribute(k);
    g.morphAttributes = {};
    g.clearGroups();
    g = g.applyMatrix4(this.base.clone().multiply(m));
    const list = this.buckets.get(key) ?? [];
    list.push(g);
    this.buckets.set(key, list);
    return this;
  }
  add(key: string, geo: THREE.BufferGeometry, p: Vec3 = [0, 0, 0], r: Vec3 = [0, 0, 0], s: Vec3 | number = 1) {
    return this.addM(key, geo, mat(p, r, s));
  }
  box(key: string, size: Vec3, p: Vec3 = [0, 0, 0], r: Vec3 = [0, 0, 0]) {
    return this.add(key, G.box(size[0], size[1], size[2]), p, r);
  }
  /** A cylinder along local y. */
  cyl(key: string, rad: number, h: number, p: Vec3 = [0, 0, 0], r: Vec3 = [0, 0, 0], seg = 20) {
    return this.add(key, G.cyl(rad, h, seg), p, r);
  }
  build() {
    const out: Record<string, THREE.BufferGeometry> = {};
    this.buckets.forEach((list, key) => {
      const m = mergeGeometries(list, false);
      if (m) { m.computeBoundingSphere(); out[key] = m; }
      list.forEach((g) => g.dispose());
    });
    return out;
  }
}

/** Shared unit primitives (reused across kits; Kit clones before transforming). */
export const G = {
  box: (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d),
  cyl: (r: number, h: number, seg = 20) => new THREE.CylinderGeometry(r, r, h, seg),
};
