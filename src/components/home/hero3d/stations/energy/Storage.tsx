"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Quality } from "../../types";
import { EM } from "./mats";
import { batteryTexture } from "./textures";
import { Kit, rng } from "./util";

/*
 * Battery yard: three 20 ft containers (6.06 × 2.44 × 2.59 m → 3.79 × 1.52 × 1.62 at 1.6 m/unit),
 * the front one with its long wall cut away to show six racks of LFP modules, and a silicon-carbide
 * inverter skid with its heatsink, DC busbars and MV transformer. A cable tray carries the DC bus.
 */

export const CONT = { L: 3.79, W: 1.52, H: 1.62, x: 6.3, zs: [4.27, 1.17, -1.92] };
export const SKID = { x: 10.4, z: 4.4 };
export const TRAY_Y = 1.78;

/** Trapezoidal corrugation profile, extruded along +y to height h. Wall runs along x, depth along -z. */
function corrugated(len: number, h: number, pitch = 0.17, depth = 0.028, thick = 0.01) {
  const n = Math.max(2, Math.round(len / pitch)), p = len / n;
  const top: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + i * p;
    top.push([x, 0], [x + p * 0.18, depth], [x + p * 0.5, depth], [x + p * 0.68, 0]);
  }
  top.push([len / 2, 0]);
  const s = new THREE.Shape();
  s.moveTo(top[0][0], top[0][1]);
  top.forEach(([x, y]) => s.lineTo(x, y));
  for (let i = top.length - 1; i >= 0; i--) s.lineTo(top[i][0], top[i][1] - thick);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  return g;
}

function containerShell(kit: Kit, cut: boolean) {
  const { L, W, H } = CONT;
  const wallH = H - 0.26;
  // frame: rails, posts, corner castings
  for (const z of [W / 2 - 0.05, -W / 2 + 0.05]) {
    kit.box("paint", [L, 0.16, 0.1], [0, 0.08, z]);
    kit.box("paint", [L, 0.1, 0.1], [0, H - 0.05, z]);
  }
  for (const x of [L / 2 - 0.06, -L / 2 + 0.06]) {
    kit.box("paint", [0.1, 0.12, W], [x, 0.06, 0]);
    kit.box("paint", [0.1, 0.12, W], [x, H - 0.06, 0]);
    for (const z of [W / 2 - 0.06, -W / 2 + 0.06]) {
      kit.box("paint", [0.12, H, 0.12], [x, H / 2, z]);
      for (const y of [0.055, H - 0.055]) kit.box("casting", [0.165, 0.11, 0.15], [x + Math.sign(x) * 0.005, y, z + Math.sign(z) * 0.005]);
    }
  }
  // forklift pockets on the bottom rail
  for (const x of [-0.55, 0.55]) for (const z of [W / 2 - 0.0, -W / 2 + 0.0]) kit.box("dark", [0.36, 0.09, 0.012], [x, 0.08, z]);
  // long walls
  kit.add("paint", corrugated(L - 0.24, wallH), [0, 0.15, -W / 2 + 0.04]);
  if (!cut) kit.add("paint", corrugated(L - 0.24, wallH), [0, 0.15, W / 2 - 0.04], [0, Math.PI, 0]);
  else {
    // cut-away: short wall stubs at each end with clean cut edges
    for (const s of [1, -1]) {
      kit.add("paint", corrugated(0.34, wallH, 0.17), [s * (L / 2 - 0.29), 0.15, W / 2 - 0.04], [0, Math.PI, 0]);
      kit.box("cutedge", [0.012, wallH, 0.04], [s * (L / 2 - 0.46), 0.15 + wallH / 2, W / 2 - 0.05]);
    }
  }
  // roof, slightly crowned
  kit.add("paint", corrugated(L - 0.12, W - 0.12, 0.3, 0.012), [0, H - 0.015, (W - 0.12) / 2], [-Math.PI / 2, 0, 0]);
  // -x end wall with HVAC unit
  kit.add("paint", corrugated(W - 0.24, wallH), [-L / 2 + 0.04, 0.15, 0], [0, -Math.PI / 2, 0]);
  kit.add("hvac", new RoundedBoxGeometry(0.28, 0.82, 0.9, 2, 0.03), [-L / 2 - 0.15, 0.95, 0]);
  kit.add("dark", new THREE.CylinderGeometry(0.25, 0.25, 0.02, 28), [-L / 2 - 0.295, 1.05, 0], [0, 0, Math.PI / 2]);
  for (const r of [0.08, 0.15, 0.22]) kit.add("steel", new THREE.TorusGeometry(r, 0.006, 4, 32), [-L / 2 - 0.305, 1.05, 0], [0, Math.PI / 2, 0]);
  for (let k = 0; k < 4; k++) kit.box("steel", [0.006, 0.46, 0.012], [-L / 2 - 0.305, 1.05, 0], [(k * Math.PI) / 4, 0, 0]);
  for (let k = 0; k < 5; k++) kit.box("dark", [0.01, 0.018, 0.7], [-L / 2 - 0.295, 0.65 + k * 0.035, 0]);
  // +x end: double doors with locking bars, cam keepers, hinges and gaskets
  const dx = L / 2 - 0.03;
  for (const s of [1, -1]) {
    const zc = s * 0.37;
    kit.add("paint", corrugated(0.72, wallH - 0.02, 0.24, 0.018), [dx, 0.16, zc], [0, Math.PI / 2, 0]);
    kit.box("rubber", [0.012, wallH, 0.02], [dx + 0.012, 0.15 + wallH / 2, s * 0.005]);
    for (const zb of [zc - 0.17, zc + 0.17]) {
      kit.cyl("steel", 0.012, wallH + 0.06, [dx + 0.035, 0.15 + wallH / 2, zb], [0, 0, 0], 8);
      kit.box("steel", [0.03, 0.05, 0.05], [dx + 0.04, 0.18, zb]);
      kit.box("steel", [0.03, 0.05, 0.05], [dx + 0.04, 0.12 + wallH, zb]);
      kit.box("steel", [0.06, 0.022, 0.16], [dx + 0.06, 0.15 + wallH * 0.45, zb + 0.06]);
    }
    for (let k = 0; k < 4; k++) {
      const y = 0.25 + k * ((wallH - 0.2) / 3);
      kit.cyl("steel", 0.022, 0.09, [dx + 0.03, y, s * (W / 2 - 0.08)], [0, 0, 0], 10);
      kit.box("steel", [0.02, 0.07, 0.1], [dx + 0.025, y, s * (W / 2 - 0.14)]);
    }
  }
  // fork pockets / data plate
  kit.box("dark", [0.005, 0.12, 0.2], [dx + 0.03, 1.2, 0.55]);
}

