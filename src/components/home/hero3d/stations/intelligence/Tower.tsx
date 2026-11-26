"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Quality } from "../../types";
import Adapter from "./Adapter";
import LayerPlate from "./LayerPlate";
import { ADAPTER_LAYERS, FLOOR, GAP, LAYERS, PLATE, PLATE_T, PLINTH_TOP, ROD, layerY } from "./layout";
import Plinth from "./Plinth";

const HALF = PLATE / 2;
const TOP = layerY(LAYERS - 1);
const CORNERS: [number, number][] = [[-ROD, -ROD], [ROD, -ROD], [ROD, ROD], [-ROD, ROD]];

/** Square outline of each plate's top and bottom faces, merged into one line set. */
function rimGeometry(layers: number[], inset = 0) {
  const pts: number[] = [];
  const h = HALF - inset;
  const sq = (y: number) => {
    const c = [[-h, -h], [h, -h], [h, h], [-h, h]];
    for (let k = 0; k < 4; k++) {
      const a = c[k], b = c[(k + 1) % 4];
      pts.push(a[0], y, a[1], b[0], y, b[1]);
    }
  };
  layers.forEach((i) => sq(layerY(i) + PLATE_T / 2));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

/** A soft contact shadow and a faint pool of light on the floor, as a radial alpha texture. */
function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grd.addColorStop(0, "rgba(0,0,0,0.85)");
  grd.addColorStop(0.45, "rgba(0,0,0,0.55)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

export default function Tower({ quality, index }: { quality: Quality; index: number }) {
  const high = quality === "high";

  const glass = useMemo(() => {
    const geo = new RoundedBoxGeometry(PLATE, PLATE_T, PLATE, 2, 0.025);
    const mat = high
      ? new THREE.MeshPhysicalMaterial({
          color: "#e9f0f0", metalness: 0, roughness: 0.12, transmission: 1, thickness: 0.35, ior: 1.52,
          attenuationColor: new THREE.Color("#b9d3d0"), attenuationDistance: 3.5, specularIntensity: 1, clearcoat: 0.6, clearcoatRoughness: 0.05,
          // no depth write, so the weight film inside each plate shows through its top face
          depthWrite: false,
        })
      : new THREE.MeshPhysicalMaterial({ color: "#a9bcbc", metalness: 0.1, roughness: 0.08, transparent: true, opacity: 0.16, depthWrite: false, clearcoat: 0.6 });
    return { geo, mat };
  }, [high]);
  useEffect(() => () => { glass.geo.dispose(); glass.mat.dispose(); }, [glass]);

  const parts = useMemo(() => {
    const frozen = Array.from({ length: LAYERS }, (_, i) => i).filter((i) => !ADAPTER_LAYERS.includes(i));
    return {
      rim: rimGeometry(frozen),
      rimLit: rimGeometry(ADAPTER_LAYERS),
      rimMat: new THREE.LineBasicMaterial({ color: "#dbe7e6", transparent: true, opacity: 0.34, depthWrite: false }),
      rimLitMat: new THREE.LineBasicMaterial({ color: "#ffb38a", transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false }),
      rod: new THREE.CylinderGeometry(0.042, 0.042, TOP - PLINTH_TOP + 0.36, 16),
      rodMat: new THREE.MeshPhysicalMaterial({ color: "#d4d0c8", metalness: 1, roughness: 0.12 }),
      spacer: new THREE.CylinderGeometry(0.078, 0.078, GAP - PLATE_T - 0.01, 20),
      spacerMat: new THREE.MeshPhysicalMaterial({ color: "#a6a29a", metalness: 1, roughness: 0.28 }),
      nut: new THREE.CylinderGeometry(0.15, 0.15, 0.12, 6),
      shadow: shadowTexture(),
    };
  }, []);
  useEffect(() => () => {
    [parts.rim, parts.rimLit, parts.rod, parts.spacer, parts.nut].forEach((g) => g.dispose());
    [parts.rimMat, parts.rimLitMat, parts.rodMat, parts.spacerMat].forEach((m) => m.dispose());
    parts.shadow.dispose();
  }, [parts]);

  const plates = useRef<THREE.InstancedMesh>(null);
  const spacers = useRef<THREE.InstancedMesh>(null);
  const nuts = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    for (let i = 0; i < LAYERS; i++) plates.current?.setMatrixAt(i, m.makeTranslation(0, layerY(i), 0));
    // spacer collars between plates, and one under the first plate down to the plinth
    let k = 0;
    for (let i = 0; i < LAYERS; i++) {
      const y = i === 0 ? (PLINTH_TOP + layerY(0) - PLATE_T / 2) / 2 : layerY(i) - GAP / 2;
      const sy = i === 0 ? (layerY(0) - PLATE_T / 2 - PLINTH_TOP) / (GAP - PLATE_T - 0.01) : 1;
      for (const [x, z] of CORNERS) spacers.current?.setMatrixAt(k++, m.makeScale(1, sy, 1).setPosition(x, y, z));
    }
    CORNERS.forEach(([x, z], c) => nuts.current?.setMatrixAt(c, m.makeTranslation(x, TOP + PLATE_T / 2 + 0.06, z)));
    [plates, spacers, nuts].forEach((r) => { if (r.current) { r.current.instanceMatrix.needsUpdate = true; r.current.computeBoundingSphere(); } });
  }, [glass]);

  const rodY = (TOP + PLINTH_TOP + 0.36) / 2;

  return (
    <group>
      <Plinth quality={quality} />
      <mesh position={[0, FLOOR + 0.002, 0]} rotation-x={-Math.PI / 2} renderOrder={1}>
        <planeGeometry args={[22, 22]} />
        <meshBasicMaterial map={parts.shadow} transparent depthWrite={false} />
      </mesh>

      {CORNERS.map(([x, z], c) => (
        <mesh key={c} geometry={parts.rod} material={parts.rodMat} position={[x, rodY, z]} />
      ))}
      <instancedMesh ref={spacers} args={[parts.spacer, parts.spacerMat, LAYERS * 4]} />
      <instancedMesh ref={nuts} args={[parts.nut, parts.rodMat, 4]} />

      <instancedMesh ref={plates} args={[glass.geo, glass.mat, LAYERS]} renderOrder={1} />
      <lineSegments geometry={parts.rim} material={parts.rimMat} />
      <lineSegments geometry={parts.rimLit} material={parts.rimLitMat} />

      {Array.from({ length: LAYERS }, (_, i) => (
        <LayerPlate key={i} layer={i} />
      ))}
      {ADAPTER_LAYERS.map((l, k) => (
        <Adapter key={l} layer={l} order={ADAPTER_LAYERS.length - 1 - k} index={index} />
      ))}
    </group>
  );
}
