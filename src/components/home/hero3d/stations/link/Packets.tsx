"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { Quality } from "../../types";
import { NODES, bodyToTilt, perPlane, planRoutes, satPos, terminalPoint } from "./geo";

/*
 * Federated round, looped every 9 s (station time):
 *   0.4–1.6  each Node's encrypted Δw climbs to its nearest satellite
 *   1.6–4.2  it hops along laser links to the aggregation satellite
 *   4.2–5.0  updates merge there (the satellite flares)
 *   5.0–7.4  the merged update hops back
 *   7.4–8.4  and lands at every Node
 */
const CYCLE = 9;
const PH = { up: [0.4, 1.6], hop: [1.6, 4.2], merge: [4.2, 5.0], back: [5.0, 7.4], down: [7.4, 8.4] } as const;
const ease = (u: number) => u * u * (3 - 2 * u);
const span = (t: number, [a, b]: readonly [number, number]) => THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _t = new THREE.Vector3();

const glowVert = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
uniform float uH;
varying vec3 vColor;
void main() {
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = min(aSize * projectionMatrix[1][1] * uH * 0.5 / -mv.z, uH * 0.06);
  gl_Position = projectionMatrix * mv;
}
`;
const glowFrag = /* glsl */ `
varying vec3 vColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = dot(d, d) * 4.0;
  float a = exp(-r * 5.0) + 0.6 * exp(-r * 40.0);
  if (a < 0.003) discard;
  gl_FragColor = vec4(vColor * a, 1.0);
}
`;

export default function Packets({ quality, time }: { quality: Quality; time: () => number }) {
  const S = perPlane(quality === "low");
  const plan = useMemo(() => planRoutes(S), [S]);
  const NP = NODES.length, TRAIL = 14;
  const nGlow = NP * (TRAIL + 1) + 1 + NP;

  const diamonds = useRef<THREE.InstancedMesh>(null);
  const diamondGeo = useMemo(() => new THREE.OctahedronGeometry(1, 0).scale(0.7, 1, 0.7), []);
  const glow = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nGlow * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(nGlow), 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(nGlow * 3), 3).setUsage(THREE.DynamicDrawUsage));
    return g;
  }, [nGlow]);
  const glowMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: glowVert, fragmentShader: glowFrag, uniforms: { uH: { value: 800 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  }), []);

  // highlighted route: every hop of every route, plus the four up/down beams
  const segCount = plan.routes.reduce((s, r) => s + r.length - 1, 0) + NP;
  const route = useMemo(() => {
    const geo = new LineSegmentsGeometry();
    const mat = new LineMaterial({ linewidth: 2.2, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const line = new LineSegments2(geo, mat);
    line.frustumCulled = false;
    const pos = new Float32Array(segCount * 6), col = new Float32Array(segCount * 6);
    // the geometry keeps these arrays; we rewrite them in place each frame and flag the buffers
    geo.setPositions(pos);
    geo.setColors(col);
    return { line, geo, mat, pos, col };
  }, [segCount]);

  const sat = (i: number, t: number, out: THREE.Vector3) => satPos(Math.floor(i / S), i % S, S, t, out);
  const term = (i: number, t: number, out: THREE.Vector3) => bodyToTilt(terminalPoint(i, out), t, out);

  /** Point at fraction u along a polyline of satellites. */
  const along = (path: number[], u: number, t: number, out: THREE.Vector3) => {
    const pts = path.map((i) => sat(i, t, new THREE.Vector3()));
    let total = 0;
    for (let i = 1; i < pts.length; i++) total += pts[i].distanceTo(pts[i - 1]);
    if (total === 0) return out.copy(pts[0]);
    let d = u * total;
    for (let i = 1; i < pts.length; i++) {
      const l = pts[i].distanceTo(pts[i - 1]);
      if (d <= l) return out.lerpVectors(pts[i - 1], pts[i], d / l);
      d -= l;
    }
    return out.copy(pts[pts.length - 1]);
  };

  /** Packet i at cycle time c, plus how bright it is. */
  const packetAt = (i: number, c: number, t: number, out: THREE.Vector3) => {
    const path = plan.routes[i];
    if (c < PH.up[0] || c > PH.down[1]) return 0;
    if (c < PH.up[1]) { term(i, t, _a); sat(path[0], t, _b); out.lerpVectors(_a, _b, ease(span(c, PH.up))); return 1; }
    if (c < PH.hop[1]) { along(path, ease(span(c, PH.hop)), t, out); return 1; }
    if (c < PH.merge[1]) { sat(plan.agg, t, out); return 1.6; }
    if (c < PH.back[1]) { along(path, 1 - ease(span(c, PH.back)), t, out); return 1.3; }
    sat(path[0], t, _a); term(i, t, _b);
    out.lerpVectors(_a, _b, ease(span(c, PH.down)));
    return 1.3;
  };

  const _m = useMemo(() => new THREE.Matrix4(), []);
  const _q = useMemo(() => new THREE.Quaternion(), []);
  const _s = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ size, gl }) => {
    const t = time();
    const c = t > 0 ? t % CYCLE : -1;
    glowMat.uniforms.uH.value = size.height * gl.getPixelRatio();
    route.mat.resolution.set(size.width, size.height);
    const P = glow.attributes.position.array as Float32Array, Z = glow.attributes.aSize.array as Float32Array, C = glow.attributes.aColor.array as Float32Array;
    let g = 0;
    const put = (v: THREE.Vector3, s: number, r: number, gg: number, b: number) => {
      P[g * 3] = v.x; P[g * 3 + 1] = v.y; P[g * 3 + 2] = v.z; Z[g] = s; C[g * 3] = r; C[g * 3 + 1] = gg; C[g * 3 + 2] = b; g++;
    };
    const d = diamonds.current;
    for (let i = 0; i < NP; i++) {
      const k = c < 0 ? 0 : packetAt(i, c, t, _t);
      const merged = c >= PH.merge[0];
      const sc = k ? (merged ? 0.07 : 0.05) : 0;
      _q.setFromAxisAngle(_s.set(0, 1, 0), t * 2 + i);
      _m.compose(_t, _q, _s.set(sc, sc * 1.2, sc));
      d?.setMatrixAt(i, _m);
      put(_t, k ? 0.28 * k : 0, 1.0, 0.45, 0.18);
      for (let j = 1; j <= TRAIL; j++) {
        const kk = c < 0 ? 0 : packetAt(i, c - j * 0.045, t, _a);
        const f = (1 - j / (TRAIL + 1)) * (kk ? 1 : 0) * (k ? 1 : 0);
        put(_a, 0.12 * f + 0.02, f * 0.9, f * 0.36, f * 0.13);
      }
    }
    if (d) d.instanceMatrix.needsUpdate = true;
    // aggregation satellite: always faintly marked, flares as updates merge
    sat(plan.agg, t, _a);
    const flare = c < 0 ? 0 : Math.exp(-Math.pow((c - 4.6) / 0.5, 2));
    put(_a, 0.3 + 1.1 * flare, 0.35 + 1.2 * flare, 0.16 + 0.55 * flare, 0.07 + 0.25 * flare);
    // Nodes flash when the merged update lands
    const land = c < 0 ? 0 : Math.exp(-Math.pow((c - 8.5) / 0.35, 2)) + 0.6 * Math.exp(-Math.pow((c - 0.5) / 0.3, 2));
    for (let i = 0; i < NP; i++) { term(i, t, _a); put(_a, 0.07 + 0.3 * land, 0.5 + land, 0.21 + 0.5 * land, 0.08 + 0.2 * land); }
    glow.attributes.position.needsUpdate = true; glow.attributes.aSize.needsUpdate = true; glow.attributes.aColor.needsUpdate = true;
    glow.computeBoundingSphere();

    // route glow: hops brighten while updates are on them; beams while climbing or landing
    const RP = route.pos, RC = route.col;
    let s = 0;
    const seg = (a: THREE.Vector3, b: THREE.Vector3, k: number) => {
      RP.set([a.x, a.y, a.z, b.x, b.y, b.z], s * 6);
      RC.set([k, k * 0.42, k * 0.17, k, k * 0.42, k * 0.17], s * 6);
      s++;
    };
    const hopOn = c < 0 ? 0.0 : 0.12 + 1.0 * (span(c, [1.4, 1.8]) - span(c, [7.2, 7.8]));
    const beamOn = c < 0 ? 0.0 : 0.15 + 1.1 * (Math.max(span(c, [0.3, 0.6]) - span(c, [1.6, 2.0]), span(c, [7.3, 7.6]) - span(c, [8.4, 8.8])));
    plan.routes.forEach((path, i) => {
      for (let h = 1; h < path.length; h++) seg(sat(path[h - 1], t, _a), sat(path[h], t, _b), hopOn);
      seg(term(i, t, _a), sat(path[0], t, _b), beamOn);
    });
    (route.geo.attributes.instanceStart as THREE.InterleavedBufferAttribute).data.needsUpdate = true;
    (route.geo.attributes.instanceColorStart as THREE.InterleavedBufferAttribute).data.needsUpdate = true;
    route.geo.computeBoundingSphere();
  });

  return (
    <group>
      <primitive object={route.line} />
      <instancedMesh ref={diamonds} args={[diamondGeo, undefined, NP]} frustumCulled={false}>
        <meshStandardMaterial color="#ff6b2c" emissive="#ff6b2c" emissiveIntensity={3} toneMapped={false} />
      </instancedMesh>
      <points geometry={glow} material={glowMat} frustumCulled={false} />
    </group>
  );
}