function interior(kit: Kit) {
  const { L, W, H } = CONT;
  kit.box("floor", [L - 0.24, 0.04, W - 0.16], [0, 0.17, 0]);
  // ceiling light strip and cable ladder
  kit.box("light", [L - 0.7, 0.02, 0.05], [0, H - 0.1, 0.25]);
  for (const z of [-0.1, 0.1]) kit.box("galv", [L - 0.5, 0.03, 0.012], [0, H - 0.14, -0.35 + z]);
  for (let x = -L / 2 + 0.35; x < L / 2 - 0.3; x += 0.16) kit.box("galv", [0.012, 0.012, 0.2], [x, H - 0.15, -0.35]);
  // suppression pipe with nozzles
  kit.cyl("steel", 0.018, L - 0.5, [0, H - 0.2, 0.05], [0, 0, Math.PI / 2], 10);
  for (const x of [-1.1, 0, 1.1]) kit.cyl("steel", 0.02, 0.06, [x, H - 0.24, 0.05], [0, 0, 0], 10);
}

const RACKS = 6, PER = 8;
const MODW = 0.44, MODH = 0.118, MODD = 0.36;
const rackX = (i: number) => -CONT.L / 2 + 0.52 + i * 0.555;
const RACK_Z = -CONT.W / 2 + 0.31;

