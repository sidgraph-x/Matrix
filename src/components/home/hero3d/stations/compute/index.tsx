"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useLocalTime } from "../../clock";
import type { StationDef, StationProps, Vec3 } from "../../types";
import ColdPlate from "./ColdPlate";
import Die from "./Die";
import HBM from "./HBM";
import { HBM_H, HBM_X, HBM_Z, LIFT, Y, explodeAt } from "./layout";
import { Interposer, Substrate } from "./Package";
import SystolicArray, { INSET } from "./SystolicArray";

/*
 * Chapter 2, compute: "Moving data costs more than the maths."
 * A 2.5D accelerator package in exploded view. Assembled for the first 1.5 s, it separates into
 * substrate, interposer, silicon (logic die + HBM) and cold plate by 3.5 s, then the camera dives to
 * a magnified MAC array on the die where operands stream between neighbours instead of out to DRAM.
 */
function ComputeStation({ index, quality }: StationProps) {
  const local = useLocalTime(index);
  const interposer = useRef<THREE.Group>(null);
  const silicon = useRef<THREE.Group>(null);
  const plate = useRef<THREE.Group>(null);

  useFrame(() => {
    const e = explodeAt(local());
    if (interposer.current) interposer.current.position.y = LIFT.interposer * e;
    if (silicon.current) silicon.current.position.y = LIFT.silicon * e;
    // the cold plate leads slightly, as if lifted off first
    if (plate.current) plate.current.position.y = Y.plateBottom + LIFT.plate * Math.min(1, e * 1.08);
  });

  // station-local studio lights: a soft key pool from front-left, a cool rim from behind. Spot cones keep them off the neighbours.
  const key = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.SpotLight>(null);
  const aim = useRef<THREE.Object3D>(null);
  useEffect(() => {
    if (aim.current) {
      if (key.current) key.current.target = aim.current;
      if (rim.current) rim.current.target = aim.current;
    }
  }, []);

  return (
    <group>
      <object3D ref={aim} position={[0, 2.4, 0]} />
      <spotLight ref={key} position={[-7, 17, 13]} angle={0.42} penumbra={0.9} intensity={900} decay={2} color="#fff2e2" />
      <spotLight ref={rim} position={[7, 8, -14]} angle={0.45} penumbra={1} intensity={520} decay={2} color="#a9c0ff" />
      <pointLight position={[9, 2.5, 8]} intensity={40} distance={22} decay={2} color="#ffd9b0" />
      <Substrate quality={quality} />
      <group ref={interposer}>
        <Interposer quality={quality} />
      </group>
      <group ref={silicon}>
        <Die quality={quality} />
        <HBM quality={quality} />
        <SystolicArray index={index} quality={quality} />
      </group>
      <group ref={plate} position={[0, Y.plateBottom, 0]}>
        <ColdPlate index={index} quality={quality} />
      </group>
    </group>
  );
}

// exploded heights, for camera targets and callout anchors
const DIE_TOP = Y.dieTop + LIFT.silicon;
const SILICON_MID = Y.dieBottom + LIFT.silicon + HBM_H * 0.55;
const PLATE_Y = Y.plateBottom + LIFT.plate;
const I: Vec3 = [INSET.x, INSET.y + LIFT.silicon, INSET.z];

export const station: StationDef = {
  id: "compute",
  Component: ComputeStation,
  shots: [
    // three-quarter view of the assembled package, package left of centre
    { pos: [7.4, 6.0, 12.2], target: [2.7, 1.25, 0], at: 0, fov: 34 },
    // the stack separates; the camera rises and pulls back to hold all four layers
    { pos: [9.0, 9.0, 16.8], target: [2.9, 2.6, 0], at: 3.5, fov: 34 },
    { pos: [8.5, 9.3, 17.2], target: [2.8, 2.7, 0], at: 5.0, fov: 34 },
    // dive under the lifted cold plate to the die surface and the magnified MAC array
    { pos: [I[0] + 3.6, I[1] + 1.9, I[2] + 5.4], target: [I[0] + 1.1, I[1] - 0.45, I[2] - 0.3], at: 6.6, fov: 32 },
    { pos: [I[0] + 3.35, I[1] + 1.75, I[2] + 5.0], target: [I[0] + 1.05, I[1] - 0.45, I[2] - 0.3], at: 9, fov: 32 },
  ],
  callouts: [
    // phones show the first two
    { anchor: [I[0] - 0.95, I[1] + 0.08, I[2] + 0.4], text: "on-chip sram · operands stay here", offset: [0.35, 0.95, 0.4], from: 6.3 },
    { anchor: [-HBM_X - 0.55, SILICON_MID, HBM_Z + 0.5], text: "hbm · 12-high stack", offset: [-1.3, 1.5, 0.6], from: 3.3, to: 5.9 },
    { anchor: [HBM_X + 0.3, SILICON_MID - 0.1, HBM_Z], text: "tsv · through-silicon vias", offset: [3.0, -0.2, 1.2], from: 3.5, to: 5.9 },
    { anchor: [-1.6, PLATE_Y + 0.5, 1.75], text: "cold plate · microchannels", offset: [-2.8, -0.22, -0.25], from: 3.7, to: 5.9 },
  ],
  thread: [
    // operands arrive at substrate level, climb into the die area behind the MAC array and leave behind the far HBM stack
    [-16, 0.3, 4.6],
    [-9.5, 0.35, 3.8],
    [-5.8, 1.2, 1.6],
    [-3.2, DIE_TOP + 0.45, -0.1],
    [0.2, DIE_TOP + 0.6, -0.55],
    [3.4, DIE_TOP + 0.2, -1.9],
    [6.8, 1.4, -2.2],
    [11, 0.4, 1.4],
    [16, 0.3, 4.6],
  ],
};
