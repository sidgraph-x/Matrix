import * as THREE from "three";

/*
 * Shared geometry of the Link station: Earth, its frame, the Walker constellation and the four Nodes.
 * Everything here is pure maths so index.tsx can place callouts with the same numbers the scene uses.
 *
 * Frames:
 *  - station-local: the station group (x = index * 40).
 *  - tilt frame: a group at CENTER rotated by TILT. Its +y is Earth's north pole. Orbits live here (inertial).
 *  - body frame: the tilt frame spun about +y by spinAt(t). Land, clouds, Nodes and fiber live here.
 */

const Y = new THREE.Vector3(0, 1, 0);

export const R = 12;
/** 550 km above a 6371 km Earth, at scale. */
export const SHELL = (R * 6921) / 6371;
export const CENTER = new THREE.Vector3(0, -14, -2);
/** Axis tilt so the camera looks at mid-northern latitudes rather than the pole. */
export const TILT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0, 0.3, "XYZ"));
export const TILT_INV = TILT.clone().invert();

/** Sun direction (towards the sun), station-local. Low on the left and slightly behind the limb. */
export const SUN = new THREE.Vector3(-0.78, 0.34, -0.52).normalize();
export const SUN_TILT = SUN.clone().applyQuaternion(TILT_INV);

export const PLANES = 12;
export const INC = THREE.MathUtils.degToRad(53);
/** Visual orbital rate in rad/s (a real 550 km orbit is ~0.0011 rad/s). */
export const OMEGA = 0.016;
/** Visual Earth spin in rad/s. */
export const SPIN = 0.0016;
/** Orbits stop at the end of the chapter so held stills and callout anchors stay put. */
export const orbitTime = (t: number) => Math.min(t, 9);
export const spinAt = (t: number) => -0.05 + SPIN * Math.min(t, 9);

export const perPlane = (low: boolean) => (low ? 10 : 20);

/** Walker delta 53°: 240/12/1 (low quality keeps every other slot). Position of satellite (plane k, slot j) in the tilt frame. */
export function satPos(k: number, j: number, S: number, t: number, out: THREE.Vector3, vel?: THREE.Vector3) {
  // phasing is fixed to the full 240-satellite shell, so the low-quality shell is its even-slot subset
  const T = PLANES * 20;
  const raan = (2 * Math.PI * k) / PLANES;
  const u = (2 * Math.PI * j) / S + (2 * Math.PI * k) / T + OMEGA * orbitTime(t) + 0.35;
  const cO = Math.cos(raan), sO = Math.sin(raan), cu = Math.cos(u), su = Math.sin(u), ci = Math.cos(INC), si = Math.sin(INC);
  // ECI (z north) -> tilt frame (y north): (X, Y, Z) -> (X, Z, -Y)
  out.set(SHELL * (cO * cu - sO * su * ci), SHELL * (su * si), -SHELL * (sO * cu + cO * su * ci));
  if (vel) vel.set(-cO * su - sO * cu * ci, cu * si, -(-sO * su + cO * cu * ci)).normalize();
  return out;
}

/** Points on plane k's orbit ring, tilt frame. */
export function ringPoint(k: number, u: number, out: THREE.Vector3) {
  const raan = (2 * Math.PI * k) / PLANES;
  const cO = Math.cos(raan), sO = Math.sin(raan), cu = Math.cos(u), su = Math.sin(u), ci = Math.cos(INC), si = Math.sin(INC);
  return out.set(SHELL * (cO * cu - sO * su * ci), SHELL * (su * si), -SHELL * (sO * cu + cO * su * ci));
}

/** Station-local direction from CENTER -> unit vector in the body frame at spin 0. */
const toBody = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).normalize().applyQuaternion(TILT_INV).applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.05);

/** Four Nodes, as unit vectors in the body frame. Chosen on the camera-facing limb, two by day and two by night. */
export const NODES: THREE.Vector3[] = [
  toBody(-0.241, 0.908, 0.342),
  toBody(-0.072, 0.936, 0.345),
  toBody(0.102, 0.935, 0.338),
  toBody(0.237, 0.895, 0.378),
];
/** Station-local direction (from CENTER) where updates are aggregated: high on the limb, beyond the Nodes. */
export const AGG_DIR = new THREE.Vector3(0.12, 0.97, 0.05).normalize();
/** Fiber runs between these Node pairs. */
export const FIBER: [number, number][] = [[0, 1], [2, 3]];