function rackKit(kit: Kit) {
  for (let i = 0; i < RACKS; i++) {
    const x = rackX(i);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) kit.box("rack", [0.03, 1.24, 0.03], [x + sx * 0.245, 0.19 + 0.62, RACK_Z + sz * 0.2]);
    for (let k = 0; k <= PER; k++) for (const sx of [-1, 1]) kit.box("rack", [0.03, 0.012, 0.4], [x + sx * 0.235, 0.21 + k * 0.132, RACK_Z]);
    // BMS controller with a small display
    kit.add("rack", new RoundedBoxGeometry(0.46, 0.1, 0.36, 2, 0.01), [x, 0.19 + 1.24 + 0.06, RACK_Z]);
    kit.box("screen", [0.12, 0.05, 0.004], [x - 0.1, 0.19 + 1.3, RACK_Z + 0.182]);
    // HV cables down the rack side
    kit.cyl("cable", 0.012, 1.2, [x + 0.262, 0.8, RACK_Z + 0.12], [0, 0, 0], 8);
    kit.cyl("hv", 0.012, 1.2, [x + 0.262, 0.8, RACK_Z + 0.16], [0, 0, 0], 8);
  }
}

function skidKit(kit: Kit) {
  // base frame
  for (const z of [0.68, -0.68]) {
    kit.box("galv", [2.35, 0.14, 0.018], [0, 0.07, z]);
    kit.box("galv", [2.35, 0.014, 0.08], [0, 0.007, z - Math.sign(z) * 0.03]);
    kit.box("galv", [2.35, 0.014, 0.08], [0, 0.133, z - Math.sign(z) * 0.03]);
  }
  for (const x of [-1.1, -0.4, 0.35, 1.1]) kit.box("galv", [0.06, 0.1, 1.34], [x, 0.07, 0]);
  for (const x of [-1.17, 1.17]) for (const z of [0.7, -0.7]) kit.box("steel", [0.05, 0.12, 0.05], [x, 0.18, z]);
  kit.box("dark", [2.3, 0.02, 1.38], [0, 0.145, 0]);

  // inverter cabinet
  const cx = -0.42, cw = 1.25, ch = 1.32, cd = 0.86, cy = 0.155 + ch / 2;
  kit.add("cab", new RoundedBoxGeometry(cw, ch, cd, 3, 0.025), [cx, cy, 0]);
  kit.add("cab", new RoundedBoxGeometry(cw + 0.06, 0.05, cd + 0.08, 2, 0.015), [cx, 0.155 + ch + 0.02, 0]);
  const fz = cd / 2 + 0.002;
  kit.box("dark", [0.008, ch - 0.1, 0.004], [cx, cy, fz]);
  for (const s of [-1, 1]) {
    kit.box("steel", [0.025, 0.16, 0.03], [cx + s * 0.07, cy + 0.08, fz + 0.012]);
    // louvred vent grille in a recess
    const gx = cx + s * 0.31;
    kit.box("dark", [0.44, 0.36, 0.006], [gx, 0.42, fz]);
    for (let k = 0; k < 9; k++) kit.box("cab", [0.42, 0.012, 0.03], [gx, 0.27 + k * 0.038, fz + 0.01], [-0.6, 0, 0]);
    kit.box("dark", [0.44, 0.22, 0.006], [gx, 1.2, fz]);
    for (let k = 0; k < 5; k++) kit.box("cab", [0.42, 0.012, 0.03], [gx, 1.12 + k * 0.038, fz + 0.01], [-0.6, 0, 0]);
  }
  kit.box("plate", [0.22, 0.12, 0.004], [cx - 0.31, 0.85, fz + 0.002]);
  kit.box("warn", [0.09, 0.08, 0.004], [cx + 0.31, 0.85, fz + 0.002]);
  // heatsink on the +x side: base plate, 22 fins, two fans on a shroud
  const hx = cx + cw / 2;
  kit.box("alu", [0.03, 0.9, 0.72], [hx + 0.015, 0.75, 0]);
  for (let k = 0; k < 22; k++) kit.box("alu", [0.26, 0.86, 0.007], [hx + 0.16, 0.74, -0.34 + k * (0.68 / 21)]);
  kit.box("cab", [0.3, 0.03, 0.76], [hx + 0.16, 0.3, 0]);
  kit.add("cab", new RoundedBoxGeometry(0.32, 0.26, 0.76, 2, 0.02), [hx + 0.16, 1.32, 0]);
  for (const z of [-0.19, 0.19]) {
    kit.add("dark", new THREE.CylinderGeometry(0.15, 0.15, 0.02, 24), [hx + 0.16, 1.455, z]);
    for (const r of [0.05, 0.1, 0.145]) kit.add("steel", new THREE.TorusGeometry(r, 0.005, 4, 28), [hx + 0.16, 1.47, z], [Math.PI / 2, 0, 0]);
    kit.box("steel", [0.3, 0.008, 0.01], [hx + 0.16, 1.47, z]);
    kit.box("steel", [0.01, 0.008, 0.3], [hx + 0.16, 1.47, z]);
  }
  // DC busbars on standoff insulators, running toward the battery yard (-x)
  const by = 0.155 + ch + 0.1;
  for (const [i, z] of [-0.14, 0, 0.14].entries()) {
    kit.box("copper", [1.05, 0.024, 0.07], [cx - 0.12, by + 0.1, z]);
    for (const x of [cx - 0.55, cx + 0.3]) {
      for (let k = 0; k < 4; k++) kit.cyl("ins", 0.034 - (k % 2) * 0.008, 0.024, [x, by + 0.012 + k * 0.022, z], [0, 0, 0], 14);
      kit.cyl("zinc", 0.012, 0.03, [x, by + 0.122, z], [0, 0, 0], 8);
    }
    void i;
  }
  // DC disconnect enclosure where the tray lands
  kit.add("cab", new RoundedBoxGeometry(0.3, 0.4, 0.5, 2, 0.02), [cx - cw / 2 + 0.15, by + 0.2, 0]);
  kit.box("dark", [0.06, 0.1, 0.06], [cx - cw / 2 + 0.15, by + 0.28, 0.27]);

  // MV transformer at the +x end: tank, radiator fins, three bushings
  const tx = 0.82;
  kit.add("paintG", new RoundedBoxGeometry(0.55, 0.8, 0.7, 2, 0.02), [tx, 0.155 + 0.4, 0]);
  for (let k = 0; k < 9; k++) for (const s of [-1, 1]) kit.box("paintG", [0.035, 0.66, 0.16], [tx - 0.22 + k * 0.055, 0.53, s * 0.43]);
  for (const z of [-0.18, 0, 0.18]) {
    for (let k = 0; k < 5; k++) kit.cyl("ins", 0.04 - (k % 2) * 0.01, 0.03, [tx + 0.05, 0.98 + k * 0.03, z], [0, 0, 0], 14);
    kit.cyl("zinc", 0.012, 0.06, [tx + 0.05, 1.15, z], [0, 0, 0], 8);
  }
  kit.add("paintG", new THREE.CylinderGeometry(0.12, 0.12, 0.4, 18), [tx - 0.15, 1.08, -0.18], [0, 0, Math.PI / 2]);
}

