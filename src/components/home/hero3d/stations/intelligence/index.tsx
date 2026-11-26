"use client";

import type { CalloutDef, Shot, StationDef, StationProps, Vec3 } from "../../types";
import { ADAPTER_LAYERS, HM, PLATE, STRIP, STRIP_GAP, TOWER_YAW, layerY } from "./layout";
import MemoryRibbon, { helix } from "./MemoryRibbon";
import Tower from "./Tower";
import * as THREE from "three";

/*
 * Chapter 4. One frontier model, eight billion adapters: a frozen 24-layer base model as a stack of
 * glass plates carrying their weight matrices, a rank-16 LoRA adapter (B along one edge, A along the
 * other, ΔW = B·A lit across the plate) on six layers, and a ribbon of memory records winding in.
 */
function IntelligenceStation({ index, quality }: StationProps) {
  return (
    <group>
      <group rotation-y={TOWER_YAW}>
        <Tower quality={quality} index={index} />
      </group>
      <MemoryRibbon index={index} quality={quality} />
    </group>
  );
}

const H = PLATE / 2;
const bEdge = H + STRIP_GAP + STRIP / 2;
const top = ADAPTER_LAYERS[ADAPTER_LAYERS.length - 1];
const mem = helix(0.86, new THREE.Vector3());
/** Tower-local point to station-local (the tower is yawed so its B edge, +x, turns toward the camera). */
const tw = (x: number, y: number, z: number): Vec3 => {
  const c = Math.cos(TOWER_YAW), s = Math.sin(TOWER_YAW);
  return [+(x * c + z * s).toFixed(3), y, +(-x * s + z * c).toFixed(3)];
};

/*
 * Phones: CameraRig widens the vertical fov below 2.4:1 so the horizontal framing holds, which leaves the
 * tower small and off to the left. Phones get centred, closer framings and short labels instead.
 */
const NARROW = typeof window !== "undefined" && window.innerWidth < 760;

const SHOTS: Shot[] = NARROW
  ? [
      { pos: [2, 4.2, 13.6], target: [0.3, 0.4, 0], at: 0 },
      { pos: tw(4.7, 12.8, 11), target: tw(0.3, 2.8, 0.5), at: 3.4 },
      { pos: [-2.5, 3.2, 13.8], target: [0, 0.6, 0], at: 6.4 },
    ]
  : [
      // the whole tower, nearly frontal and a little above, set left of centre
      { pos: [8, 7.2, 27], target: [4.6, 0.3, 0], at: 0 },
      // rise over the adapter layers: the top plate's ΔW, B along its right edge, A along its front
      { pos: tw(9.5, 19.5, 15.5), target: tw(2.6, 2.6, 1.2), at: 3.4, fov: 32 },
      // swing to the front left to show the memory ribbon winding in
      { pos: [-6, 5, 25], target: [3, 0.8, 0], at: 6.4 },
    ];

/* Stage shows only the first two callouts on phones. */
const CALLOUTS: CalloutDef[] = NARROW
  ? [
      { anchor: tw(-H, layerY(22), H), text: "base model · frozen · shared", offset: [0.5, 1.1, 0], from: 1.0 },
      { anchor: tw(bEdge, layerY(8), 0), text: "your adapter · rank 16", offset: [-0.2, -5.3, 0], from: 2.8 },
    ]
  : [
      { anchor: tw(-H, layerY(21), H - 0.4), text: "base model · frozen · shared", offset: [-2.4, 1.6, 0], from: 1.0 },
      { anchor: tw(bEdge, layerY(16), 1.2), text: "your adapter · rank 16 · 0.8% of weights", offset: [2.6, 0.6, 0], from: 2.8 },
      { anchor: tw(1.2, layerY(top) + 0.01, HM / 2 - 1.4), text: "ΔW = B·A", offset: [3.4, 2.6, 0], from: 3.8 },
      { anchor: [mem.x, mem.y, mem.z], text: "memory · stays on your node", offset: [-1.6, -1.8, 0], from: 5.6 },
    ];

export const station: StationDef = {
  id: "intelligence",
  Component: IntelligenceStation,
  shots: SHOTS,
  callouts: CALLOUTS,
  // in from the left, one coil round the plinth (rising and tightening so it never crosses itself), out to the right
  thread: [
    [-16, -1, 0],
    [-10.5, -2.6, 3.2],
    ...coil(),
    [9.5, -2.2, 4.8],
    [16, -1, 0],
  ],
};

function coil(): [number, number, number][] {
  const pts: [number, number, number][] = [];
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const th = Math.PI * 0.8 - u * Math.PI * 2.25;
    const r = 7.7 - 1.4 * u;
    pts.push([+(r * Math.cos(th)).toFixed(2), +(-3.95 + 1.2 * u).toFixed(2), +(r * Math.sin(th)).toFixed(2)]);
  }
  return pts;
}
