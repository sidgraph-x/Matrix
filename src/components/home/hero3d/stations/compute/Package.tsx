"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Quality } from "../../types";
import { frameGeometry, useGeo, useInstanced, type Inst } from "./helpers";
import { BGA, INT, RING, SUB, Y, rng } from "./layout";
import { CM } from "./mats";
import { useInterposerTexture, useShadowTexture, useSubstrateTexture } from "./textures";

/* Organic substrate: build-up laminate with a lighter core, solder-mask top with fan-out traces,
   a full BGA underneath, a stainless stiffener ring and a band of decoupling MLCCs. */
export function Substrate({ quality }: { quality: Quality }) {
  const hi = quality === "high";
  const top = useSubstrateTexture(quality);
  const shadow = useShadowTexture();
  const topMat = useMemo(() => new THREE.MeshPhysicalMaterial({ map: top, color: "#ffffff", roughness: 0.38, metalness: 0.05, clearcoat: 0.5, clearcoatRoughness: 0.25 }), [top]);

  const body = useGeo(() => new RoundedBoxGeometry(SUB.w, SUB.h, SUB.d, 2, 0.05), []);
  const coreBand = useGeo(() => new RoundedBoxGeometry(SUB.w + 0.012, SUB.h * 0.34, SUB.d + 0.012, 1, 0.01), []);
  const ring = useGeo(() => {
    const ow = SUB.w - 2 * RING.inset, od = SUB.d - 2 * RING.inset;
    return frameGeometry(ow, od, ow - 2 * RING.width, od - 2 * RING.width, RING.h, 0.025, 0.14);
  }, []);

  // BGA: full array, pitch 0.3 (≥ 800 balls high), corner A1 depopulated as an index
  const ballGeo = useGeo(() => new THREE.SphereGeometry(BGA.r, hi ? 10 : 7, hi ? 7 : 5), [hi]);
  const balls = useMemo(() => {
    const pitch = hi ? BGA.pitch : BGA.pitch * 1.45;
    const nx = Math.floor((SUB.w - 0.5) / pitch), nz = Math.floor((SUB.d - 0.5) / pitch);
    const list: Inst[] = [];
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      if (i < 2 && j < 2 && i + j < 2) continue;
      list.push({ p: [(i - (nx - 1) / 2) * pitch, SUB.y - BGA.r * 0.62, (j - (nz - 1) / 2) * pitch], s: [1, 0.82, 1] });
    }
    return list;
  }, [hi]);
  const ballRef = useInstanced(balls);

  // MLCC decoupling capacitors between the stiffener ring and the interposer
  // built at true size so the rounding and normals stay correct; large caps scale uniformly
  const capGeo = useGeo(() => new RoundedBoxGeometry(0.137, 0.086, 0.096, 2, 0.014), []);
  const endGeo = useGeo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const caps = useMemo(() => {
    const r = rng(311);
    const bodies: Inst[] = [], ends: Inst[] = [];
    const inner = { x: SUB.w / 2 - RING.inset - RING.width - 0.12, z: SUB.d / 2 - RING.inset - RING.width - 0.12 };
    const edge = { x: INT.w / 2 + 0.16, z: INT.d / 2 + 0.16 };
    const rows = hi ? 2 : 1;
    const place = (x: number, z: number, along: "x" | "z") => {
      const k = r() < 0.22 ? 1.35 : 1;
      const L = 0.19 * k, Wd = 0.1 * k, Hh = 0.09 * k;
      const y = Y.subTop + Hh / 2 + 0.004;
      const rot: [number, number, number] = [0, along === "x" ? 0 : Math.PI / 2, 0];
      const cl = L * 0.72;
      bodies.push({ p: [x, y, z], r: rot, s: [k, k, k] });
      const dx = along === "x" ? 1 : 0, dz = along === "x" ? 0 : 1;
      for (const sgn of [-1, 1]) {
        const o = (L / 2 - (L - cl) / 4) * sgn;
        ends.push({ p: [x + dx * o, y, z + dz * o], r: rot, s: [(L - cl) / 2 + 0.004, Hh, Wd] });
      }
    };
    // front and back bands (caps oriented along z, in rows along x)
    for (const sz of [-1, 1]) for (let k = 0; k < rows; k++) {
      const z = sz * (edge.z + 0.18 + k * 0.32);
      if (Math.abs(z) > inner.z) continue;
      for (let x = -inner.x + 0.1; x <= inner.x - 0.1; x += 0.25 + (r() < 0.12 ? 0.25 : 0)) place(x, z, "z");
    }
    // left and right bands
    for (const sx of [-1, 1]) for (let k = 0; k < rows; k++) {
      const x = sx * (edge.x + 0.18 + k * 0.32);
      if (Math.abs(x) > inner.x) continue;
      for (let z = -edge.z + 0.12; z <= edge.z - 0.12; z += 0.25 + (r() < 0.12 ? 0.25 : 0)) place(x, z, "x");
    }
    return { bodies, ends };
  }, [hi]);
  const capBodyRef = useInstanced(caps.bodies);
  const capEndRef = useInstanced(caps.ends);

  return (
    <group>
      <mesh geometry={body} material={CM.mask} position={[0, SUB.y + SUB.h / 2, 0]} />
      <mesh geometry={coreBand} material={CM.core} position={[0, SUB.y + SUB.h * 0.5, 0]} />
      {/* solder-mask top with the routing texture, a hair above the body */}
      <mesh material={topMat} position={[0, Y.subTop + 0.002, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[SUB.w - 0.1, SUB.d - 0.1]} />
      </mesh>
      <mesh geometry={ring} material={CM.stainless} position={[0, Y.subTop, 0]} />
      <instancedMesh ref={ballRef} args={[ballGeo, CM.solder, balls.length]} />
      <instancedMesh ref={capBodyRef} args={[capGeo, CM.ceramic, caps.bodies.length]} />
      <instancedMesh ref={capEndRef} args={[endGeo, CM.termination, caps.ends.length]} />
      {/* soft contact shadow far below: grounds the package without a floor */}
      <mesh position={[0.4, SUB.y - 1.6, -0.3]} rotation-x={-Math.PI / 2} renderOrder={-1}>
        <planeGeometry args={[SUB.w * 1.9, SUB.d * 1.9]} />
        <meshBasicMaterial map={shadow} transparent opacity={0.55} depthWrite={false} color="#000000" />
      </mesh>
    </group>
  );
}