/** Step-up substation: main transformer with radiators, conservator and bushings, a dead-end gantry, and a fence. */
export const SUB = { x: 10.45, z: -0.85, w: 2.7, d: 4.4 };
function substationKit(kit: Kit) {
  // main transformer
  kit.add("paintG", new RoundedBoxGeometry(1.15, 1.0, 0.85, 2, 0.03), [0, 0.12 + 0.5, 0.4]);
  kit.box("concrete", [1.5, 0.12, 1.3], [0, 0.06, 0.4]);
  for (const s of [-1, 1]) for (let k = 0; k < 11; k++) kit.box("paintG", [0.032, 0.82, 0.32], [-0.5 + k * 0.1, 0.58, 0.4 + s * 0.62]);
  for (const s of [-1, 1]) { kit.cyl("steel", 0.03, 0.5, [-0.5, 1.02, 0.4 + s * 0.62], [0, 0, Math.PI / 2], 8); kit.cyl("steel", 0.03, 0.5, [0.5, 0.2, 0.4 + s * 0.62], [0, 0, Math.PI / 2], 8); }
  kit.cyl("paintG", 0.15, 0.85, [0, 1.42, 0.05], [0, 0, Math.PI / 2], 18);
  for (const x of [-0.3, 0.3]) kit.box("steel", [0.05, 0.32, 0.05], [x, 1.24, 0.05]);
  for (const x of [-0.32, 0, 0.32]) {
    for (let k = 0; k < 9; k++) kit.cyl("ins", 0.05 - (k % 2) * 0.016, 0.045, [x, 1.15 + k * 0.045, 0.62], [0, 0, 0], 14);
    kit.cyl("zinc", 0.015, 0.1, [x, 1.6, 0.62], [0, 0, 0], 8);
  }
  for (const x of [-0.25, 0, 0.25]) for (let k = 0; k < 3; k++) kit.cyl("ins", 0.035 - (k % 2) * 0.01, 0.04, [x, 1.14 + k * 0.04, 0.12], [0, 0, 0], 12);
  kit.add("cab", new RoundedBoxGeometry(0.4, 0.5, 0.3, 2, 0.02), [0.62, 0.55, -0.15]);
  // dead-end gantry with suspension insulator strings
  for (const x of [-0.95, 0.95]) {
    for (const dx of [-0.05, 0.05]) for (const dz of [-0.05, 0.05]) kit.box("galv", [0.025, 2.3, 0.025], [x + dx, 1.15, -1.45 + dz]);
    for (let k = 0; k < 7; k++) kit.box("galv", [0.012, 0.15, 0.012], [x, 0.2 + k * 0.3, -1.4], [0, 0, k % 2 ? 0.6 : -0.6]);
  }
  kit.box("galv", [2.1, 0.08, 0.08], [0, 2.28, -1.45]);
  kit.box("galv", [2.1, 0.03, 0.03], [0, 2.18, -1.45]);
  for (const x of [-0.55, 0, 0.55]) {
    for (let k = 0; k < 6; k++) kit.cyl("ins", 0.04, 0.025, [x, 2.15 - k * 0.04, -1.45], [0, 0, 0], 12);
    kit.cyl("steel", 0.008, 1.5, [x, 1.68, -0.68], [0.9, 0, 0], 6);
  }
  // fence posts and rails
  const { w, d } = SUB;
  const posts: [number, number][] = [];
  for (let x = -w / 2; x <= w / 2 + 1e-3; x += w / 5) { posts.push([x, -d / 2]); posts.push([x, d / 2]); }
  for (let z = -d / 2 + d / 7; z < d / 2 - 1e-3; z += d / 7) { posts.push([-w / 2, z]); posts.push([w / 2, z]); }
  posts.forEach(([x, z]) => kit.cyl("galv", 0.018, 0.78, [x, 0.39, z], [0, 0, 0], 8));
  for (const z of [-d / 2, d / 2]) for (const y of [0.05, 0.77]) kit.cyl("galv", 0.01, w, [0, y, z], [0, 0, Math.PI / 2], 6);
  for (const x of [-w / 2, w / 2]) for (const y of [0.05, 0.77]) kit.cyl("galv", 0.01, d, [x, y, 0], [Math.PI / 2, 0, 0], 6);
}

