"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useLocalTime } from "../../clock";
import type { Quality } from "../../types";
import { GALAXY, YOU, gauss, rng } from "./space";
import { pixelScale, spriteFrag, spriteSize } from "./sprite";

/*
 * The style space. Each point is one person's style, embedded and projected to 3D (simulated): a broad
 * population made of anisotropic lobes joined by filaments, a faint haze, the base model's outputs
 * collapsed at the centroid, your own cluster off-centre, and the personal model's outputs migrating
 * from the centroid to your cluster as it learns from your edits.
 */

type Lobe = { c: THREE.Vector3; ax: THREE.Vector3; q: THREE.Quaternion; w: number; tint: [number, number, number] };

const G = new THREE.Vector3(...GALAXY);
const Y = new THREE.Vector3(...YOU);
const YOU_OFF = Y.clone().sub(G);

/** The disc of the population is tilted toward the camera so it reads as a volume, not a smear. */
const DISC = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.42, -0.18, -0.1));

/**
 * Communities of style: lobes strung along two loose logarithmic arms (each stretched along its arm),
 * a central bulge, and the lobe your own style lives in. You are particular, not an outlier.
 */
function lobes(r: () => number): Lobe[] {
  const out: Lobe[] = [];
  const warm: [number, number, number] = [0.8, 0.73, 0.62], grey: [number, number, number] = [0.74, 0.71, 0.67], cool: [number, number, number] = [0.66, 0.69, 0.74];
  for (let arm = 0; arm < 2; arm++) {
    for (let k = 0; k < 7; k++) {
      const rad = 1.3 + k * 0.78 + r() * 0.3;
      const th = arm * Math.PI + 1.15 * Math.log(rad) * 2.2 + (r() - 0.5) * 0.25;
      const c = new THREE.Vector3(Math.cos(th) * rad * 1.3, (r() - 0.5) * 0.35, Math.sin(th) * rad).applyQuaternion(DISC);
      const tangent = th + Math.PI / 2 + 0.35;
      const q = DISC.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.2, -tangent, (r() - 0.5) * 0.2)));
      out.push({
        c,
        ax: new THREE.Vector3(0.75 + r() * 0.6, 0.18 + r() * 0.16, 0.32 + r() * 0.22),
        q,
        w: 0.55 + r() * 0.5 - k * 0.03,
        tint: k < 2 ? warm : k > 4 ? cool : grey,
      });
    }
  }
  out.push({
    c: YOU_OFF.clone().multiplyScalar(0.92),
    ax: new THREE.Vector3(0.9, 0.28, 0.6),
    q: DISC.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.6, 0))),
    w: 0.5,
    tint: grey,
  });
  out.push({ c: new THREE.Vector3(), ax: new THREE.Vector3(1.25, 0.55, 0.95), q: DISC.clone(), w: 1.6, tint: [0.84, 0.77, 0.66] });
  return out;
}

