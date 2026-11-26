import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { rng } from "./geo";

/*
 * A generic flat-panel broadband LEO satellite, in its own units (bus length 1).
 * Local axes: +x along track (velocity), +y zenith, +z cross track (orbit normal).
 * Wings sit on booms along ±z and rotate about z to track the sun.
 */

const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return [c, c.getContext("2d")!] as const;
};
const tex = (c: HTMLCanvasElement, srgb = true) => {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
};

/** Solar wing: cell grid in hinged sub-panels, silver busbars, aluminium frame. */
export function wingTexture(size: number) {
  const [c, g] = canvas(size / 2, size);
  const W = c.width, H = c.height, r = rng(31);
  g.fillStyle = "#9ea3a8"; g.fillRect(0, 0, W, H);
  const frame = W * 0.04, cols = 6, panels = 4, rowsPer = 8, hinge = H * 0.012;
  const ph = (H - 2 * frame - hinge * (panels - 1)) / panels;
  for (let p = 0; p < panels; p++) {
    const py = frame + p * (ph + hinge);
    g.fillStyle = "#2a2e33"; g.fillRect(frame, py, W - 2 * frame, ph);
    const cw = (W - 2 * frame) / cols, chh = ph / rowsPer, gap = Math.max(1, W * 0.006);
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rowsPer; j++) {
        const x = frame + i * cw + gap, y = py + j * chh + gap, w = cw - 2 * gap, h = chh - 2 * gap;
        const k = 0.85 + r() * 0.3;
        const grd = g.createLinearGradient(x, y, x + w, y + h);
        grd.addColorStop(0, `rgb(${14 * k},${24 * k},${58 * k})`);
        grd.addColorStop(1, `rgb(${9 * k},${15 * k},${38 * k})`);
        g.fillStyle = grd; g.fillRect(x, y, w, h);
        // fingers and two busbars per cell
        g.fillStyle = "rgba(170,180,195,0.18)";
        for (let f = 1; f < 10; f++) g.fillRect(x, y + (h * f) / 10, w, Math.max(0.5, H / 2400));
        g.fillStyle = "rgba(205,210,220,0.55)";
        g.fillRect(x + w * 0.3, y, Math.max(1, W / 400), h);
        g.fillRect(x + w * 0.7, y, Math.max(1, W / 400), h);
      }
  }
  g.strokeStyle = "#d8dbdf"; g.lineWidth = frame * 0.5; g.strokeRect(frame * 0.25, frame * 0.25, W - frame * 0.5, H - frame * 0.5);
  return tex(c);
}

/** Bus panels: optical solar reflector tiles (mirror squares) with dark grout and fastener rows. */
export function busTexture(size: number) {
  const [c, g] = canvas(size, size);
  const r = rng(53);
  g.fillStyle = "#26282b"; g.fillRect(0, 0, size, size);
  const n = 10, cell = size / n;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const k = 150 + r() * 60;
      g.fillStyle = `rgb(${k},${k + 4},${k + 10})`;
      g.fillRect(i * cell + 2, j * cell + 2, cell - 4, cell - 4);
    }
  g.fillStyle = "#1a1b1d"; g.fillRect(0, size * 0.46, size, size * 0.08);
  g.fillStyle = "#8b8e92";
  for (let i = 0; i < 24; i++) g.fillRect(((i + 0.5) / 24) * size - 1, size * 0.5 - 1, 2, 2);
  return tex(c);
}

/** Phased-array face: off-white radome with a fine element lattice. */
export function arrayTexture(size: number) {
  const [c, g] = canvas(size, size);
  g.fillStyle = "#c9c7c1"; g.fillRect(0, 0, size, size);
  const n = 40, s = size / n;
  g.fillStyle = "#77746d";
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) g.fillRect(i * s + s * 0.3, j * s + s * 0.3, s * 0.4, s * 0.4);
  g.strokeStyle = "#5c5953"; g.lineWidth = size * 0.02; g.strokeRect(0, 0, size, size);
  return tex(c);
}