function fenceGeo() {
  const { w, d } = SUB, h = 0.72;
  const kit = new Kit();
  kit.add("f", new THREE.PlaneGeometry(w, h), [0, 0.41, d / 2]);
  kit.add("f", new THREE.PlaneGeometry(w, h), [0, 0.41, -d / 2]);
  kit.add("f", new THREE.PlaneGeometry(d, h), [w / 2, 0.41, 0], [0, Math.PI / 2, 0]);
  kit.add("f", new THREE.PlaneGeometry(d, h), [-w / 2, 0.41, 0], [0, Math.PI / 2, 0]);
  const g = kit.build().f;
  // chain-link uv density: one diamond per ~5 cm
  const uv = g.attributes.uv as THREE.BufferAttribute, pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    const along = Math.abs(pos.getZ(i)) > d / 2 - 1e-3 ? pos.getX(i) : pos.getZ(i);
    uv.setXY(i, along * 14, pos.getY(i) * 14);
  }
  return g;
}

function chainLink() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  g.strokeStyle = "rgba(205,208,205,1)"; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, 32); g.lineTo(32, 0); g.lineTo(64, 32); g.lineTo(32, 64); g.closePath(); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function trayKit(kit: Kit, x0: number, x1: number, z: number) {
  const len = x1 - x0, xc = (x0 + x1) / 2;
  for (const s of [-1, 1]) {
    kit.box("galv", [len, 0.06, 0.012], [xc, TRAY_Y, z + s * 0.14]);
    kit.box("galv", [len, 0.012, 0.03], [xc, TRAY_Y - 0.03, z + s * 0.128]);
  }
  for (let x = x0 + 0.05; x < x1; x += 0.14) kit.box("galv", [0.025, 0.012, 0.28], [x, TRAY_Y - 0.025, z]);
  for (const [k, dz] of [-0.08, 0, 0.08].entries()) {
    kit.cyl(k === 1 ? "hv" : "cable", 0.022, len, [xc, TRAY_Y + 0.005, z + dz], [0, 0, Math.PI / 2], 10);
  }
}