function populationGeometry(n: number) {
  const r = rng(101);
  const L = lobes(r);
  const total = L.reduce((s, l) => s + l.w, 0);
  const haze = Math.round(n * 0.025);
  const coreN = Math.round(n * 0.035), youN = Math.round(n * 0.035);
  const N = n + haze + coreN + youN;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), seed = new Float32Array(N);
  const v = new THREE.Vector3();
  let k = 0;
  const put = (p: THREE.Vector3, c: [number, number, number], b: number, s: number) => {
    pos[k * 3] = p.x + G.x; pos[k * 3 + 1] = p.y + G.y; pos[k * 3 + 2] = p.z + G.z;
    col[k * 3] = c[0] * b; col[k * 3 + 1] = c[1] * b; col[k * 3 + 2] = c[2] * b;
    size[k] = s; seed[k] = r(); k++;
  };
  const sample = (l: Lobe, spread = 1) =>
    v.set(gauss(r) * l.ax.x * spread, gauss(r) * l.ax.y * spread, gauss(r) * l.ax.z * spread).applyQuaternion(l.q).add(l.c);

  for (let i = 0; i < n; i++) {
    const roll = r();
    let tint: [number, number, number];
    if (roll < 0.03) {
      // knots: tight communities sitting on the arms
      const l = L[(Math.floor(r() * 60) * 7) % (L.length - 2)];
      const kn = Math.floor(r() * 3);
      v.set(gauss(r) * 0.15 + (kn - 1) * l.ax.x * 0.8, gauss(r) * 0.08, gauss(r) * 0.15).applyQuaternion(l.q).add(l.c);
      tint = l.tint;
    } else if (roll < 0.16) {
      // filaments: points strung along a bent path between two lobes
      const a = L[Math.floor(r() * L.length)], b = L[Math.floor(r() * L.length)];
      const t = r(), bend = Math.sin(Math.PI * t) * 0.9;
      v.copy(a.c).lerp(b.c, t).add(new THREE.Vector3(gauss(r) * 0.18, gauss(r) * 0.1 + bend * 0.2, gauss(r) * 0.18 + bend * 0.5));
      tint = a.tint;
    } else if (roll < 0.25) {
      v.set(gauss(r) * 5.4, gauss(r) * 0.9, gauss(r) * 4.0).applyQuaternion(DISC); // diffuse halo
      tint = [0.7, 0.68, 0.64];
    } else {
      let pick = r() * total, li = 0;
      while (pick > L[li].w && li < L.length - 1) pick -= L[li++].w;
      sample(L[li]);
      tint = L[li].tint;
    }
    // brightness: mostly faint, a long tail of brighter styles
    const b = 0.2 + 0.26 * Math.pow(r(), 2.2) + (r() < 0.012 ? 1.1 : 0);
    put(v, tint, b, 0.034 + r() * 0.03);
  }
  // haze: big, very faint sprites that give the cloud volume
  for (let i = 0; i < haze; i++) {
    const l = L[Math.floor(r() * L.length)];
    sample(l, 0.8);
    put(v, l.tint, 0.012 + r() * 0.012, 0.9 + r() * 1.4);
  }
  // the base model's outputs: a tight, bright, cool-white knot at the centroid
  for (let i = 0; i < coreN; i++) {
    v.set(gauss(r) * 0.2, gauss(r) * 0.12, gauss(r) * 0.17);
    put(v, [0.92, 0.93, 0.95], 0.55 + r() * 0.5, 0.04 + r() * 0.025);
  }
  // your style: your own writing, embedded; ember, looser than the base knot
  for (let i = 0; i < youN; i++) {
    v.set(gauss(r) * 0.42, gauss(r) * 0.22, gauss(r) * 0.34).add(YOU_OFF);
    put(v, [1, 0.42, 0.16], 0.4 + r() * 0.45, 0.04 + r() * 0.03);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  g.boundingSphere = new THREE.Sphere(G.clone(), 14);
  return g;
}

const popVert = /* glsl */ `
  attribute vec3 aColor; attribute float aSize; attribute float aSeed;
  uniform float uTime; uniform float uPx;
  varying vec3 vColor; varying float vFade;
  void main() {
    float s = aSeed * 6.2831;
    vec3 p = position + 0.035 * vec3(sin(uTime * 0.23 + s), sin(uTime * 0.19 + s * 1.7), cos(uTime * 0.21 + s * 2.3));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float size = aSize;
    ${spriteSize}
    vColor = aColor * (0.9 + 0.1 * sin(uTime * 1.1 + s * 5.0));
    gl_Position = projectionMatrix * mv;
  }
`;

/* ---------- the personal model's outputs ---------- */

/** Mean migration path: centroid → bowed control → your cluster. */
const CTRL = G.clone().lerp(Y, 0.5).add(new THREE.Vector3(0, 1.4, 0.6));
const ARC = new THREE.QuadraticBezierCurve3(G, CTRL, Y).getPoints(48);

const GHOSTS = 7;

function migrationGeometry(n: number) {
  const r = rng(303);
  const N = n * GHOSTS;
  const A = new Float32Array(N * 3), B = new Float32Array(N * 3), C = new Float32Array(N * 3);
  const delay = new Float32Array(N), dur = new Float32Array(N), lag = new Float32Array(N), seed = new Float32Array(N);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    a.set(gauss(r) * 0.2, gauss(r) * 0.12, gauss(r) * 0.17).add(G);
    c.set(gauss(r) * 0.34, gauss(r) * 0.18, gauss(r) * 0.28).add(Y);
    // a bowed path: up and toward the camera, with per-point scatter so the stream has width
    b.copy(CTRL).add(new THREE.Vector3(gauss(r) * 0.5, (r() - 0.5) * 0.9, gauss(r) * 0.5));
    const d0 = 0.6 + 3.6 * Math.pow(r(), 1.2), d1 = 2.2 + r() * 1.6, sd = r();
    for (let g = 0; g < GHOSTS; g++) {
      const k = i * GHOSTS + g;
      A.set([a.x, a.y, a.z], k * 3); B.set([b.x, b.y, b.z], k * 3); C.set([c.x, c.y, c.z], k * 3);
      delay[k] = d0; dur[k] = d1; lag[k] = g; seed[k] = sd;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(A, 3));
  g.setAttribute("aCtrl", new THREE.BufferAttribute(B, 3));
  g.setAttribute("aEnd", new THREE.BufferAttribute(C, 3));
  g.setAttribute("aDelay", new THREE.BufferAttribute(delay, 1));
  g.setAttribute("aDur", new THREE.BufferAttribute(dur, 1));
  g.setAttribute("aLag", new THREE.BufferAttribute(lag, 1));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  g.boundingSphere = new THREE.Sphere(G.clone().lerp(Y, 0.5), 10);
  return g;
}

