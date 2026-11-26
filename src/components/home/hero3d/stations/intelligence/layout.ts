/* Shared dimensions for the intelligence station (station-local units). */

export const LAYERS = 24;
/** Glass plate footprint (x and z) and thickness. */
export const PLATE = 7;
export const PLATE_T = 0.08;
/** Centre-to-centre spacing of plates. */
export const GAP = 0.32;
/** Centre of layer 0. */
export const Y0 = -2.85;
/** The weight heatmap's side; one matrix cell is HM / 128. */
export const HM = 6.4;
/** Plinth top surface, where the stack rods seat. */
export const PLINTH_TOP = -3.2;
export const FLOOR = -4.72;
/** Corner rods, inset from the plate edge. */
export const ROD = 3.34;
/** Layers that carry the personal adapter. */
export const ADAPTER_LAYERS = [4, 8, 12, 16, 20, 23];
/** Width of a rank-16 factor strip at the heatmap's cell size. */
export const STRIP = (HM / 128) * 16;
/** Gap between a plate edge and its adapter strip. */
export const STRIP_GAP = 0.12;

export const layerY = (i: number) => Y0 + i * GAP;
/** The tower's yaw inside the station, so both adapter edges (+x and +z) face the camera. */
export const TOWER_YAW = -0.42;
