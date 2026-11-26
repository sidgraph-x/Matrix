import type { ComponentType } from "react";

export type Vec3 = [number, number, number];

/** "high" on capable desktops, "low" on phones or when the frame rate drops. Stations scale instance counts with it. */
export type Quality = "high" | "low";

export type StationProps = {
  /** 0..4, position in the sequence. */
  index: number;
  /** True while this station's chapter is showing (including the fly-in). */
  active: boolean;
  quality: Quality;
};

/**
 * A camera keyframe in station-local coordinates. `at` is seconds into the chapter.
 * The rig eases between consecutive shots; the first shot is where the fly-in lands.
 */
export type Shot = {
  pos: Vec3; target: Vec3; at: number; fov?: number;
  /** Optional framing used instead on narrow plates (phones, aspect < 1.4). */
  narrow?: { pos?: Vec3; target?: Vec3; fov?: number };
};

/** A mono label pinned to a station-local point, shown between `from` and `to` seconds into the chapter. */
export type CalloutDef = { anchor: Vec3; text: string; offset?: Vec3; from?: number; to?: number };

export type StationDef = {
  id: "energy" | "compute" | "link" | "intelligence" | "taste";
  Component: ComponentType<StationProps>;
  /** At least one shot, sorted by `at`. */
  shots: Shot[];
  /** At most four. */
  callouts: CalloutDef[];
  /** Station-local waypoints the joule thread passes through, left to right. */
  thread: Vec3[];
};
