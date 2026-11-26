"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { M } from "../../materials";
import type { Quality } from "../../types";
import { FIBER, NODES, R, nodeMatrix, rng } from "./geo";

function corrugated(size: number) {
  const c = document.createElement("canvas");
  c.width = size; c.height = size / 2;
  const g = c.getContext("2d")!;
  const ribs = 36, w = c.width / ribs;
  for (let i = 0; i < ribs; i++) {
    const grd = g.createLinearGradient(i * w, 0, (i + 1) * w, 0);
    grd.addColorStop(0, "#8c8a85"); grd.addColorStop(0.35, "#d7d4cd"); grd.addColorStop(0.7, "#bdbab3"); grd.addColorStop(1, "#7b7974");
    g.fillStyle = grd; g.fillRect(i * w, 0, w, c.height);
  }
  g.fillStyle = "#5a5853"; g.fillRect(0, 0, c.width, c.height * 0.05); g.fillRect(0, c.height * 0.95, c.width, c.height * 0.05);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function terminalFace(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = "#e4e2dc"; g.fillRect(0, 0, size, size);
  const n = 48, s = size / n;
  g.fillStyle = "#a8a59d";
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) g.fillRect(i * s + s * 0.25, j * s + s * 0.25, s * 0.5, s * 0.5);
  g.strokeStyle = "#8d8a82"; g.lineWidth = size * 0.03; g.strokeRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/** One Node: concrete pad, 20 ft enclosure, cooling units, and a tilted flat-panel terminal on a pedestal. */
function NodeKit({ i, mats }: { i: number; mats: Record<string, THREE.Material> }) {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const g = ref.current;
    if (!g) return;
    nodeMatrix(i, g.matrix);
    g.matrixAutoUpdate = false;
    g.matrixWorldNeedsUpdate = true;
  }, [i]);
  return (
    <group ref={ref}>
      <RoundedBox args={[1.9, 0.07, 1.15]} radius={0.02} smoothness={2} position={[0.1, 0.035, 0]} material={M.concrete} />
      <RoundedBox args={[1.0, 0.42, 0.4]} radius={0.015} smoothness={2} position={[-0.3, 0.28, -0.12]} material={mats.box} />
      {/* door frames and cooling units on the end wall */}
      <mesh position={[-0.81, 0.28, -0.12]} material={M.darkMetal}><boxGeometry args={[0.02, 0.38, 0.36]} /></mesh>
      {[-0.42, -0.08].map((x) => (
        <group key={x} position={[x, 0.17, 0.2]}>
          <RoundedBox args={[0.24, 0.2, 0.14]} radius={0.01} smoothness={2} material={M.darkMetal} />
          <mesh position={[0, 0.02, 0.072]} rotation-x={0}><circleGeometry args={[0.07, 24]} /><meshStandardMaterial color="#1b1a18" metalness={0.6} roughness={0.5} /></mesh>
        </group>
      ))}
      {/* conduit to the terminal */}
      <mesh position={[0.3, 0.1, -0.05]} rotation-z={Math.PI / 2} material={M.darkMetal}><cylinderGeometry args={[0.018, 0.018, 0.6, 8]} /></mesh>
      {/* terminal: pedestal, gimbal yoke, flat panel */}
      <group position={[0.62, 0.07, 0]}>
        <mesh position={[0, 0.12, 0]} material={M.aluminium}><cylinderGeometry args={[0.035, 0.05, 0.24, 16]} /></mesh>
        <group position={[0, 0.27, 0]} rotation-z={-0.42}>
          <RoundedBox args={[0.52, 0.035, 0.52]} radius={0.012} smoothness={2} material={mats.panelBack} />
          <mesh position={[0, 0.0185, 0]} rotation-x={-Math.PI / 2} material={mats.face}><planeGeometry args={[0.5, 0.5]} /></mesh>
        </group>
      </group>
      <mesh position={[-0.79, 0.44, 0.06]} material={mats.led}><sphereGeometry args={[0.014, 8, 8]} /></mesh>
      {/* site marker: a thin survey ring on the ground, so the Node reads at orbital distance */}
      <mesh position={[0.1, 0.012, 0]} rotation-x={-Math.PI / 2} material={mats.ring}><ringGeometry args={[2.55, 2.66, 72]} /></mesh>
    </group>
  );
}

