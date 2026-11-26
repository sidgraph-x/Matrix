"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { M } from "../../materials";
import type { Quality } from "../../types";
import { EM } from "./mats";
import { grainTexture, labelTexture, moduleTexture, PV_ROWS, pyramidTexture } from "./textures";
import { Kit, mat, rng, smooth } from "./util";

/*
 * Single-axis tracker field (5 rows × 16 portrait modules) and, above it, an exploded tandem cell.
 * Scale on the surface: 1 unit ≈ 1.6 m, so a 2.28 × 1.13 m module is 1.42 × 0.71.
 */

const TUBE_Y = 1.02;
const MOD = { w: 0.7, l: 1.4, pitch: 0.735 };
const ROW_X0 = -11.35;
const PER_ROW = 16;
const DRIVE_GAP = 0.55;

export const moduleX = (i: number) => ROW_X0 + i * MOD.pitch + (i >= PER_ROW / 2 ? DRIVE_GAP : 0);
const ROW_X1 = moduleX(PER_ROW - 1);
const ROW_MID = (moduleX(PER_ROW / 2 - 1) + moduleX(PER_ROW / 2)) / 2;

/** Tracker tilt about the torque tube: faces the camera (morning) and flattens toward noon as t runs. */
export const trackerTilt = (t: number) => 0.66 - 0.52 * smooth(0, 9, t);

