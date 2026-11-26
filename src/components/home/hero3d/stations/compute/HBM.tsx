"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { M } from "../../materials";
import type { Quality } from "../../types";
import { useGeo, useInstanced, type Inst } from "./helpers";
import { HBM_DIM, HBM_H, HBM_X, HBM_Z, Y } from "./layout";
import { CM } from "./mats";
import { useHbmSideTexture } from "./textures";

/*
 * Four HBM stacks, two on each long side of the logic die. Each is a base (logic) die plus twelve
 * DRAM core dies, every one a separate slab with a hairline bond line of non-conductive film.
 * The front-right stack is sectioned through its centre so its twelve layers and the vertical
 * TSV columns (with a microbump at every bond line) are exposed.
 */

export const CUT = { sx: 1, sz: 1 } as const;
const { w, d, base, core, gapY, layers } = HBM_DIM;
const pitchY = core + gapY;

export default function HBM({ quality }: { quality: Quality }) {
  const hi = quality === "high";
  const box = useGeo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const cyl = useGeo(() => new THREE.CylinderGeometry(1, 1, 1, hi ? 10 : 6, 1), [hi]);

  const { full, cut, fill, tsv, mbump, tops } = useMemo(() => {
    const full: Inst[] = [], cut: Inst[] = [], fill: Inst[] = [], tsv: Inst[] = [], mbump: Inst[] = [], tops: Inst[] = [];
    const y0 = Y.dieBottom;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const isCut = sx === CUT.sx && sz === CUT.sz;
      const x = sx * HBM_X, z = sz * HBM_Z;
      // a cut stack keeps only its back half: z from (z - d/2) to z
      const zc = isCut ? z - d / 4 : z, dd = isCut ? d / 2 : d;
      if (!isCut) {
        // intact stacks: one block with a mip-mapped sidewall showing the 13 layers
        full.push({ p: [x, y0 + HBM_H / 2, z], s: [w, HBM_H, d] });
        continue;
      }
      const list = cut;
      // base die: slightly wider, darker
      list.push({ p: [x, y0 + base / 2, zc], s: [w, base, dd], c: isCut ? "#6b6d74" : "#4f5157" });
      for (let i = 0; i < layers; i++) {
        const yc = y0 + base + gapY + i * pitchY + core / 2;
        list.push({ p: [x, yc, zc], s: [w - 0.012, core, dd - (isCut ? 0.006 : 0.012)], c: isCut ? (i % 2 ? "#9a9ca3" : "#90929a") : i % 2 ? "#6e7077" : "#676970" });
      }
      // dark bond-line fill inside the stack, visible in the gaps
      fill.push({ p: [x, y0 + base + (HBM_H - base) / 2, zc], s: [w - 0.05, HBM_H - base - 0.004, dd - 0.05] });
      tops.push({ p: [x, y0 + HBM_H + 0.0015, zc], s: [w - 0.03, 0.003, dd - 0.03] });
      {
        // TSV columns sit in the die's centre strip, in three groups; the section plane passes through them
        const groups = [-0.33, 0, 0.33], per = hi ? 7 : 4, tp = 0.034, rad = 0.0105;
        for (const gx of groups) for (let k = 0; k < per; k++) {
          const tx = x + gx + (k - (per - 1) / 2) * tp, tz = z - rad * 0.35;
          tsv.push({ p: [tx, y0 + HBM_H / 2, tz], s: [rad, HBM_H - 0.004, rad] });
          for (let i = 0; i < layers; i++) {
            const yb = y0 + base + i * pitchY + gapY / 2;
            mbump.push({ p: [tx, yb, tz], s: [rad * 1.9, gapY * 1.05, rad * 1.9] });
          }
        }
      }
    }
    return { full, cut, fill, tsv, mbump, tops };
  }, [hi]);

  const side = useHbmSideTexture();
  const fullMats = useMemo(() => {
    const wall = new THREE.MeshPhysicalMaterial({ map: side, metalness: 0.45, roughness: 0.34, clearcoat: 0.3 });
    return [wall, wall, M.silicon, CM.underfill, wall, wall];
  }, [side]);
  const fullRef = useInstanced(full);
  const cutRef = useInstanced(cut);
  const fillRef = useInstanced(fill);
  const tsvRef = useInstanced(tsv);
  const mbRef = useInstanced(mbump);
  const topRef = useInstanced(tops);

  return (
    <group>
      <instancedMesh ref={fullRef} args={[box, fullMats, full.length]} />
      <instancedMesh ref={cutRef} args={[box, CM.hbmSection, cut.length]} />
      <instancedMesh ref={fillRef} args={[box, CM.underfill, fill.length]} />
      <instancedMesh ref={topRef} args={[box, M.silicon, tops.length]} />
      <instancedMesh ref={tsvRef} args={[cyl, M.copper, tsv.length]} />
      <instancedMesh ref={mbRef} args={[cyl, CM.solder, mbump.length]} />
    </group>
  );
}
