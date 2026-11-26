"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useLocalTime } from "../../clock";
import { M } from "../../materials";
import type { Quality } from "../../types";
import { useGeo, useInstanced, type Inst } from "./helpers";
import { SYS, Y } from "./layout";
import { CM } from "./mats";
import { tileRect } from "./textures";

/*
 * A magnified inset of one compute tile's MAC array: 8 x 8 processing elements, weight-stationary.
 * Activations enter each row from the SRAM bank on the left, skewed one cycle per row, and move +x (ember).
 * Partial sums enter each column at the front and accumulate toward the back, -z (brass).
 * Both arrive at PE(i, c) on cycle i + c, so the work sweeps across the array as a diagonal wavefront.
 * Fine hairlines tie the inset back to the tile it magnifies.
 */

export const TILE = tileRect(3, 8);
const N = SYS.n, P = SYS.pitch, PE = 0.148, PE_H = 0.07;
const colX = (c: number) => (c - (N - 1) / 2) * P;
const rowZ = (i: number) => ((N - 1) / 2 - i) * P; // i = 0 is the front row
const RATE = 2.6; // cycles per second
const CYCLE = 2 * N + 4;
const WAVES = 3;

const EMBER = new THREE.Color("#ff6b2c").multiplyScalar(3.2);
const BRASS = new THREE.Color("#d9a55b").multiplyScalar(2.4);
const IDLE = new THREE.Color("#2a2622");

/** Position of the inset's base, relative to the die group. */
export const INSET = { x: TILE.x - 0.25, y: Y.dieTop + SYS.hover, z: TILE.z + 0.15 };