function Trackers({ local }: { local: () => number }) {
  const cellTex = useMemo(() => moduleTexture(), []);
  const glass = useMemo(
    () => new THREE.MeshPhysicalMaterial({ map: cellTex, color: "#c4cde6", metalness: 0, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 0.55 }),
    [cellTex],
  );
  useEffect(() => () => { cellTex.dispose(); glass.dispose(); }, [cellTex, glass]);

  const geo = useMemo(() => {
    const lam = new THREE.BoxGeometry(MOD.w, 0.028, MOD.l);
    const frame = new Kit()
      .box("f", [0.024, 0.045, MOD.l + 0.02], [MOD.w / 2 + 0.004, 0.1, 0])
      .box("f", [0.024, 0.045, MOD.l + 0.02], [-MOD.w / 2 - 0.004, 0.1, 0])
      .box("f", [MOD.w + 0.03, 0.045, 0.024], [0, 0.1, MOD.l / 2 + 0.004])
      .box("f", [MOD.w + 0.03, 0.045, 0.024], [0, 0.1, -MOD.l / 2 - 0.004])
      .build().f;
    const rails = new Kit()
      .box("r", [0.035, 0.045, MOD.l - 0.12], [0.2, 0.058, 0])
      .box("r", [0.035, 0.045, MOD.l - 0.12], [-0.2, 0.058, 0])
      .box("r", [0.11, 0.1, 0.14], [0.2, 0.0, 0])
      .box("r", [0.11, 0.1, 0.14], [-0.2, 0.0, 0])
      .build().r;
    // W-section pile with bearing housing
    const pile = new Kit()
      .box("p", [0.018, TUBE_Y, 0.12], [0, TUBE_Y / 2 - 0.05, 0])
      .box("p", [0.11, TUBE_Y, 0.014], [0, TUBE_Y / 2 - 0.05, 0.06])
      .box("p", [0.11, TUBE_Y, 0.014], [0, TUBE_Y / 2 - 0.05, -0.06])
      .box("p", [0.16, 0.02, 0.2], [0, TUBE_Y - 0.12, 0])
      .build().p;
    const bearing = new Kit()
      .box("b", [0.12, 0.2, 0.22], [0, TUBE_Y - 0.02, 0])
      .add("b", new THREE.TorusGeometry(0.075, 0.022, 8, 18), [0, TUBE_Y, 0], [0, Math.PI / 2, 0])
      .build().b;
    // slew drive: gearbox + motor at the row centre
    const drive = new Kit()
      .add("d", new RoundedBoxGeometry(0.22, 0.34, 0.34, 2, 0.03), [0, TUBE_Y - 0.04, 0])
      .cyl("d", 0.07, 0.28, [0, TUBE_Y - 0.12, 0.26], [Math.PI / 2, 0, 0], 16)
      .cyl("d", 0.08, 0.04, [0, TUBE_Y - 0.12, 0.41], [Math.PI / 2, 0, 0], 16)
      .box("d", [0.05, TUBE_Y - 0.2, 0.22], [0, (TUBE_Y - 0.2) / 2 - 0.05, 0])
      .build().d;
    // string combiner box on a post at each row end
    const comb = new Kit()
      .add("c", new RoundedBoxGeometry(0.26, 0.34, 0.12, 2, 0.02), [0, 0.62, 0])
      .box("c", [0.04, 0.5, 0.04], [0, 0.22, -0.08])
      .build().c;
    const tube = new THREE.CylinderGeometry(0.058, 0.058, ROW_X1 - ROW_X0 + 0.9, 14);
    tube.rotateZ(Math.PI / 2);
    return { lam, frame, rails, pile, bearing, drive, comb, tube };
  }, []);
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  const lamRef = useRef<THREE.InstancedMesh>(null);
  const frameRef = useRef<THREE.InstancedMesh>(null);
  const railRef = useRef<THREE.InstancedMesh>(null);
  const tubeRef = useRef<THREE.InstancedMesh>(null);
  const pileRef = useRef<THREE.InstancedMesh>(null);
  const bearRef = useRef<THREE.InstancedMesh>(null);
  const driveRef = useRef<THREE.InstancedMesh>(null);
  const combRef = useRef<THREE.InstancedMesh>(null);

  const piles = useMemo(() => {
    const xs: number[] = [];
    for (let x = ROW_X0 + 0.37; x < ROW_X1; x += 1.47) if (Math.abs(x - ROW_MID) > 0.5) xs.push(x);
    return xs;
  }, []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    let k = 0;
    PV_ROWS.forEach((z) => piles.forEach((x) => { mat([x, 0, z], [0, 0, 0], 1, m); pileRef.current?.setMatrixAt(k, m); bearRef.current?.setMatrixAt(k++, m); }));
    PV_ROWS.forEach((z, r) => {
      driveRef.current?.setMatrixAt(r, mat([ROW_MID, 0, z], [0, 0, 0], 1, m));
      combRef.current?.setMatrixAt(r, mat([ROW_X1 + 0.75, 0, z + 0.25], [0, 0, 0], 1, m));
    });
    [pileRef, bearRef, driveRef, combRef].forEach((r) => { if (r.current) r.current.instanceMatrix.needsUpdate = true; });
  }, [piles]);

  useFrame(() => {
    // 80 modules × 3 meshes: cheap enough to rewrite every frame, and robust to remounts
    const a = trackerTilt(local());
    const m = new THREE.Matrix4(), row = new THREE.Matrix4(), loc = new THREE.Matrix4();
    let k = 0;
    PV_ROWS.forEach((z, r) => {
      mat([0, TUBE_Y, z], [a, 0, 0], 1, row);
      tubeRef.current?.setMatrixAt(r, m.copy(row).multiply(loc.makeTranslation((ROW_X0 + ROW_X1) / 2, 0, 0)));
      for (let i = 0; i < PER_ROW; i++) {
        m.copy(row).multiply(loc.makeTranslation(moduleX(i), 0, 0));
        frameRef.current?.setMatrixAt(k, m);
        railRef.current?.setMatrixAt(k, m);
        lamRef.current?.setMatrixAt(k++, m.multiply(loc.makeTranslation(0, 0.1, 0)));
      }
    });
    [lamRef, frameRef, railRef, tubeRef].forEach((r) => { if (r.current) r.current.instanceMatrix.needsUpdate = true; });
  });

  const nMod = PV_ROWS.length * PER_ROW, nPile = PV_ROWS.length * piles.length, nRow = PV_ROWS.length;
  return (
    <group>
      <instancedMesh ref={lamRef} args={[geo.lam, glass, nMod]} frustumCulled={false} />
      <instancedMesh ref={frameRef} args={[geo.frame, EM.frameAlu, nMod]} frustumCulled={false} />
      <instancedMesh ref={railRef} args={[geo.rails, EM.galv, nMod]} frustumCulled={false} />
      <instancedMesh ref={tubeRef} args={[geo.tube, EM.galv, nRow]} frustumCulled={false} />
      <instancedMesh ref={pileRef} args={[geo.pile, EM.galv, nPile]} frustumCulled={false} />
      <instancedMesh ref={bearRef} args={[geo.bearing, EM.steelDark, nPile]} frustumCulled={false} />
      <instancedMesh ref={driveRef} args={[geo.drive, EM.paintGrey, nRow]} frustumCulled={false} />
      <instancedMesh ref={combRef} args={[geo.comb, EM.paintWhite, nRow]} frustumCulled={false} />
    </group>
  );
}

/* ------------------------------------------------------------------ exploded tandem stack */