export default function Storage({ local, quality }: { local: () => number; quality: Quality }) {
  const faceTex = useMemo(() => batteryTexture(), []);
  const linkTex = useMemo(() => chainLink(), []);
  const fenceMat = useMemo(() => new THREE.MeshStandardMaterial({ map: linkTex, alphaMap: linkTex, transparent: true, opacity: 0.55, metalness: 0.8, roughness: 0.4, side: THREE.DoubleSide, depthWrite: false }), [linkTex]);
  useEffect(() => () => { linkTex.dispose(); fenceMat.dispose(); }, [linkTex, fenceMat]);
  const mats = useMemo(() => ({
    face: new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.6, metalness: 0.3 }),
    casting: new THREE.MeshStandardMaterial({ color: "#bdb8ae", roughness: 0.6, metalness: 0.3 }),
    cutedge: new THREE.MeshStandardMaterial({ color: "#6d6a64", metalness: 0.9, roughness: 0.3 }),
    hvac: new THREE.MeshPhysicalMaterial({ color: "#c9c6bf", metalness: 0.2, roughness: 0.5, clearcoat: 0.2 }),
    cab: new THREE.MeshPhysicalMaterial({ color: "#a7aba8", metalness: 0.3, roughness: 0.45, clearcoat: 0.3 }),
    paintG: new THREE.MeshPhysicalMaterial({ color: "#6f7a73", metalness: 0.3, roughness: 0.5, clearcoat: 0.25 }),
    screen: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.9, 1.1), toneMapped: false }),
    plate: new THREE.MeshStandardMaterial({ color: "#3b3d40", metalness: 0.6, roughness: 0.4 }),
    warn: new THREE.MeshStandardMaterial({ color: "#d7b23c", roughness: 0.5 }),
    hv: new THREE.MeshStandardMaterial({ color: "#a4532c", roughness: 0.5, metalness: 0.05 }),
  }), [faceTex]);

  const built = useMemo(() => {
    const shell = new Kit();
    CONT.zs.forEach((z, i) => containerShell(shell.at([CONT.x, 0, z]), i === 0));
    interior(shell.at([CONT.x, 0, CONT.zs[0]]));
    rackKit(shell.at([CONT.x, 0, CONT.zs[0]]));
    skidKit(shell.at([SKID.x, 0, SKID.z]));
    substationKit(shell.at([SUB.x, 0, SUB.z]));
    // DC bus: from the cut container's roof gland, over the gap, onto the skid and off toward the thread
    trayKit(shell, CONT.x - 0.4, 12.0, SKID.z);
    for (const x of [8.75, 11.85]) {
      shell.box("galv", [0.08, TRAY_Y - 0.03, 0.08], [x, (TRAY_Y - 0.03) / 2, SKID.z - 0.24]);
      shell.box("galv", [0.08, 0.04, 0.4], [x, TRAY_Y - 0.05, SKID.z - 0.1]);
    }
    shell.box("galv", [0.3, 0.12, 0.3], [CONT.x - 0.4, CONT.H + 0.05, SKID.z]);
    const modGeo = new RoundedBoxGeometry(MODW, MODH, MODD, 2, 0.008);
    const faceGeo = new THREE.PlaneGeometry(MODW - 0.02, MODH - 0.016);
    const ledGeo = new THREE.BoxGeometry(0.014, 0.014, 0.006);
    const fence = fenceGeo();
    fence.translate(SUB.x, 0, SUB.z);
    return { geos: shell.build(), modGeo, faceGeo, ledGeo, fence };
  }, []);
  useEffect(() => () => {
    faceTex.dispose(); Object.values(mats).forEach((m) => m.dispose());
    Object.values(built.geos).forEach((g) => g.dispose()); built.modGeo.dispose(); built.faceGeo.dispose(); built.ledGeo.dispose(); built.fence.dispose();
  }, [faceTex, mats, built]);

  const modRef = useRef<THREE.InstancedMesh>(null), faceRef = useRef<THREE.InstancedMesh>(null), ledRef = useRef<THREE.InstancedMesh>(null);
  const n = RACKS * PER;
  const leds = useMemo(() => { const r = rng(37); return Array.from({ length: n }, () => ({ p: r(), amber: r() < 0.12 })); }, [n]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const ox = CONT.x, oz = CONT.zs[0];
    let k = 0;
    for (let i = 0; i < RACKS; i++) for (let j = 0; j < PER; j++) {
      const x = ox + rackX(i), y = 0.21 + j * 0.132 + MODH / 2 + 0.008, z = oz + RACK_Z;
      modRef.current?.setMatrixAt(k, m.makeTranslation(x, y, z));
      faceRef.current?.setMatrixAt(k, m.makeTranslation(x, y, z + MODD / 2 + 0.002));
      ledRef.current?.setMatrixAt(k, m.makeTranslation(x + 0.17, y + 0.03, z + MODD / 2 + 0.004));
      ledRef.current?.setColorAt(k, new THREE.Color(leds[k].amber ? "#ffb347" : "#58e08a"));
      k++;
    }
    [modRef, faceRef, ledRef].forEach((r) => { if (r.current) r.current.instanceMatrix.needsUpdate = true; });
    if (ledRef.current?.instanceColor) ledRef.current.instanceColor.needsUpdate = true;
  }, [leds]);

  // LEDs: steady when idle; while active a charge wave climbs the racks
  const lastT = useRef(-1);
  useFrame(() => {
    const t = local(), L = ledRef.current;
    if (!L || Math.abs(t - lastT.current) < 0.05) return;
    lastT.current = t;
    const c = new THREE.Color();
    for (let k = 0; k < n; k++) {
      const j = k % PER, i = Math.floor(k / PER);
      const wave = t > 0 ? 0.5 + 0.5 * Math.sin(t * 3 - j * 0.8 - i * 0.4) : 0.6;
      c.set(leds[k].amber ? "#ffb347" : "#58e08a").multiplyScalar(0.35 + 0.65 * wave);
      L.setColorAt(k, c);
    }
    if (L.instanceColor) L.instanceColor.needsUpdate = true;
  });

  const kitMat: Record<string, THREE.Material> = {
    paint: EM.paintWhite, casting: mats.casting, dark: EM.rubber, cutedge: mats.cutedge, hvac: mats.hvac, steel: EM.stainless,
    rubber: EM.rubber, floor: EM.floor, light: EM.lightStrip, galv: EM.galv, rack: EM.rackBlack, screen: mats.screen, cable: EM.cable,
    hv: mats.hv, cab: mats.cab, plate: mats.plate, warn: mats.warn, alu: EM.frameAlu, copper: EM.copperBar, ins: EM.insulator,
    zinc: EM.zinc, paintG: mats.paintG, concrete: EM.concrete,
  };
  return (
    <group>
      {Object.entries(built.geos).map(([k, g]) => <mesh key={k} geometry={g} material={kitMat[k] ?? EM.paintGrey} />)}
      <mesh geometry={built.fence} material={fenceMat} renderOrder={1} />
      <instancedMesh ref={modRef} args={[built.modGeo, EM.rackBlack, n]} frustumCulled={false} />
      <instancedMesh ref={faceRef} args={[built.faceGeo, mats.face, n]} frustumCulled={false} />
      <instancedMesh ref={ledRef} args={[built.ledGeo, EM.glow, n]} frustumCulled={false} />
      <pointLight position={[CONT.x, 1.2, CONT.zs[0] + 0.2]} intensity={quality === "high" ? 1.6 : 1.2} distance={3.2} decay={2} color="#f3efe6" />
    </group>
  );
}
