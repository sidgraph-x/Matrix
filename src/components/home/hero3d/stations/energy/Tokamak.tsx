"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { M } from "../../materials";
import type { Quality } from "../../types";
import { EM } from "./mats";
import { tileTexture } from "./textures";
import { Kit } from "./util";

/*
 * Tokamak (research), built at true relative proportions and scaled by the parent:
 * D-shaped vacuum vessel (R0 3.2, a 1.3, κ 1.7, δ 0.35) with a 90° cut-away, 18 toroidal-field coils
 * (steel case, copper winding pack), central solenoid in six modules, six poloidal-field rings,
 * equatorial and upper ports, cryostat base ring with gravity supports, and a turbulent plasma.
 */

const R0 = 3.2;
/** Cut-away centred toward the camera. */
export const CUT_CENTRE = 0.18;
const PHI_START = CUT_CENTRE + Math.PI / 4, PHI_LEN = Math.PI * 1.5;

function dProfile(R: number, a: number, k: number, d: number, n = 64) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= n; i++) {
    const th = -Math.PI / 2 + (i / n) * Math.PI * 2;
    pts.push(new THREE.Vector2(R + a * Math.cos(th + d * Math.sin(th)), k * a * Math.sin(th)));
  }
  return pts;
}
function shapeFrom(pts: THREE.Vector2[], hole?: THREE.Vector2[]) {
  const s = new THREE.Shape(pts);
  if (hole) s.holes.push(new THREE.Path([...hole].reverse()));
  return s;
}
function rectProfile(r: number, y: number, w: number, h: number) {
  return [
    new THREE.Vector2(r - w / 2, y - h / 2), new THREE.Vector2(r + w / 2, y - h / 2),
    new THREE.Vector2(r + w / 2, y + h / 2), new THREE.Vector2(r - w / 2, y + h / 2), new THREE.Vector2(r - w / 2, y - h / 2),
  ];
}
const inCut = (phi: number) => {
  const d = Math.atan2(Math.sin(phi - CUT_CENTRE), Math.cos(phi - CUT_CENTRE));
  return Math.abs(d) < Math.PI / 4 + 0.05;
};

const plasmaVert = /* glsl */ `
  varying vec3 vP; varying vec3 vN; varying vec3 vV;
  void main() {
    vP = position;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const plasmaFrag = /* glsl */ `
  uniform float uTime; uniform float uOn;
  varying vec3 vP; varying vec3 vN; varying vec3 vV;
  float h(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float n3(vec3 p) {
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * n3(p); p = p * 2.07 + 3.1; a *= 0.5; } return s; }
  void main() {
    float phi = atan(vP.x, vP.z);
    float r = length(vP.xz);
    // field-aligned turbulence: eddies stretched along the toroidal direction, drifting with time
    vec3 q = vec3(phi * 4.0 - uTime * 0.55, vP.y * 2.6, (r - ${R0.toFixed(1)}) * 2.6);
    float n = fbm(q + vec3(0.0, uTime * 0.12, uTime * 0.07));
    float fil = smoothstep(0.55, 0.9, fbm(q * vec3(1.0, 3.5, 3.5) + 7.0));
    float fres = 1.0 - abs(dot(normalize(vN), normalize(vV)));
    float edge = pow(fres, 1.4);
    vec3 core = vec3(0.95, 0.28, 0.58), hot = vec3(1.0, 0.52, 0.26);
    vec3 c = mix(core, hot, smoothstep(0.35, 0.75, n));
    float eddy = smoothstep(0.32, 0.78, n);
    float a = (0.1 + 1.15 * edge) * (0.2 + 1.5 * eddy) + 0.8 * fil * edge;
    gl_FragColor = vec4(c * a * 1.05 * uOn, 1.0);
  }