const migVert = /* glsl */ `
  attribute vec3 aCtrl; attribute vec3 aEnd; attribute float aDelay; attribute float aDur; attribute float aLag; attribute float aSeed;
  uniform float uT; uniform float uTime; uniform float uPx;
  varying vec3 vColor; varying float vFade;
  float ease(float x) { return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0; }
  void main() {
    float p = clamp((uT - aLag * 0.05 - aDelay) / aDur, 0.0, 1.0);
    float k = ease(p);
    vec3 pos = mix(mix(position, aCtrl, k), mix(aCtrl, aEnd, k), k);
    float s = aSeed * 6.2831;
    pos += 0.045 * vec3(sin(uTime * 0.4 + s), sin(uTime * 0.33 + s * 1.3), cos(uTime * 0.37 + s * 2.1));
    float moving = 4.0 * p * (1.0 - p);
    float head = aLag < 0.5 ? 1.0 : (1.0 - aLag / ${GHOSTS}.0) * 0.55 * smoothstep(0.02, 0.3, moving);
    vec3 col = mix(vec3(0.93, 0.94, 0.97), vec3(1.0, 0.5, 0.22), smoothstep(0.1, 0.85, k));
    vColor = col * head * (0.85 + 0.9 * moving);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float size = aLag < 0.5 ? 0.075 : 0.05;
    ${spriteSize}
    gl_Position = projectionMatrix * mv;
  }
`;

/** Soft glows behind the two clusters so they hold the eye at a distance. */
function Glow({ at, color, size, opacity }: { at: THREE.Vector3; color: string; size: number; opacity: number }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <sprite position={at} scale={size}>
      <spriteMaterial map={tex} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

export default function StyleGalaxy({ index, quality }: { index: number; quality: Quality }) {
  const hi = quality === "high";
  const local = useLocalTime(index);
  const pop = useMemo(() => populationGeometry(hi ? 20000 : 8000), [hi]);
  const mig = useMemo(() => migrationGeometry(hi ? 300 : 150), [hi]);
  useEffect(() => () => { pop.dispose(); mig.dispose(); }, [pop, mig]);

  const popMat = useRef<THREE.ShaderMaterial>(null);
  const migMat = useRef<THREE.ShaderMaterial>(null);
  const uPop = useMemo(() => ({ uTime: { value: 0 }, uPx: { value: 800 } }), []);
  const uMig = useMemo(() => ({ uTime: { value: 0 }, uPx: { value: 800 }, uT: { value: 0 } }), []);

  useFrame((state) => {
    const px = pixelScale(state.size.height, state.viewport.dpr, (state.camera as THREE.PerspectiveCamera).fov);
    const time = state.clock.elapsedTime;
    const pm = popMat.current, mm = migMat.current;
    if (pm) { pm.uniforms.uTime.value = time; pm.uniforms.uPx.value = px; }
    if (mm) { mm.uniforms.uTime.value = time; mm.uniforms.uPx.value = px; mm.uniforms.uT.value = local(); }
  });

  return (
    <group>
      <points geometry={pop} frustumCulled={false}>
        <shaderMaterial ref={popMat} vertexShader={popVert} fragmentShader={spriteFrag} uniforms={uPop}
          transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>
      <points geometry={mig} frustumCulled={false}>
        <shaderMaterial ref={migMat} vertexShader={migVert} fragmentShader={spriteFrag} uniforms={uMig}
          transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>
      {/* the distance the readout tracks: from the average to you, as a faint measured arc */}
      <Line points={ARC} color="#ede6da" lineWidth={1} dashed dashSize={0.14} gapSize={0.12} transparent opacity={0.45} />
      <Glow at={G} color="#dfe4ff" size={2.6} opacity={0.22} />
      <Glow at={Y} color="#ff7a3a" size={3.2} opacity={0.26} />
    </group>
  );
}
