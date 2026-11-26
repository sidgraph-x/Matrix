"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { FLOOR, PLINTH_TOP } from "./layout";
import { rng } from "./weights";

/** A box with crisp 45° chamfers on every edge, centred on the origin. */
export function chamferBox(w: number, h: number, d: number, c: number) {
  const s = new THREE.Shape();
  const x = w / 2 - c, z = d / 2 - c;
  s.moveTo(-x, -z); s.lineTo(x, -z); s.lineTo(x, z); s.lineTo(-x, z); s.lineTo(-x, -z);
  const g = new THREE.ExtrudeGeometry(s, { depth: h - 2 * c, bevelEnabled: true, bevelSize: c, bevelThickness: c, bevelSegments: 1, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -(h - 2 * c) / 2, 0);
  g.computeVertexNormals();
  // box-project UVs (normalised 0..1 per face) so lathe and brush maps don't tile per unit
  const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i) / w + 0.5, py = pos.getY(i) / h + 0.5, pz = pos.getZ(i) / d + 0.5;
    const ax = Math.abs(nor.getX(i)), ay = Math.abs(nor.getY(i)), az = Math.abs(nor.getZ(i));
    if (ay >= ax && ay >= az) uv.setXY(i, px, pz);
    else if (az >= ax) uv.setXY(i, px, py);
    else uv.setXY(i, pz, py);
  }
  return g;
}