`;

export default function Tokamak({ local, quality }: { local: () => number; quality: Quality }) {
  const seg = quality === "high" ? 72 : 40;
  const built = useMemo(() => {
    const outer = dProfile(R0, 1.42, 1.7, 0.35);
    const inner = dProfile(R0, 1.28, 1.7, 0.35);
    const vesselOut = new THREE.LatheGeometry(outer, seg, PHI_START, PHI_LEN);
    const vesselIn = new THREE.LatheGeometry(inner, seg, PHI_START, PHI_LEN);
    // cut faces at both ends of the cut-away
    const ring = new THREE.ShapeGeometry(shapeFrom(outer.slice(0, -1), inner.slice(0, -1)), 1);
    const cut = new Kit();
    for (const phi of [PHI_START, PHI_START + PHI_LEN]) cut.add("c", ring, [0, 0, 0], [0, phi - Math.PI / 2, 0]);
    const cutGeo = cut.build().c;

    const plasma = new THREE.LatheGeometry(dProfile(R0 + 0.05, 1.02, 1.62, 0.33, 48), seg, 0, Math.PI * 2);

    // TF coils: steel case and a copper winding pack proud of both faces
    const caseShape = shapeFrom(dProfile(3.35, 1.84, 1.84, 0.45, 72).slice(0, -1), dProfile(3.35, 1.5, 1.86, 0.45, 72).slice(0, -1));
    const tfCase = new THREE.ExtrudeGeometry(caseShape, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 4 });
    tfCase.translate(0, 0, -0.15);
    const packShape = shapeFrom(dProfile(3.35, 1.74, 1.84, 0.45, 72).slice(0, -1), dProfile(3.35, 1.6, 1.85, 0.45, 72).slice(0, -1));
    const tfPack = new THREE.ExtrudeGeometry(packShape, { depth: 0.38, bevelEnabled: false, curveSegments: 4 });
    tfPack.translate(0, 0, -0.19);

    const kit = new Kit();
    // central solenoid: six modules with tie plates
    for (let i = 0; i < 6; i++) {
      kit.add("cs", new THREE.CylinderGeometry(1.22, 1.22, 0.98, 40), [0, -2.95 + i * 1.18, 0]);
      kit.add("csEnd", new THREE.CylinderGeometry(1.25, 1.25, 0.06, 40), [0, -2.95 + i * 1.18 + 0.52, 0]);
    }
    kit.add("csEnd", new THREE.CylinderGeometry(1.32, 1.32, 0.14, 40), [0, -3.55, 0]);
    kit.add("csEnd", new THREE.CylinderGeometry(1.32, 1.32, 0.14, 40), [0, 3.55, 0]);
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2;
      kit.box("steel", [0.1, 7.1, 0.05], [Math.sin(a) * 1.25, 0, Math.cos(a) * 1.25], [0, a, 0]);
    }
    // poloidal field rings
    const pf: [number, number, number, number][] = [[5.6, 1.35, 0.32, 0.38], [5.6, -1.35, 0.32, 0.38], [4.75, 2.95, 0.28, 0.3], [4.75, -2.95, 0.28, 0.3], [2.6, 3.8, 0.34, 0.24], [2.6, -3.8, 0.34, 0.24]];
    pf.forEach(([r, y, w, h]) => kit.add("pf", new THREE.LatheGeometry(rectProfile(r, y, w, h), seg, 0, Math.PI * 2)));
    // PF clamps on each TF coil
    for (let k = 0; k < 18; k++) {
      const phi = (k / 18) * Math.PI * 2;
      for (const [r, y] of [[5.6, 1.35], [5.6, -1.35]]) kit.box("steel", [0.5, 0.5, 0.12], [Math.sin(phi) * (r - 0.1), y, Math.cos(phi) * (r - 0.1)], [0, phi, 0]);
      // gravity support under each coil
      kit.box("support", [0.34, 0.5, 0.42], [Math.sin(phi) * 4.3, -3.55, Math.cos(phi) * 4.3], [0, phi, 0]);
    }
    // equatorial and upper ports between coils, skipping the cut quadrant
    for (let k = 0; k < 9; k++) {
      const phi = ((k + 0.5) / 9) * Math.PI * 2;
      if (inCut(phi)) continue;
      const c = (r: number) => [Math.sin(phi) * r, 0, Math.cos(phi) * r] as [number, number, number];
      const [x1, , z1] = c(5.2);
      kit.box("port", [0.62, 0.95, 1.5], [x1, 0, z1], [0, phi, 0]);
      const [x2, , z2] = c(5.98);
      kit.box("steel", [0.82, 1.15, 0.08], [x2, 0, z2], [0, phi, 0]);
      for (let b = 0; b < 8; b++) {
        const aa = (b / 8) * Math.PI * 2;
        const lx = Math.cos(aa) * 0.33, ly = Math.sin(aa) * 0.47;
        kit.cyl("zinc", 0.025, 0.06, [x2 + Math.cos(phi) * lx, ly, z2 - Math.sin(phi) * lx], [Math.PI / 2, phi, 0], 6);
      }
      const [x3, , z3] = c(3.7);
      kit.cyl("port", 0.27, 1.7, [x3, 3.2, z3], [0, 0, 0], 20);
      kit.cyl("steel", 0.36, 0.07, [x3, 4.06, z3], [0, 0, 0], 20);
    }
    // cryostat base ring, skirt and floor
    kit.add("support", new THREE.LatheGeometry(rectProfile(5.6, -3.92, 1.4, 0.3), seg, 0, Math.PI * 2));
    kit.add("support", new THREE.LatheGeometry(rectProfile(6.35, -3.66, 0.12, 0.26), seg, 0, Math.PI * 2));
    kit.add("concrete", new THREE.CylinderGeometry(3.2, 3.5, 2.1, 40, 1, true), [0, -5.1, 0]);
    kit.add("concrete", new THREE.CylinderGeometry(6.5, 6.5, 0.3, 64), [0, -6.15, 0]);
    const parts = kit.build();
    return { vesselOut, vesselIn, cutGeo, plasma, tfCase, tfPack, parts };
  }, [seg]);

  const tiles = useMemo(() => { const t = tileTexture(); t.repeat.set(10, 3); return t; }, []);
  const mats = useMemo(() => ({
    vessel: new THREE.MeshPhysicalMaterial({ color: "#a4a7a9", metalness: 0.95, roughness: 0.3, clearcoat: 0.2, side: THREE.DoubleSide }),
    wall: new THREE.MeshStandardMaterial({ map: tiles, color: "#ffffff", metalness: 0.6, roughness: 0.5, emissive: "#ff5f7a", emissiveMap: tiles, emissiveIntensity: 0.1, side: THREE.DoubleSide }),
    cut: new THREE.MeshStandardMaterial({ color: "#7d7f80", metalness: 0.9, roughness: 0.35, side: THREE.DoubleSide }),
    pf: new THREE.MeshPhysicalMaterial({ color: "#4b4239", metalness: 0.2, roughness: 0.55, clearcoat: 0.5 }),
    cs: new THREE.MeshPhysicalMaterial({ color: "#a86b44", metalness: 0.9, roughness: 0.35 }),
    port: new THREE.MeshStandardMaterial({ color: "#8f9294", metalness: 0.9, roughness: 0.4 }),
    support: new THREE.MeshStandardMaterial({ color: "#5c5a56", metalness: 0.7, roughness: 0.5 }),
    plasma: new THREE.ShaderMaterial({
      vertexShader: plasmaVert, fragmentShader: plasmaFrag,
      uniforms: { uTime: { value: 0 }, uOn: { value: 0.55 } },
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    }),
  }), [tiles]);
  useEffect(() => () => {
    tiles.dispose(); Object.values(mats).forEach((m) => m.dispose());
    [built.vesselOut, built.vesselIn, built.cutGeo, built.plasma, built.tfCase, built.tfPack].forEach((g) => g.dispose());
    Object.values(built.parts).forEach((g) => g.dispose());
  }, [tiles, mats, built]);

  const caseRef = useRef<THREE.InstancedMesh>(null), packRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    for (let k = 0; k < 18; k++) {
      m.makeRotationY((k / 18) * Math.PI * 2 - Math.PI / 2);
      caseRef.current?.setMatrixAt(k, m);
      packRef.current?.setMatrixAt(k, m);
    }
    [caseRef, packRef].forEach((r) => { if (r.current) r.current.instanceMatrix.needsUpdate = true; });
  }, [built]);

  const plasmaRef = useRef<THREE.ShaderMaterial>(null);
  const idle = useRef(0);
  useFrame((_, dt) => {
    const t = local();
    const pm = plasmaRef.current;
    if (!pm) return;
    idle.current += Math.min(dt, 0.05) * (t > 0 ? 1 : 0.25);
    pm.uniforms.uTime.value = t > 0 ? t : idle.current;
    pm.uniforms.uOn.value = t > 0 ? 0.55 + 0.45 * Math.min(1, t / 1.5) : 0.55;
  });

  const kitMat: Record<string, THREE.Material> = {
    cs: mats.cs, csEnd: EM.stainless, steel: EM.stainless, pf: mats.pf, support: mats.support, port: mats.port, zinc: EM.zinc, concrete: EM.concrete,
  };
  return (
    <group>
      <mesh geometry={built.vesselOut} material={mats.vessel} />
      <mesh geometry={built.vesselIn} material={mats.wall} />
      <mesh geometry={built.cutGeo} material={mats.cut} />
      <instancedMesh ref={caseRef} args={[built.tfCase, EM.stainless, 18]} frustumCulled={false} />
      <instancedMesh ref={packRef} args={[built.tfPack, M.copper, 18]} frustumCulled={false} />
      {Object.entries(built.parts).map(([k, g]) => <mesh key={k} geometry={g} material={kitMat[k]} />)}
      <mesh geometry={built.plasma} renderOrder={2}>
        <primitive object={mats.plasma} ref={plasmaRef} attach="material" />
      </mesh>
    </group>
  );
}