const fiberVert = /* glsl */ `
attribute float aT;
varying float vT;
void main() { vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const fiberFrag = /* glsl */ `
uniform float uTime;
varying float vT;
void main() {
  float pulse = pow(0.5 + 0.5 * sin(vT * 60.0 - uTime * 5.0), 10.0);
  vec3 c = vec3(1.0, 0.42, 0.17) * (0.9 + 3.0 * pulse);
  gl_FragColor = vec4(c, 1.0);
}
`;

/** A great-circle fiber arc between two body-frame unit vectors, plus repeater positions every ~2°. */
function arc(a: THREE.Vector3, b: THREE.Vector3, h: number) {
  const ang = a.angleTo(b), axis = new THREE.Vector3().crossVectors(a, b).normalize();
  const pts: THREE.Vector3[] = [], steps = 64;
  for (let s = 0; s <= steps; s++) pts.push(a.clone().applyAxisAngle(axis, (ang * s) / steps).multiplyScalar(R + h));
  const reps: THREE.Vector3[] = [];
  const n = Math.max(2, Math.floor(THREE.MathUtils.radToDeg(ang) / 1.6));
  for (let s = 1; s < n; s++) reps.push(a.clone().applyAxisAngle(axis, (ang * s) / n));
  return { curve: new THREE.CatmullRomCurve3(pts), reps, axis };
}

export default function GroundNodes({ quality, time }: { quality: Quality; time: () => number }) {
  const hi = quality === "high";
  const mats = useMemo(() => ({
    box: new THREE.MeshStandardMaterial({ map: corrugated(hi ? 512 : 256), metalness: 0.45, roughness: 0.45 }),
    panelBack: new THREE.MeshStandardMaterial({ color: "#d6d3cc", metalness: 0.2, roughness: 0.5 }),
    face: new THREE.MeshStandardMaterial({ map: terminalFace(hi ? 512 : 256), roughness: 0.55 }),
    led: new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#d8f0ff", emissiveIntensity: 3, toneMapped: false }),
    ring: new THREE.MeshBasicMaterial({ color: "#ede6da", transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }),
  }), [hi]);

  const fibers = useMemo(() => FIBER.map(([a, b]) => {
    const { curve, reps, axis } = arc(NODES[a], NODES[b], 0.025);
    const g = new THREE.TubeGeometry(curve, 160, 0.011, 6, false);
    const n = g.attributes.position.count, perRing = 7, t = new Float32Array(n);
    for (let i = 0; i < n; i++) t[i] = Math.floor(i / perRing) / 160;
    g.setAttribute("aT", new THREE.BufferAttribute(t, 1));
    return { g, reps, axis };
  }), []);
  const fiberMat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: fiberVert, fragmentShader: fiberFrag, uniforms: { uTime: { value: 0 } }, toneMapped: false }), []);

  const repeaters = useRef<THREE.InstancedMesh>(null);
  const repGeo = useMemo(() => new THREE.CylinderGeometry(0.02, 0.02, 0.06, 12).rotateZ(Math.PI / 2), []);
  const repCount = fibers.reduce((s, f) => s + f.reps.length, 0);
  useLayoutEffect(() => {
    const m = repeaters.current;
    if (!m) return;
    const r = rng(5), mx = new THREE.Matrix4(), fwd = new THREE.Vector3(), side = new THREE.Vector3(), sc = new THREE.Vector3();
    let k = 0;
    for (const f of fibers)
      for (const p of f.reps) {
        fwd.crossVectors(f.axis, p).normalize();
        side.crossVectors(fwd, p);
        const s = 0.9 + r() * 0.2;
        mx.makeBasis(fwd, p, side).scale(sc.set(s, s, s)).setPosition(p.clone().multiplyScalar(R + 0.025));
        m.setMatrixAt(k++, mx);
      }
    m.instanceMatrix.needsUpdate = true;
  }, [fibers]);

  const fiberRefs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    const m = fiberRefs.current[0];
    if (m) (m.material as THREE.ShaderMaterial).uniforms.uTime.value = time();
  });

  return (
    <group>
      {NODES.map((_, i) => <NodeKit key={i} i={i} mats={mats} />)}
      {fibers.map((f, i) => <mesh key={i} ref={(r) => { fiberRefs.current[i] = r; }} geometry={f.g} material={fiberMat} />)}
      <instancedMesh ref={repeaters} args={[repGeo, M.nickel, repCount]} />
    </group>
  );
}