/* Silicon interposer on C4 bumps: polished grey with the RDL wiring and bump footprints drawn in. */
export function Interposer({ quality }: { quality: Quality }) {
  const hi = quality === "high";
  const map = useInterposerTexture(quality);
  const topMat = useMemo(() => new THREE.MeshPhysicalMaterial({ map, roughness: 0.14, metalness: 0.62, clearcoat: 1, clearcoatRoughness: 0.05, iridescence: 0.25, iridescenceIOR: 1.5, iridescenceThicknessMinimum: 250, iridescenceThicknessMaximum: 500 }), [map]);
  const box = useGeo(() => new THREE.BoxGeometry(INT.w, INT.h, INT.d), []);
  const mats = useMemo(() => [CM.siliconEdge, CM.siliconEdge, topMat, CM.siliconEdge, CM.siliconEdge, CM.siliconEdge], [topMat]);

  const bumpGeo = useGeo(() => new THREE.SphereGeometry(0.042, hi ? 7 : 5, hi ? 5 : 3), [hi]);
  const bumps = useMemo(() => {
    const pitch = hi ? 0.18 : 0.27;
    const nx = Math.floor((INT.w - 0.3) / pitch), nz = Math.floor((INT.d - 0.3) / pitch);
    const list: Inst[] = [];
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) list.push({ p: [(i - (nx - 1) / 2) * pitch, Y.intBottom - INT.gap / 2, (j - (nz - 1) / 2) * pitch], s: [1, (INT.gap / 0.084) * 1.05, 1] });
    return list;
  }, [hi]);
  const bumpRef = useInstanced(bumps);

  return (
    <group>
      <mesh geometry={box} material={mats} position={[0, Y.intBottom + INT.h / 2, 0]} />
      <instancedMesh ref={bumpRef} args={[bumpGeo, CM.solder, bumps.length]} />
    </group>
  );
}