/** Fine machining marks: concentric lathe rings for the top face, used as a roughness map. */
function latheTexture(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const r = rng(77);
  g.fillStyle = "#8a8a8a"; g.fillRect(0, 0, size, size);
  for (let k = 0; k < size * 0.75; k++) {
    const rad = (k / (size * 0.75)) * size * 0.72;
    const v = 110 + Math.floor(r() * 70);
    g.strokeStyle = `rgb(${v},${v},${v})`;
    g.lineWidth = 0.6 + r() * 0.9;
    g.beginPath(); g.arc(size / 2, size / 2, rad, 0, Math.PI * 2); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  return t;
}

/** Linear brushing along x for the side faces. */
function brushTexture(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  const r = rng(91);
  g.fillStyle = "#808080"; g.fillRect(0, 0, w, h);
  for (let k = 0; k < h * 3; k++) {
    const v = 95 + Math.floor(r() * 80), y = r() * h;
    g.fillStyle = `rgba(${v},${v},${v},0.55)`;
    g.fillRect(0, y, w, 0.6 + r());
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** Side faces of the body: two machined grooves (shadow line over a highlight) and a fine scale of ticks. */
function grooveTexture() {
  const w = 1024, h = 128, c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, "#8f8a83"); grd.addColorStop(1, "#5d5953");
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  for (const y of [0.2, 0.8]) {
    g.fillStyle = "#151412"; g.fillRect(0, y * h - 3, w, 4);
    g.fillStyle = "#c9c3b9"; g.fillRect(0, y * h + 1, w, 1);
  }
  g.fillStyle = "rgba(20,19,17,0.8)";
  for (let k = 0; k <= 96; k++) {
    const x = 24 + (k / 96) * (w - 48), long = k % 8 === 0;
    g.fillRect(x, 0.8 * h - 3 - (long ? 12 : 6), 1.5, long ? 12 : 6);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function labelTexture() {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 96;
  const g = c.getContext("2d")!;
  const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim() || "ui-monospace, monospace";
  g.fillStyle = "#1d1b19"; g.fillRect(0, 0, 1024, 96);
  g.strokeStyle = "rgba(237,230,218,0.35)"; g.lineWidth = 2; g.strokeRect(6, 6, 1012, 84);
  g.fillStyle = "rgba(237,230,218,0.82)";
  g.font = `500 28px ${mono}`;
  g.textBaseline = "middle";
  g.fillText("BASE MODEL  ·  24 LAYERS  ·  d 4096  ·  FROZEN  ·  SHARED", 34, 50);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const FOOT = 0.24, BASE = 0.96, COLLAR = 0.32;
const BASE_W = 9.6, COLLAR_W = 8.1, FOOT_W = 9.0;

/** The machined base the stack seats on: foot, anodised body with a lit seam, a lathe-finished collar and its cap screws. */
export default function Plinth({ quality }: { quality: "high" | "low" }) {
  const mats = useMemo(() => {
    const lathe = latheTexture(quality === "high" ? 1024 : 512);
    const brush = brushTexture(512, 64);
    brush.repeat.set(1, 1);
    return {
      lathe, brush,
      body: new THREE.MeshPhysicalMaterial({ color: "#2b2825", metalness: 0.85, roughness: 0.42, roughnessMap: brush, clearcoat: 0.25, clearcoatRoughness: 0.4 }),
      bodySide: new THREE.MeshPhysicalMaterial({ color: "#77726a", map: grooveTexture(), metalness: 0.55, roughness: 0.48, roughnessMap: brush, clearcoat: 0.25, clearcoatRoughness: 0.4 }),
      collar: new THREE.MeshPhysicalMaterial({ color: "#77736c", metalness: 1, roughness: 0.3, roughnessMap: lathe }),
      foot: new THREE.MeshStandardMaterial({ color: "#151413", metalness: 0.6, roughness: 0.6 }),
      seam: new THREE.MeshStandardMaterial({ color: "#0d0c0b", emissive: "#cfd2d6", emissiveIntensity: 0.16, roughness: 0.6 }),
      screw: new THREE.MeshPhysicalMaterial({ color: "#9a958d", metalness: 1, roughness: 0.22 }),
      socket: new THREE.MeshStandardMaterial({ color: "#0c0b0a", roughness: 0.8 }),
      label: new THREE.MeshStandardMaterial({ map: labelTexture(), metalness: 0.3, roughness: 0.5, emissive: "#ffffff", emissiveIntensity: 0.1 }),
    };
  }, [quality]);
  useEffect(() => () => {
    Object.values(mats).forEach((m) => (m as { dispose?: () => void }).dispose?.());
    mats.label.map?.dispose(); mats.bodySide.map?.dispose();
  }, [mats]);

  const geo = useMemo(() => ({
    foot: chamferBox(FOOT_W, FOOT, FOOT_W, 0.04),
    base: chamferBox(BASE_W, BASE, BASE_W, 0.07),
    collar: chamferBox(COLLAR_W, COLLAR, COLLAR_W, 0.05),
    seam: chamferBox(COLLAR_W + 0.16, 0.03, COLLAR_W + 0.16, 0.01),
    screw: new THREE.CylinderGeometry(0.085, 0.085, 0.05, 20),
    socket: new THREE.CylinderGeometry(0.04, 0.04, 0.052, 6),
    label: new THREE.PlaneGeometry(4.2, 0.394),
  }), []);

  const collarY = PLINTH_TOP - COLLAR / 2;
  const baseY = PLINTH_TOP - COLLAR - BASE / 2;
  const footY = FLOOR + FOOT / 2;

  // cap screws around the collar's top perimeter
  const screws = useRef<THREE.InstancedMesh>(null);
  const sockets = useRef<THREE.InstancedMesh>(null);
  const holes = useMemo(() => {
    const p: [number, number][] = [];
    const e = COLLAR_W / 2 - 0.28, per = 7;
    for (let k = 0; k < per; k++) {
      const u = -e + ((k + 0.5) / per) * 2 * e;
      p.push([u, -e], [u, e], [-e, u], [e, u]);
    }
    return p;
  }, []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    holes.forEach(([x, z], k) => {
      m.makeTranslation(x, PLINTH_TOP + 0.02, z);
      screws.current?.setMatrixAt(k, m);
      m.makeTranslation(x, PLINTH_TOP + 0.022, z);
      sockets.current?.setMatrixAt(k, m);
    });
    if (screws.current) screws.current.instanceMatrix.needsUpdate = true;
    if (sockets.current) sockets.current.instanceMatrix.needsUpdate = true;
  }, [holes]);

  return (
    <group>
      <mesh geometry={geo.foot} material={mats.foot} position={[0, footY, 0]} />
      {/* extrude groups: 0 = top and bottom caps, 1 = the four sides */}
      <mesh geometry={geo.base} material={[mats.body, mats.bodySide]} position={[0, baseY, 0]} />
      {/* a lit seam where the collar meets the body */}
      <mesh geometry={geo.seam} material={mats.seam} position={[0, PLINTH_TOP - COLLAR - 0.005, 0]} />
      <mesh geometry={geo.collar} material={mats.collar} position={[0, collarY, 0]} />
      <instancedMesh ref={screws} args={[geo.screw, mats.screw, holes.length]} />
      <instancedMesh ref={sockets} args={[geo.socket, mats.socket, holes.length]} />
      <mesh geometry={geo.label} material={mats.label} position={[0, baseY + 0.02, BASE_W / 2 + 0.004]} />
    </group>
  );
}