/** Body-frame unit vector -> tilt frame at time t. */
export function bodyToTilt(v: THREE.Vector3, t: number, out: THREE.Vector3) {
  return out.copy(v).applyAxisAngle(Y, spinAt(t));
}
/** Tilt-frame point -> station-local. */
export function tiltToLocal(v: THREE.Vector3, out: THREE.Vector3) {
  return out.copy(v).applyQuaternion(TILT).add(CENTER);
}

/** Node hardware size in scene units (container length). */
export const NODE_SCALE = 0.085;

/** Body-frame transform of Node i: on the surface, +y along the surface normal, with a seeded yaw. */
export function nodeMatrix(i: number, out: THREE.Matrix4) {
  const n = NODES[i];
  const q = new THREE.Quaternion().setFromUnitVectors(Y, n).multiply(new THREE.Quaternion().setFromAxisAngle(Y, 0.6 + i * 1.3));
  return out.compose(n.clone().multiplyScalar(R + 0.004), q, new THREE.Vector3(NODE_SCALE, NODE_SCALE, NODE_SCALE));
}
/** Body-frame position of Node i's terminal face, where packets leave and land. */
export function terminalPoint(i: number, out: THREE.Vector3) {
  const m = nodeMatrix(i, new THREE.Matrix4());
  return out.set(0.62, 0.42, 0).applyMatrix4(m);
}

/** Each satellite's in-plane and cross-plane laser partners: [a, b] index pairs. */
export function linkPairs(S: number) {
  const pairs: [number, number][] = [];
  for (let k = 0; k < PLANES; k++)
    for (let j = 0; j < S; j++) {
      pairs.push([k * S + j, k * S + ((j + 1) % S)]);
      // plane 12 is plane 0 shifted by one slot (Walker phasing F = 1)
      pairs.push(k < PLANES - 1 ? [k * S + j, (k + 1) * S + j] : [k * S + j, ((j + 1) % S)]);
    }
  return pairs;
}

/** Aggregation satellite and each Node's route to it, as satellite indices, chosen with positions at t = 4. */
export function planRoutes(S: number) {
  const N = PLANES * S, pts = Array.from({ length: N }, (_, i) => satPos(Math.floor(i / S), i % S, S, 4, new THREE.Vector3()));
  const terms = NODES.map((_, i) => bodyToTilt(terminalPoint(i, new THREE.Vector3()), 4, new THREE.Vector3()));
  const mid = AGG_DIR.clone().applyQuaternion(TILT_INV);
  // the aggregator sits on a slot both quality levels share (even slots at 20 per plane)
  const step = 20 / S;
  let agg = 0;
  pts.forEach((p, i) => { if (((i % S) * step) % 2 === 0 && p.clone().normalize().dot(mid) > pts[agg].clone().normalize().dot(mid)) agg = i; });
  const adj: number[][] = Array.from({ length: N }, () => []);
  for (const [a, b] of linkPairs(S)) { adj[a].push(b); adj[b].push(a); }
  const parent = new Array<number>(N).fill(-1), q = [agg];
  parent[agg] = agg;
  while (q.length) { const x = q.shift()!; for (const y of adj[x]) if (parent[y] < 0) { parent[y] = x; q.push(y); } }
  const used = new Set<number>([agg]);
  const routes = terms.map((tp) => {
    // nearest satellite, but prefer few hops to the aggregator
    const hops = (i: number) => { let n = 0; for (let x = i; x !== agg; x = parent[x]) n++; return n; };
    const score = (i: number) => pts[i].distanceTo(tp) + 0.9 * hops(i);
    let up = -1;
    pts.forEach((p, i) => { if (!used.has(i) && (up < 0 || score(i) < score(up))) up = i; });
    used.add(up);
    const path = [up];
    while (path[path.length - 1] !== agg) path.push(parent[path[path.length - 1]]);
    return path;
  });
  return { agg, routes };
}

export function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}
