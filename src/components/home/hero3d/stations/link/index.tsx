"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useLocalTime } from "../../clock";
import type { StationDef, StationProps, Vec3 } from "../../types";
import Constellation from "./Constellation";
import { Atmosphere, EarthSurface } from "./Earth";
import { CENTER, FIBER, NODES, PLANES, R, TILT, bodyToTilt, perPlane, planRoutes, satPos, spinAt, terminalPoint, tiltToLocal } from "./geo";
import GroundNodes from "./GroundNodes";
import Packets from "./Packets";

function LinkStation({ index, quality }: StationProps) {
  const local = useLocalTime(index);
  const spin = useRef<THREE.Group>(null);
  useFrame(() => { if (spin.current) spin.current.rotation.y = spinAt(local()); });
  return (
    <group position={CENTER.toArray()} quaternion={TILT}>
      <group ref={spin}>
        <EarthSurface quality={quality} time={local} />
        <GroundNodes quality={quality} time={local} />
      </group>
      <Constellation quality={quality} time={local} />
      <Packets quality={quality} time={local} />
      <Atmosphere quality={quality} />
    </group>
  );
}

/* ---- station-local anchors, from the same maths the scene uses ---- */
const v = new THREE.Vector3();
const toVec = (p: THREE.Vector3): Vec3 => [+p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3)];
const S = perPlane(false);
const plan = planRoutes(S);
const T_ANCHOR = 7;
const satLocal = (i: number) => toVec(tiltToLocal(satPos(Math.floor(i / S), i % S, S, T_ANCHOR, v), v));
const nodeLocal = (i: number) => toVec(tiltToLocal(bodyToTilt(terminalPoint(i, v), T_ANCHOR, v), v));
const fiberMid = (() => {
  const [a, b] = FIBER[0];
  const m = NODES[a].clone().add(NODES[b]).normalize().multiplyScalar(R + 0.03);
  return toVec(tiltToLocal(bodyToTilt(m, T_ANCHOR, v), v));
})();
/** A plain (unrouted) cross-plane laser link out on the left limb, where its label sits against space. Even slots exist at both quality levels. */
const linkMid = (() => {
  const want = new THREE.Vector3(-0.62, 0.76, 0.05).normalize(), a = new THREE.Vector3(), b = new THREE.Vector3();
  let best: Vec3 = [0, 0, 0], score = -2;
  for (let k = 0; k < PLANES - 1; k++) for (let j = 0; j < S; j += 2) {
    satPos(k, j, S, T_ANCHOR, a); satPos(k + 1, j, S, T_ANCHOR, b);
    const m = tiltToLocal(a.add(b).multiplyScalar(0.5), new THREE.Vector3());
    const d = m.clone().sub(CENTER).normalize().dot(want);
    if (d > score) { score = d; best = toVec(m); }
  }
  return best;
})();

const SHOTS: StationDef["shots"] = [
  { pos: [-2.2, -0.4, 8.0], target: [1.0, -3.4, -5], at: 0, fov: 36 },
  { pos: [-1.6, -0.2, 7.0], target: [0.9, -1.9, -6], at: 3.4, fov: 36 },
  { pos: [1.5, 4, 21], target: [2.5, -4.5, -2], at: 6.4, fov: 34 },
];

/**
 * The joule thread passes round the far side of the planet, just outside the atmosphere: from the wide
 * shot it skims the top of the limb, and from low orbit it drops behind the horizon like a real link.
 */
const thread: Vec3[] = [[-16, -1.2, 0.5], [-11, -3.4, -4], [-5.5, -4.3, -9], [0, -4.6, -11], [5.5, -4.3, -9], [11, -3.4, -4], [16, -1.2, 0.5]];

export const station: StationDef = {
  id: "link",
  Component: LinkStation,
  shots: SHOTS,
  // phones show only the first two
  callouts: [
    { anchor: satLocal(plan.agg), text: "leo shell · 550 km", offset: [1.0, 0.8, 0] },
    { anchor: fiberMid, text: "fiber · ~5 µs/km", offset: [0.3, -0.4, 0.3] },
    { anchor: nodeLocal(2), text: "only encrypted Δw leaves a node", offset: [0.5, -0.35, 0.3] },
    { anchor: linkMid, text: "laser inter-satellite link", offset: [-0.7, 0.5, 0], from: 2 },
  ],
  thread,
};
