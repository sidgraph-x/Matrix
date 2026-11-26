import * as THREE from "three";
import type { Vec3 } from "../../types";

/*
 * Station-local layout for the taste station, shared by the sheet, the galaxy, the pairs and the
 * station definition (shots, callouts, thread). Units are world units; +y up, camera looks toward -z.
 */

/** Seeded Park–Miller generator (same as Stage.tsx), so every reload draws the same scene. */
export function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/** Standard normal sample from a uniform generator (Box–Muller). */
export function gauss(r: () => number) {
  const u = Math.max(1e-7, r()), v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export const smooth = (x: number) => {
  const t = THREE.MathUtils.clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};
export const easeInOut = (x: number) => {
  const t = THREE.MathUtils.clamp(x, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/* ---------- the style space ---------- */

/** Centroid of the population of human styles; the base model's outputs collapse here. */
export const GALAXY: Vec3 = [5.8, 2.2, -8.4];
/** Your own cluster: off-centre, inside a real lobe of the population, nearer the camera. */
export const YOU: Vec3 = [9.0, 1.1, -5.2];

/* ---------- the draft sheet ---------- */

/** A4 proportions (1 : 1.414). */
export const SHEET_W = 4.2;
export const SHEET_H = 5.94;
export const SHEET_POS: Vec3 = [-4.3, 1.7, 3.0];
export const SHEET_ROT: Vec3 = [-0.34, 0.26, 0.03];

/**
 * Out-of-plane displacement of the paper (sheet-local +z faces the camera), so the page reads as paper
 * rather than a card: a slight bow across the width, a lifted lower-right corner and a soft top curl.
 */
export function curl(x: number, y: number, k = 1) {
  const nx = x / (SHEET_W / 2), ny = y / (SHEET_H / 2);
  const cx = (nx + 1) / 2, cy = 1 - (ny + 1) / 2; // 0..1, left→right, top→bottom
  const bow = 0.07 * nx * nx;
  const corner = Math.max(0, cx + cy - 1.25) / 0.75;
  const lift = 0.42 * corner * corner * corner;
  const top = 0.06 * Math.pow(Math.max(0, ny - 0.55) / 0.45, 2);
  return k * (bow + lift + top);
}

const sheetMatrix = new THREE.Matrix4().compose(
  new THREE.Vector3(...SHEET_POS),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(...SHEET_ROT)),
  new THREE.Vector3(1, 1, 1),
);
export const SHEET_QUAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(...SHEET_ROT));
export const SHEET_NORMAL = new THREE.Vector3(0, 0, 1).applyQuaternion(SHEET_QUAT);

/** Station-local point on the paper surface at texture coords (u right, v down from the top), lifted along the normal. */
export function sheetPoint(u: number, v: number, lift = 0, out = new THREE.Vector3()) {
  const x = (u - 0.5) * SHEET_W, y = (0.5 - v) * SHEET_H;
  return out.set(x, y, curl(x, y) + lift).applyMatrix4(sheetMatrix);
}
