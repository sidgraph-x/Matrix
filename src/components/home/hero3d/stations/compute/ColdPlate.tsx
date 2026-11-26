"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useLocalTime } from "../../clock";
import { M } from "../../materials";
import type { Quality } from "../../types";
import { frameGeometry, useGeo, useInstanced, type Inst } from "./helpers";
import { PLATE, explodeAt, rng } from "./layout";
import { CM } from "./mats";

/*
 * Direct-to-chip cold plate, nickel-plated copper. A base plate carries skived copper microchannel fins
 * over the die footprint; a walled chamber with plenums at both ends; a lid with a polycarbonate window,
 * twelve black-oxide screws and two barbed fittings. Coolant enters at -x, spreads through the plenum,
 * runs the channels and leaves at +x. Origin is the plate's underside.
 */

const FIN = { x: 2.5, z: 1.9, h: 0.28, t: 0.022 };
const WALL = { ix: 2.8, iz: 2.1 };
const HOLE = { x: 2.3, z: 1.8 };
export const BARB_X = 2.65;
const H0 = PLATE.base, H1 = PLATE.base + PLATE.chamber, H2 = H1 + PLATE.lid;
export const PLATE_H = H2;

function barbGeometry() {
  // outer profile up with three barb ridges, then back down the bore
  const pts: THREE.Vector2[] = [new THREE.Vector2(0.06, 0), new THREE.Vector2(0.1, 0), new THREE.Vector2(0.1, 0.06)];
  let y = 0.06;
  for (let k = 0; k < 3; k++) {
    pts.push(new THREE.Vector2(0.088, y + 0.005), new THREE.Vector2(0.118, y + 0.075), new THREE.Vector2(0.088, y + 0.08));
    y += 0.085;
  }
  pts.push(new THREE.Vector2(0.088, y + 0.04), new THREE.Vector2(0.078, y + 0.055), new THREE.Vector2(0.058, y + 0.055), new THREE.Vector2(0.058, 0.02));
  return new THREE.LatheGeometry(pts, 28);
}

const coolVert = /* glsl */ `
  attribute float aHeat;
  varying float vHeat;
  uniform float uSize;
  void main() {
    vHeat = aHeat;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const coolFrag = /* glsl */ `
  varying float vHeat;
  uniform float uOn;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float a = smoothstep(0.5, 0.1, length(c));
    vec3 cold = vec3(0.55, 0.8, 1.3), warm = vec3(1.15, 1.0, 0.9);
    gl_FragColor = vec4(mix(cold, warm, vHeat) * 1.25, a * uOn * 0.85);
  }
