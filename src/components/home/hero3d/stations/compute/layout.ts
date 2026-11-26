/*
 * Dimensions and stack heights for the accelerator package, in station-local units.
 * The package is modelled on a 2.5D CoWoS-style part: organic substrate, silicon interposer,
 * one reticle-sized logic die flanked by HBM stacks, and a direct-to-chip cold plate.
 * Logic die and HBM tops are coplanar, as on real parts, so the cold plate seats on both.
 */

export const SUB = { w: 10, h: 0.35, d: 8, y: 0 };                 // y = bottom face
export const RING = { inset: 0.12, width: 0.42, h: 0.2 };           // stiffener ring on the substrate edge
export const BGA = { r: 0.092, pitch: 0.3 };
export const INT = { w: 7.2, h: 0.15, d: 5.2, gap: 0.07 };          // interposer, sits on C4 bumps
export const HBM_DIM = { w: 1.1, d: 1.0, base: 0.042, core: 0.026, gapY: 0.0085, layers: 12 };
/** Stack height: base die plus twelve core dies, each with its bond line. Thickness is exaggerated about 4x over a real part so the layers read. */
export const HBM_H = HBM_DIM.base + HBM_DIM.layers * (HBM_DIM.core + HBM_DIM.gapY);
export const DIE = { w: 3.6, h: HBM_H, d: 4.4, gap: 0.035 };         // logic die, on microbumps, ground coplanar with the HBM
export const HBM_X = DIE.w / 2 + 0.2 + HBM_DIM.w / 2;               // ≈ 2.55
export const HBM_Z = 1.15;
export const PLATE = { w: 6.8, d: 5.0, base: 0.16, chamber: 0.3, lid: 0.1, tim: 0.02 };

export const Y = {
  subTop: SUB.y + SUB.h,
  intBottom: SUB.y + SUB.h + INT.gap,
  intTop: SUB.y + SUB.h + INT.gap + INT.h,
  dieBottom: SUB.y + SUB.h + INT.gap + INT.h + DIE.gap,
  dieTop: SUB.y + SUB.h + INT.gap + INT.h + DIE.gap + DIE.h,
  plateBottom: SUB.y + SUB.h + INT.gap + INT.h + DIE.gap + DIE.h + PLATE.tim,
};

/** Vertical separation of each layer once exploded (from the plan). */
export const LIFT = { interposer: 1.2, silicon: 2.4, plate: 4.4 };

const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** 0 assembled (t < 1.5 s), 1 fully exploded (t ≥ 3.5 s). */
export const explodeAt = (t: number) => smooth((t - 1.5) / 2);

/** The systolic-array inset hovers over one compute tile of the die (exploded coordinates). */
export const SYS = { hover: 0.55, pitch: 0.19, n: 8 };

export function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}