export default function SystolicArray({ index, quality }: { index: number; quality: Quality }) {
  const local = useLocalTime(index);
  const hi = quality === "high";
  const root = useRef<THREE.Group>(null);
  const caps = useRef<THREE.InstancedMesh>(null);
  const act = useRef<THREE.InstancedMesh>(null);
  const psum = useRef<THREE.InstancedMesh>(null);
  const lines = useRef<THREE.LineBasicMaterial>(null);

  const peGeo = useGeo(() => new RoundedBoxGeometry(PE, PE_H, PE, hi ? 2 : 1, 0.018), [hi]);
  const capGeo = useGeo(() => new RoundedBoxGeometry(PE * 0.5, 0.022, PE * 0.5, 1, 0.006), []);
  const tokGeo = useGeo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const plateGeo = useGeo(() => new RoundedBoxGeometry(N * P + 0.5, 0.05, N * P + 0.42, 2, 0.02), []);
  const bankGeo = useGeo(() => new RoundedBoxGeometry(0.16, 0.06, P * 0.86, 1, 0.012), []);

  const pes = useMemo(() => {
    const l: Inst[] = [];
    for (let i = 0; i < N; i++) for (let c = 0; c < N; c++) l.push({ p: [colX(c), PE_H / 2 + 0.025, rowZ(i)] });
    return l;
  }, []);
  const peRef = useInstanced(pes);
  const capList = useMemo(() => pes.map((p) => ({ p: [p.p[0], PE_H + 0.025 + 0.011, p.p[2]] as [number, number, number], c: IDLE })), [pes]);
  const capRef = useInstanced(capList);
  // SRAM banks feeding activations (left edge) and accumulators draining partial sums (back edge)
  const banks = useMemo(() => {
    const l: Inst[] = [];
    for (let i = 0; i < N; i++) l.push({ p: [colX(0) - P * 1.05, 0.055, rowZ(i)] });
    for (let c = 0; c < N; c++) l.push({ p: [colX(c), 0.055, rowZ(N - 1) - P * 1.05], r: [0, Math.PI / 2, 0] });
    return l;
  }, []);
  const bankRef = useInstanced(banks);

  // hairline interconnect between neighbouring PEs, plus the magnifier frustum down to the tile
  const lineGeo = useGeo(() => {
    const v: number[] = [];
    const y = 0.03;
    for (let i = 0; i < N; i++) v.push(colX(0) - P, y, rowZ(i), colX(N - 1) + P * 0.5, y, rowZ(i));
    for (let c = 0; c < N; c++) v.push(colX(c), y, rowZ(0) + P * 0.5, colX(c), y, rowZ(N - 1) - P);
    const hx = (N * P + 0.5) / 2, hz = (N * P + 0.42) / 2, dy = -SYS.hover;
    const tx = TILE.x - INSET.x, tz = TILE.z - INSET.z, tw = TILE.w / 2, td = TILE.d / 2;
    const corners: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    corners.forEach(([sx, sz], k) => {
      v.push(sx * hx, 0, sz * hz, tx + sx * tw, dy + 0.004, tz + sz * td);
      const [nx, nz] = corners[(k + 1) % 4];
      v.push(tx + sx * tw, dy + 0.004, tz + sz * td, tx + nx * tw, dy + 0.004, tz + nz * td);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    return g;
  }, []);

  const o = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const t = local();
    const g = root.current;
    if (!g) return;
    // the inset appears once the stack has separated
    const k = THREE.MathUtils.smoothstep(t, 3.0, 3.9);
    g.visible = k > 0.001;
    g.scale.setScalar(0.6 + 0.4 * k);
    if (lines.current) lines.current.opacity = 0.42 * k;
    if (!g.visible) return;

    const T0 = Math.max(0, t - 3.4) * RATE;
    // register caps glow as the wavefronts pass
    const cm = caps.current;
    if (cm) {
      for (let i = 0; i < N; i++) for (let c = 0; c < N; c++) {
        let a = 0, p = 0;
        for (let w = 0; w < WAVES; w++) {
          const T = ((T0 + (w * CYCLE) / WAVES) % CYCLE) - 1;
          const d = T - (i + c);
          a = Math.max(a, Math.exp(-d * d * 3));
          p = Math.max(p, Math.exp(-(d - 0.5) * (d - 0.5) * 3));
        }
        col.copy(IDLE).lerp(EMBER, a * 0.85).lerp(BRASS, p * 0.35);
        cm.setColorAt(i * N + c, col);
      }
      if (cm.instanceColor) cm.instanceColor.needsUpdate = true;
    }
    // tokens: activations travel the rows, partial sums travel the columns
    const am = act.current, pm = psum.current;
    if (am && pm) {
      let na = 0, np = 0;
      for (let w = 0; w < WAVES; w++) {
        const T = ((T0 + (w * CYCLE) / WAVES) % CYCLE) - 1;
        for (let i = 0; i < N; i++) {
          const c = T - i;
          if (c < -0.9 || c > N - 0.1) continue;
          o.position.set(colX(c) - P * 0.5, PE_H * 0.55 + 0.025, rowZ(i) - P * 0.5);
          o.scale.set(0.07, 0.016, 0.022); o.rotation.set(0, 0, 0); o.updateMatrix();
          am.setMatrixAt(na++, o.matrix);
        }
        for (let c = 0; c < N; c++) {
          const i = T - c - 0.5;
          if (i < -0.9 || i > N - 0.1) continue;
          o.position.set(colX(c) + P * 0.5, PE_H * 0.55 + 0.025, rowZ(i) + P * 0.5);
          o.scale.set(0.022, 0.016, 0.07); o.updateMatrix();
          pm.setMatrixAt(np++, o.matrix);
        }
      }
      am.count = na; pm.count = np;
      am.instanceMatrix.needsUpdate = true; pm.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={[INSET.x, INSET.y, INSET.z]}>
      <group ref={root} visible={false}>
        <mesh geometry={plateGeo} material={M.darkMetal} position={[0, 0, 0]} />
        <instancedMesh ref={peRef} args={[peGeo, CM.pe, pes.length]} />
        <instancedMesh ref={(m) => { caps.current = m; capRef.current = m; }} args={[capGeo, undefined, capList.length]}>
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
        <instancedMesh ref={bankRef} args={[bankGeo, CM.sram, banks.length]} />
        <instancedMesh ref={act} args={[tokGeo, M.ember, WAVES * N]} frustumCulled={false} />
        <instancedMesh ref={psum} args={[tokGeo, M.brassGlow, WAVES * N]} frustumCulled={false} />
        <lineSegments geometry={lineGeo}>
          <lineBasicMaterial ref={lines} color="#ede6da" transparent opacity={0} depthWrite={false} />
        </lineSegments>
      </group>
    </group>
  );
}
