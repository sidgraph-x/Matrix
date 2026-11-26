"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { M } from "../../materials";
import type { Quality } from "../../types";
import { PLANES, R, SUN_TILT, linkPairs, perPlane, ringPoint, satPos } from "./geo";
import { arrayTexture, busTexture, mliBump, satGeometries, wingTexture } from "./satParts";

/** Satellite size in scene units (bus length). Exaggerated, as every constellation visual must be. */
export const SAT_SCALE = 0.085;

const _p = new THREE.Vector3(), _v = new THREE.Vector3(), _up = new THREE.Vector3(), _z = new THREE.Vector3();
const _m = new THREE.Matrix4(), _w = new THREE.Matrix4(), _rz = new THREE.Matrix4(), _cam = new THREE.Vector3(), _sl = new THREE.Vector3();
const _c = new THREE.Color();

export default function Constellation({ quality, time }: { quality: Quality; time: () => number }) {
  const hi = quality === "high";
  const S = perPlane(!hi);
  const N = PLANES * S;
  const root = useRef<THREE.Group>(null);
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([]);
  const wings = useRef<(THREE.InstancedMesh | null)[]>([]);

  const parts = useMemo(() => satGeometries(), []);
  const mats = useMemo(() => {
    const wingMap = wingTexture(hi ? 1024 : 512);
    return {
      bus: new THREE.MeshPhysicalMaterial({ color: "#ffffff", map: busTexture(256), metalness: 0.75, roughness: 0.3, clearcoat: 0.4 }),
      mli: new THREE.MeshPhysicalMaterial({ color: "#c79a4e", metalness: 1, roughness: 0.38, bumpMap: mliBump(256), bumpScale: 1.5 }),
      arrays: new THREE.MeshStandardMaterial({ color: "#ffffff", map: arrayTexture(256), metalness: 0.05, roughness: 0.7 }),
      terminals: M.aluminium,
      lenses: new THREE.MeshPhysicalMaterial({ color: "#0a0d12", metalness: 0.2, roughness: 0.05, clearcoat: 1, iridescence: 0.5 }),
      booms: M.nickel,
      wingBody: new THREE.MeshStandardMaterial({ color: "#d9d7d2", metalness: 0.4, roughness: 0.5 }),
      wingCells: new THREE.MeshPhysicalMaterial({ color: "#ffffff", map: wingMap, metalness: 0.3, roughness: 0.22, clearcoat: 0.8, clearcoatRoughness: 0.08 }),
    };
  }, [hi]);

  const body = ["bus", "mli", "arrays", "terminals", "lenses", "booms"] as const;
  const wingKeys = ["wingBody", "wingCells"] as const;

  const pairs = useMemo(() => linkPairs(S), [S]);
  const links = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pairs.length * 6), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(pairs.length * 6), 3).setUsage(THREE.DynamicDrawUsage));
    return g;
  }, [pairs]);
  const rings = useMemo(() => {
    const seg = 160, pts = new Float32Array(PLANES * seg * 6), v = new THREE.Vector3();
    let o = 0;
    for (let k = 0; k < PLANES; k++)
      for (let i = 0; i < seg; i++) {
        for (const u of [i, i + 1]) { ringPoint(k, (u / seg) * Math.PI * 2, v); pts[o++] = v.x; pts[o++] = v.y; pts[o++] = v.z; }
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    return g;
  }, []);
  const posRef = useRef<Float32Array>(new Float32Array(0));
  const linkRef = useRef<THREE.LineSegments>(null);

  useFrame(({ camera }) => {
    const t = time();
    const ls = linkRef.current;
    if (!root.current || !ls) return;
    if (posRef.current.length !== N * 3) posRef.current = new Float32Array(N * 3);
    const pos = posRef.current;
    root.current.worldToLocal(_cam.copy(camera.position));
    for (let k = 0; k < PLANES; k++)
      for (let j = 0; j < S; j++) {
        const i = k * S + j;
        satPos(k, j, S, t, _p, _v);
        pos[i * 3] = _p.x; pos[i * 3 + 1] = _p.y; pos[i * 3 + 2] = _p.z;
        _up.copy(_p).normalize();
        _z.crossVectors(_v, _up);
        // shrink anything that would graze the lens
        const d = _p.distanceTo(_cam);
        const s = SAT_SCALE * THREE.MathUtils.smoothstep(d, 0.5, 1.4);
        _m.makeBasis(_v, _up, _z).scale(_sl.set(s, s, s)).setPosition(_p);
        // wings rotate about the boom (local z) to face the sun
        _sl.copy(SUN_TILT).applyMatrix4(_w.copy(_m).setPosition(0, 0, 0).invert());
        _rz.makeRotationZ(Math.atan2(-_sl.x, _sl.y));
        _w.multiplyMatrices(_m, _rz);
        // Earth's shadow: behind the planet, inside its cylinder
        const along = _p.dot(SUN_TILT);
        const lit = along > 0 || _p.lengthSq() - along * along > R * R ? 1 : 0.07;
        _c.setScalar(lit);
        for (const mesh of meshes.current) if (mesh) { mesh.setMatrixAt(i, _m); mesh.setColorAt(i, _c); }
        for (const mesh of wings.current) if (mesh) { mesh.setMatrixAt(i, _w); mesh.setColorAt(i, _c); }
      }
    for (const mesh of [...meshes.current, ...wings.current]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    // laser links: faint, fading with distance from the camera
    const lg = ls.geometry;
    const P = lg.attributes.position.array as Float32Array, C = lg.attributes.color.array as Float32Array;
    pairs.forEach(([a, b], n) => {
      for (let e = 0; e < 2; e++) {
        const s = e ? b : a, o = n * 6 + e * 3;
        P[o] = pos[s * 3]; P[o + 1] = pos[s * 3 + 1]; P[o + 2] = pos[s * 3 + 2];
        const dx = P[o] - _cam.x, dy = P[o + 1] - _cam.y, dz = P[o + 2] - _cam.z;
        const f = (hi ? 0.5 : 0.28) / (1 + (dx * dx + dy * dy + dz * dz) / 220);
        C[o] = 0.42 * f; C[o + 1] = 0.6 * f; C[o + 2] = 0.85 * f;
      }
    });
    lg.attributes.position.needsUpdate = true;
    lg.attributes.color.needsUpdate = true;
  });

  return (
    <group ref={root}>
      {body.map((k, n) => (
        <instancedMesh key={k} ref={(r) => { meshes.current[n] = r; }} args={[parts[k], mats[k], N]} frustumCulled={false} />
      ))}
      {wingKeys.map((k, n) => (
        <instancedMesh key={k} ref={(r) => { wings.current[n] = r; }} args={[parts[k], mats[k], N]} frustumCulled={false} />
      ))}
      <lineSegments ref={linkRef} geometry={links} frustumCulled={false}>
        <lineBasicMaterial vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </lineSegments>
      <lineSegments geometry={rings}>
        <lineBasicMaterial color="#8fa6c8" transparent opacity={0.07} depthWrite={false} />
      </lineSegments>
    </group>
  );
}
