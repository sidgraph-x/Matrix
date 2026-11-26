"use client";

import { useLocalTime } from "../../clock";
import type { CalloutDef, Shot, StationDef, StationProps, Vec3 } from "../../types";
import Geothermal from "./Geothermal";
import Storage, { SKID, TRAY_Y } from "./Storage";
import TandemPV from "./TandemPV";
import TerrainBlock from "./TerrainBlock";
import Tokamak from "./Tokamak";

/*
 * Station 1, Energy. A cut-away terrain block: tandem PV trackers and an exploded tandem cell on top,
 * an EGS doublet on the front section face, a battery yard with a SiC inverter skid, and a research
 * tokamak on the horizon behind.
 */

export const TOKAMAK = { pos: [2.8, 3.0, -12.6] as [number, number, number], scale: 0.7 };

function EnergyStation({ index, quality }: StationProps) {
  const local = useLocalTime(index);
  return (
    <group>
      <TerrainBlock quality={quality} />
      <TandemPV local={local} quality={quality} />
      <Geothermal local={local} quality={quality} />
      <Storage local={local} quality={quality} />
      <group position={TOKAMAK.pos} scale={TOKAMAK.scale}>
        <Tokamak local={local} quality={quality} />
      </group>
    </group>
  );
}

const WIDE = { pos: [14.2, 10.1, 38.3] as [number, number, number], target: [4.2, -2.4, -2.0] as [number, number, number], fov: 40 };
const STACK = { pos: [0.6, 7.0, 8.6] as [number, number, number], target: [-5.2, 4.35, -0.6] as [number, number, number] };
const FACE = { pos: [0.8, 0.4, 25.5] as [number, number, number], target: [-1.5, -3.2, 4.5] as [number, number, number] };

/* phones: the wide shot is recentred on the block and brought closer */
const WIDE_NARROW = { pos: [7, 9, 22] as [number, number, number], target: [-0.8, 0.6, -2.5] as [number, number, number] };

const SHOTS: Shot[] = [
  { ...WIDE, at: 0, narrow: WIDE_NARROW },
  { ...WIDE, at: 1.3, narrow: WIDE_NARROW },
  { ...STACK, at: 3.2 },
  { ...STACK, at: 4.6 },
  { ...FACE, at: 6.2 },
];

const CALLOUTS: CalloutDef[] = [
  { anchor: [-7.35, 5.1, -0.95], text: "tandem cell · perovskite on silicon · >34% lab", offset: [-1.6, 1.9, 0], to: 6.0 },
  { anchor: [-5.6, -5.95, 7.1], text: "egs doublet · ~3.5 km · >200 °C", offset: [0.2, -1.0, 1.0], from: 5.4 },
  { anchor: [SKID.x - 0.55, 1.62, SKID.z + 0.3], text: "sic power stage · dc bus", offset: [0.6, -1.9, 2.4], to: 3.0 },
  { anchor: [2.8, 5.85, -12.6], text: "tokamak · research", offset: [-2.4, 1.3, 0], to: 3.0 },
];

const THREAD: Vec3[] = [
  [-16, 10, -4.2],
  [-10.5, 8.2, -3.6],
  [-6.2, 5.6, -3.3],
  [-2.6, 2.3, -1.4],
  [0.9, 1.5, 0.9],
  [3.6, 1.9, 3.3],
  [5.9, TRAY_Y + 0.16, SKID.z],
  [9.2, TRAY_Y + 0.16, SKID.z],
  [12.2, TRAY_Y + 0.16, SKID.z],
  [16, 1.6, 3.4],
];

export const station: StationDef = {
  id: "energy",
  Component: EnergyStation,
  shots: SHOTS,
  callouts: CALLOUTS,
  thread: THREAD,
};