`;

function Coolant({ index, quality }: { index: number; quality: Quality }) {
  const n = quality === "high" ? 900 : 360;
  const local = useLocalTime(index);
  const data = useMemo(() => {
    const r = rng(77), lane = new Float32Array(n), phase = new Float32Array(n), jit = new Float32Array(n);
    // particles ride in the channels between fins, in loose trains
    const pitch = quality === "high" ? 0.054 : 0.1, lanes = Math.floor((2 * FIN.z) / pitch);
    for (let i = 0; i < n; i++) {
      const L = Math.floor(r() * lanes);
      lane[i] = -FIN.z + (L + 0.5) * pitch;
      phase[i] = (L * 0.137 + Math.floor(r() * 9) / 9 + r() * 0.02) % 1;
      jit[i] = r();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute("aHeat", new THREE.BufferAttribute(new Float32Array(n), 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, H1, 0), 4);
    return { lane, phase, jit, geo };
  }, [n, quality]);
  const mat = useMemo(
    () => new THREE.ShaderMaterial({
      vertexShader: coolVert, fragmentShader: coolFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
      uniforms: { uSize: { value: 52 }, uOn: { value: 0 } },
    }),
    [],
  );
  const pts = useRef<THREE.Points>(null);

  useFrame(() => {
    const t = local();
    const p = pts.current;
    if (!p) return;
    const u = (p.material as THREE.ShaderMaterial).uniforms.uOn;
    // faint while the plate is seated, full once it lifts away and the window is in view
    u.value += (0.25 + 0.75 * explodeAt(t) - u.value) * 0.08;
    const pa = p.geometry.attributes.position as THREE.BufferAttribute, ha = p.geometry.attributes.aHeat as THREE.BufferAttribute;
    const pos = pa.array as Float32Array, heat = ha.array as Float32Array;
    const yc = H0 + FIN.h + 0.025, top = H2 + 0.45;
    for (let i = 0; i < n; i++) {
      const s = (data.phase[i] + t * 0.11) % 1, z = data.lane[i], j = data.jit[i];
      let x = 0, y = 0, zz = 0, h = 0;
      if (s < 0.12) { const u = s / 0.12; x = -BARB_X; y = top + (yc - top) * u; zz = (j - 0.5) * 0.08; }
      else if (s < 0.2) { const u = (s - 0.12) / 0.08; x = -BARB_X + 0.1 * u; y = yc; zz = z * u; }
      else if (s < 0.84) { const u = (s - 0.2) / 0.64; x = -FIN.x + 2 * FIN.x * u; y = yc + Math.sin(u * 18 + j * 6) * 0.012; zz = z; h = u; }
      else if (s < 0.9) { const u = (s - 0.84) / 0.06; x = FIN.x + 0.15 * u; y = yc; zz = z * (1 - u); h = 1; }
      else { const u = (s - 0.9) / 0.1; x = BARB_X; y = yc + (top - yc) * u; zz = (j - 0.5) * 0.08; h = 1; }
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = zz; heat[i] = h * 0.8;
    }
    pa.needsUpdate = true;
    ha.needsUpdate = true;
  });

  return <points ref={pts} geometry={data.geo} material={mat} renderOrder={3} />;
}

export default function ColdPlate({ index, quality }: { index: number; quality: Quality }) {
  const hi = quality === "high";
  const baseGeo = useGeo(() => new RoundedBoxGeometry(PLATE.w, PLATE.base, PLATE.d, 2, 0.04), []);
  const wallGeo = useGeo(() => frameGeometry(PLATE.w - 0.05, PLATE.d - 0.05, WALL.ix * 2, WALL.iz * 2, PLATE.chamber - 0.008, 0.012, 0.1), []);
  const lidGeo = useGeo(() => frameGeometry(PLATE.w, PLATE.d, HOLE.x * 2, HOLE.z * 2, PLATE.lid, 0.02, 0.1), []);
  const finGeo = useGeo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const barbGeo = useGeo(barbGeometry, []);
  const hexGeo = useGeo(() => new THREE.CylinderGeometry(0.17, 0.17, 0.1, 6), []);
  const screwGeo = useGeo(() => {
    const g = new THREE.CylinderGeometry(0.085, 0.09, 0.06, 20);
    g.translate(0, 0.03, 0);
    return g;
  }, []);
  const socketGeo = useGeo(() => new THREE.CylinderGeometry(0.038, 0.038, 0.01, 6), []);

  const fins = useMemo(() => {
    const pitch = hi ? 0.054 : 0.1, list: Inst[] = [];
    for (let z = -FIN.z; z <= FIN.z + 1e-6; z += pitch) list.push({ p: [0, H0 + FIN.h / 2, z], s: [FIN.x * 2, FIN.h, FIN.t * (hi ? 1 : 1.6)] });
    return list;
  }, [hi]);
  const finRef = useInstanced(fins);

  const screws = useMemo(() => {
    const list: Inst[] = [], sock: Inst[] = [];
    const xs = [-3.1, -1.55, 0, 1.55, 3.1], zs = [-2.2, 2.2];
    for (const x of xs) for (const z of zs) list.push({ p: [x, H2, z], r: [0, x * 1.3 + z, 0] });
    list.push({ p: [-3.1, H2, 0] }, { p: [3.1, H2, 0] });
    for (const it of list) sock.push({ p: [it.p[0], H2 + 0.061, it.p[2]], r: it.r });
    return { list, sock };
  }, []);
  const screwRef = useInstanced(screws.list);
  const sockRef = useInstanced(screws.sock);

  return (
    <group>
      <mesh geometry={baseGeo} material={M.nickel} position={[0, PLATE.base / 2, 0]} />
      {/* copper floor of the chamber, exposed between the fins */}
      <mesh material={M.copper} position={[0, H0 + 0.001, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[WALL.ix * 2, WALL.iz * 2]} />
      </mesh>
      <instancedMesh ref={finRef} args={[finGeo, M.copper, fins.length]} />
      <mesh geometry={wallGeo} material={M.nickel} position={[0, H0, 0]} />
      <mesh geometry={lidGeo} material={M.nickel} position={[0, H1, 0]} />
      <mesh material={CM.window} position={[0, H1 + PLATE.lid * 0.5, 0]}>
        <boxGeometry args={[HOLE.x * 2 + 0.04, PLATE.lid * 0.8, HOLE.z * 2 + 0.04]} />
      </mesh>
      <instancedMesh ref={screwRef} args={[screwGeo, CM.blackOxide, screws.list.length]} />
      <instancedMesh ref={sockRef} args={[socketGeo, M.darkMetal, screws.sock.length]} />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * BARB_X, H2, 0]}>
          <mesh geometry={hexGeo} material={CM.brass} position={[0, 0.05, 0]} />
          <mesh geometry={barbGeo} material={CM.brass} position={[0, 0.1, 0]} />
        </group>
      ))}
      <Coolant index={index} quality={quality} />
    </group>
  );
}