/** Crinkled multi-layer insulation, as a bump map. */
export function mliBump(size: number) {
  const [c, g] = canvas(size, size);
  const r = rng(71);
  g.fillStyle = "#808080"; g.fillRect(0, 0, size, size);
  for (let i = 0; i < 260; i++) {
    const x = r() * size, y = r() * size, a = r() * Math.PI, l = size * (0.05 + r() * 0.2);
    g.strokeStyle = r() < 0.5 ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
    g.lineWidth = 1 + r() * 3;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  return tex(c, false);
}

const at = (geo: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0, rz = 0) => {
  geo.rotateX(rx); geo.rotateZ(rz); geo.translate(x, y, z);
  return geo;
};

/** Merge after dropping indices: RoundedBoxGeometry is non-indexed, the primitives are indexed. */
const merge = (list: THREE.BufferGeometry[]) => mergeGeometries(list.map((g) => (g.index ? g.toNonIndexed() : g)));

export function satGeometries() {
  const bus = new RoundedBoxGeometry(1.0, 0.2, 0.62, 2, 0.025);
  // gold MLI wrapping the aft half of the bus and the propulsion end
  const mli = merge([
    at(new RoundedBoxGeometry(0.42, 0.212, 0.632, 1, 0.02), -0.27, 0, 0),
    at(new THREE.CylinderGeometry(0.05, 0.065, 0.09, 10, 1, true), -0.55, 0, 0, 0, Math.PI / 2),
  ]);
  // two phased-array panels on the nadir face, plus a smaller gateway array
  const arrays = merge([
    at(new THREE.BoxGeometry(0.4, 0.016, 0.5), 0.2, -0.108, 0),
    at(new THREE.BoxGeometry(0.3, 0.016, 0.38), -0.22, -0.108, -0.04),
  ]);
  // laser terminals: four gimballed heads on the zenith deck, two star trackers
  const heads: THREE.BufferGeometry[] = [];
  for (const [x, z] of [[0.38, 0.22], [0.38, -0.22], [-0.05, 0.22], [-0.05, -0.22]]) {
    heads.push(at(new THREE.CylinderGeometry(0.05, 0.058, 0.05, 10, 1, true), x, 0.125, z));
    heads.push(at(new THREE.CylinderGeometry(0.038, 0.038, 0.06, 10, 1, true), x, 0.175, z, Math.PI / 2));
  }
  heads.push(at(new THREE.BoxGeometry(0.06, 0.05, 0.05), 0.15, 0.125, 0.0));
  heads.push(at(new THREE.BoxGeometry(0.06, 0.05, 0.05), 0.15, 0.125, 0.09));
  const terminals = merge(heads);
  const lensParts: THREE.BufferGeometry[] = [];
  for (const [x, z] of [[0.38, 0.22], [0.38, -0.22], [-0.05, 0.22], [-0.05, -0.22]]) {
    lensParts.push(at(new THREE.SphereGeometry(0.036, 10, 3, 0, Math.PI * 2, 0, Math.PI / 2), x, 0.175, z + Math.sign(z) * 0.03, Math.sign(z) * Math.PI / 2));
  }
  const lenses = merge(lensParts);
  // booms with solar-array drive at the root
  const booms = merge([
    at(new THREE.CylinderGeometry(0.016, 0.016, 0.5, 6, 1, true), 0, 0, 0.56, Math.PI / 2),
    at(new THREE.CylinderGeometry(0.016, 0.016, 0.5, 6, 1, true), 0, 0, -0.56, Math.PI / 2),
    at(new THREE.CylinderGeometry(0.05, 0.05, 0.07, 10), 0, 0, 0.345, Math.PI / 2),
    at(new THREE.CylinderGeometry(0.05, 0.05, 0.07, 10), 0, 0, -0.345, Math.PI / 2),
    at(new THREE.BoxGeometry(0.34, 0.02, 0.03), 0, 0, 0.81),
    at(new THREE.BoxGeometry(0.34, 0.02, 0.03), 0, 0, -0.81),
  ]);
  // wings: body (frame and white back) and the cell face, which sits on +y
  const wingLen = 2.1, wingW = 0.6, z0 = 0.82;
  const wingBody = merge([
    at(new THREE.BoxGeometry(wingW, 0.014, wingLen), 0, 0, z0 + wingLen / 2),
    at(new THREE.BoxGeometry(wingW, 0.014, wingLen), 0, 0, -(z0 + wingLen / 2)),
  ]);
  const cellA = at(new THREE.PlaneGeometry(wingW, wingLen), 0, 0.0075, z0 + wingLen / 2, -Math.PI / 2);
  const cellB = at(new THREE.PlaneGeometry(wingW, wingLen), 0, 0.0075, -(z0 + wingLen / 2), -Math.PI / 2);
  const wingCells = merge([cellA, cellB]);
  return { bus, mli, arrays, terminals, lenses, booms, wingBody, wingCells };
}