export const STACK = { pos: [-5.4, 3.7, -0.4] as [number, number, number], yaw: 0.52, size: 2.9, gap: 0.44 };
const LAYERS = [
  { key: "back", h: 0.05, label: "back contact" },
  { key: "si", h: 0.2, label: "silicon · 1.12 eV", color: "#ff8f7d" },
  { key: "rec", h: 0.03, label: "recombination layer" },
  { key: "pvk", h: 0.08, label: "perovskite · 1.68 eV", color: "#9cbcff" },
  { key: "ito", h: 0.035, label: "ito · transparent contact" },
  { key: "glass", h: 0.13, label: "glass" },
] as const;
/** Layer centre heights in stack-local space, bottom (back contact) first. */
const LAYER_Y = (() => {
  let y = 0;
  return LAYERS.map((l) => { const c = y + l.h / 2; y += l.h + STACK.gap; return c; });
})();
export const STACK_TOP = LAYER_Y[5] + LAYERS[5].h / 2;
const STOP_BLUE = LAYER_Y[3] + LAYERS[3].h / 2;
const STOP_RED = LAYER_Y[1] + LAYERS[1].h / 2;

function Stack({ local, quality }: { local: () => number; quality: Quality }) {
  const res = useMemo(() => {
    const grain = grainTexture(); grain.repeat.set(3, 3);
    const pyr = pyramidTexture(); pyr.repeat.set(6, 6);
    // low-iron cover glass: pale green edge, mostly clear face
    const glass = quality === "high"
      ? new THREE.MeshPhysicalMaterial({ color: "#e3f1ec", metalness: 0, roughness: 0.06, transmission: 0.82, thickness: 0.5, ior: 1.5, clearcoat: 1, transparent: true, opacity: 0.85, emissive: "#9fc9b8", emissiveIntensity: 0.08, attenuationColor: "#bfe3d2", attenuationDistance: 0.8 })
      : new THREE.MeshPhysicalMaterial({ color: "#d9ebe4", metalness: 0, roughness: 0.06, transparent: true, opacity: 0.32, clearcoat: 1, emissive: "#9fc9b8", emissiveIntensity: 0.08 });
    const mats: Record<string, THREE.Material> = {
      back: M.aluminium,
      si: new THREE.MeshPhysicalMaterial({ color: "#1b2233", metalness: 0.5, roughness: 0.3, bumpMap: pyr, bumpScale: 2, clearcoat: 0.6, clearcoatRoughness: 0.2, iridescence: 0.35, iridescenceIOR: 1.8 }),
      rec: new THREE.MeshPhysicalMaterial({ color: "#a8a18f", metalness: 0.9, roughness: 0.25, transparent: true, opacity: 0.85 }),
      pvk: new THREE.MeshPhysicalMaterial({ map: grain, color: "#ffffff", metalness: 0.2, roughness: 0.38, clearcoat: 0.5 }),
      ito: new THREE.MeshPhysicalMaterial({ color: "#c9d6e6", metalness: 0.3, roughness: 0.1, transparent: true, opacity: 0.45, iridescence: 1, iridescenceIOR: 1.9, iridescenceThicknessMinimum: 180, iridescenceThicknessMaximum: 420 }),
      glass,
    };
    const geos = LAYERS.map((l) => new RoundedBoxGeometry(STACK.size, l.h, STACK.size, 2, Math.min(0.012, l.h / 2.5)));
    const labels = LAYERS.map((l) => labelTexture(l.label, { color: "color" in l ? l.color : undefined }));
    const labelMats = labels.map((t) => new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    // dashed exploded-view guides at the four corners
    const h = STACK.size / 2 + 0.03, top = STACK_TOP + 0.5;
    const pts: number[] = [];
    for (const [x, z] of [[h, h], [-h, h], [h, -h], [-h, -h]]) pts.push(x, -0.25, z, x, top, z);
    const guideGeo = new THREE.BufferGeometry();
    guideGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const guideMat = new THREE.LineDashedMaterial({ color: "#ede6da", dashSize: 0.08, gapSize: 0.07, transparent: true, opacity: 0.32 });
    const plane = new THREE.PlaneGeometry(2.2, 2.2 * 72 / 640);
    return { grain, pyr, mats, geos, labels, labelMats, guideGeo, guideMat, plane, glass };
  }, [quality]);
  useEffect(() => () => {
    res.grain.dispose(); res.pyr.dispose(); res.geos.forEach((g) => g.dispose()); res.labels.forEach((t) => t.dispose());
    res.labelMats.forEach((m) => m.dispose()); res.guideGeo.dispose(); res.guideMat.dispose(); res.plane.dispose();
    Object.entries(res.mats).forEach(([k, m]) => { if (k !== "back") m.dispose(); });
  }, [res]);
  const guides = useRef<THREE.LineSegments>(null);
  useLayoutEffect(() => { guides.current?.computeLineDistances(); }, [res]);

  const labelRefs = useRef<(THREE.Mesh | null)[]>([]);

  // photons: blue stop at the perovskite, red pass on to the silicon
  const n = quality === "high" ? 16 : 8;
  const ph = useMemo(() => {
    const r = rng(29);
    return Array.from({ length: n * 2 }, (_, i) => ({ red: i >= n, x: (r() - 0.5) * 2.3, z: (r() - 0.5) * 2.3, p: r() }));
  }, [n]);
  const streakGeo = useMemo(() => { const g = new THREE.CylinderGeometry(0.011, 0.011, 1, 6, 1, true); g.translate(0, 0.5, 0); return g; }, []);
  const flashGeo = useMemo(() => new THREE.SphereGeometry(1, 12, 8), []);
  useEffect(() => () => { streakGeo.dispose(); flashGeo.dispose(); }, [streakGeo, flashGeo]);
  const streaks = useRef<THREE.InstancedMesh>(null);
  const flashes = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const blue = new THREE.Color("#6f9dff"), red = new THREE.Color("#ff4b3a");
    ph.forEach((p, i) => {
      streaks.current?.setColorAt(i, p.red ? red : blue);
      flashes.current?.setColorAt(i, p.red ? red : blue);
    });
    [streaks, flashes].forEach((r) => { if (r.current?.instanceColor) r.current.instanceColor.needsUpdate = true; });
  }, [ph]);

  const dir = useMemo(() => new THREE.Vector3(0.16, -1, 0.1).normalize(), []);
  useFrame(() => {
    const t = local();
    // labels fade in for the push-in beat
    const lo = smooth(2.4, 3.6, t) * (1 - smooth(6.6, 7.6, t));
    labelRefs.current.forEach((m) => { if (m) (m.material as THREE.MeshBasicMaterial).opacity = lo; });
    const S = streaks.current, F = flashes.current;
    if (!S || !F) return;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate());
    const pos = new THREE.Vector3(), sc = new THREE.Vector3();
    const T = 1.25, L = 0.6, H0 = 2.3, speed = 4.2;
    ph.forEach((p, i) => {
      const on = t > 0 ? 1 : 0;
      const stop = p.red ? STOP_RED : STOP_BLUE;
      const tau = ((t * 1 + p.p * T) % T);
      const y0 = STACK_TOP + H0;
      const dy = -dir.y;
      const travel = tau * speed; // along the ray
      const headY = y0 - travel * dy;
      // the streak runs from head back up the ray by L, clipped at the absorber
      const hy = Math.max(headY, stop);
      const tailY = Math.min(y0, headY + L * dy);
      const len = Math.max(0, (tailY - hy) / dy) * on;
      const back = (y0 - hy) / dy;
      pos.set(p.x + dir.x * back, hy, p.z + dir.z * back);
      sc.set(1, Math.max(len, 1e-4), 1);
      S.setMatrixAt(i, m.compose(pos, q, sc));
      // flash when the head reaches the absorber
      const hitT = (y0 - stop) / dy / speed;
      const f = tau > hitT ? Math.max(0, 1 - (tau - hitT) / 0.35) : 0;
      sc.setScalar(0.035 + 0.06 * f).multiplyScalar(f * on > 0 ? 1 : 1e-4);
      F.setMatrixAt(i, m.compose(pos, q, sc));
    });
    S.instanceMatrix.needsUpdate = true; F.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={STACK.pos} rotation={[0, STACK.yaw, 0]}>
      {LAYERS.map((l, i) => (
        <mesh key={l.key} geometry={res.geos[i]} material={res.mats[l.key]} position={[0, LAYER_Y[i], 0]} />
      ))}
      {/* contact fingers printed on the glass side of the ITO */}
      <group position={[0, LAYER_Y[4] + LAYERS[4].h / 2 + 0.004, 0]}>
        {Array.from({ length: 9 }, (_, k) => (
          <mesh key={k} position={[-1.2 + k * 0.3, 0, 0]} material={M.aluminium}>
            <boxGeometry args={[0.018, 0.008, STACK.size - 0.08]} />
          </mesh>
        )).slice(0, quality === "high" ? 9 : 5)}
      </group>
      <lineSegments ref={guides} geometry={res.guideGeo} material={res.guideMat} />
      {LAYERS.map((l, i) => (
        <mesh
          key={`lab-${l.key}`}
          ref={(m) => { labelRefs.current[i] = m; }}
          geometry={res.plane}
          material={res.labelMats[i]}
          position={[STACK.size / 2 + 1.12, LAYER_Y[i], STACK.size / 2]}
        />
      ))}
      <instancedMesh ref={streaks} args={[streakGeo, EM.glow, ph.length]} frustumCulled={false} />
      <instancedMesh ref={flashes} args={[flashGeo, EM.glow, ph.length]} frustumCulled={false} />
    </group>
  );
}

export default function TandemPV({ local, quality }: { local: () => number; quality: Quality }) {
  return (
    <group>
      <Trackers local={local} />
      <Stack local={local} quality={quality} />
    </group>
  );
}
