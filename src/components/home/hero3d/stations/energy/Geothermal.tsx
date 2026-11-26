"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Quality } from "../../types";
import { EM } from "./mats";
import { Kit, rng } from "./util";

/*
 * Enhanced geothermal doublet drawn on the front section face (z = 7): an injection and a production
 * well with stepped casing strings, horizontal laterals at ~3.4 and ~4.2 km, and a stimulated fracture
 * network between them. The wells are sectioned: each reads as a half-pipe trough on the face.
 */

const FACE = 7;
export const WELL = { inj: -8, prod: 1.5, injLat: -5.95, prodLat: -4.7, injEnd: -1.6, prodEnd: -6.8, bend: 0.9 };
const CASING = [
  { y0: 0, y1: -1.0, r: 0.21 },
  { y0: -1.0, y1: -2.6, r: 0.165 },
  { y0: -2.6, y1: -99, r: 0.13 },
];
const LINER = 0.1;

function wellCurve(x: number, latY: number, endX: number) {
  const dir = Math.sign(endX - x), b = WELL.bend;
  const p = new THREE.CurvePath<THREE.Vector3>();
  p.add(new THREE.LineCurve3(new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, latY + b, 0)));
  p.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, latY + b, 0), new THREE.Vector3(x, latY, 0), new THREE.Vector3(x + dir * b, latY, 0)));
  p.add(new THREE.LineCurve3(new THREE.Vector3(x + dir * b, latY, 0), new THREE.Vector3(endX, latY - 0.06 * dir * 0, 0)));
  return p;
}

/** A sectioned pipe: concave back half (BackSide tube), two bright cut rims, and a cement-sheath ribbon. */
function addSectionPipe(kit: Kit, pts: THREE.Vector3[], r: number) {
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  const n = Math.max(8, Math.round(curve.getLength() * 10));
  kit.add("bore", new THREE.TubeGeometry(curve, n, r, 16, false), [0, 0, FACE + r]);
  const sp = curve.getSpacedPoints(n);
  const off = (d: number) => sp.map((p, i) => {
    const a = sp[Math.max(0, i - 1)], b = sp[Math.min(sp.length - 1, i + 1)];
    const t = b.clone().sub(a).normalize();
    return new THREE.Vector3(p.x - t.y * d, p.y + t.x * d, 0);
  });
  for (const s of [1, -1]) {
    const c = new THREE.CatmullRomCurve3(off(s * r), false, "centripetal");
    kit.add("rim", new THREE.TubeGeometry(c, n, 0.016, 6, false), [0, 0, FACE + r]);
  }
  // cement sheath ribbon on the face
  const L = off(r + 0.09), R = off(-(r + 0.09));
  const pos: number[] = [], idx: number[] = [];
  for (let i = 0; i < sp.length; i++) { pos.push(L[i].x, L[i].y, 0, R[i].x, R[i].y, 0); }
  for (let i = 0; i < sp.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // force normals to +z (winding may flip on bends)
  const nrm = g.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, 0, 0, 1);
  kit.add("cement", g, [0, 0, FACE + 0.004]);
}

function buildWells() {
  const kit = new Kit();
  const wells = [
    { x: WELL.inj, lat: WELL.injLat, end: WELL.injEnd },
    { x: WELL.prod, lat: WELL.prodLat, end: WELL.prodEnd },
  ];
  const routes: { inj: THREE.Vector3[]; prod: THREE.Vector3[] } = { inj: [], prod: [] };
  wells.forEach((w, wi) => {
    const path = wellCurve(w.x, w.lat, w.end);
    // stepped casing on the vertical run
    CASING.forEach((c) => {
      const y1 = Math.max(c.y1, w.lat + WELL.bend);
      addSectionPipe(kit, [new THREE.Vector3(w.x, c.y0, 0), new THREE.Vector3(w.x, (c.y0 + y1) / 2, 0), new THREE.Vector3(w.x, y1, 0)], c.r);
      // casing shoe: a short collar where each string ends
      kit.add("rim", new THREE.BoxGeometry(c.r * 2 + 0.1, 0.05, 0.03), [w.x, y1, FACE + 0.02]);
    });
    // liner through the bend and lateral
    const lp = path.getSpacedPoints(60).filter((p) => p.y <= w.lat + WELL.bend + 0.001);
    addSectionPipe(kit, lp, LINER);
    // frac stages: packer bands along the lateral
    const dir = Math.sign(w.end - w.x);
    for (let x = w.x + dir * (WELL.bend + 0.45); dir > 0 ? x < w.end - 0.1 : x > w.end + 0.1; x += dir * 0.62) {
      kit.add("packer", new THREE.BoxGeometry(0.06, LINER * 2 + 0.06, 0.05), [x, w.lat, FACE + LINER]);
    }
    // toe cap
    kit.add("rim", new THREE.BoxGeometry(0.05, LINER * 2 + 0.08, 0.04), [w.end, w.lat, FACE + LINER]);
    const route = path.getSpacedPoints(120).map((p) => new THREE.Vector3(p.x, p.y, FACE + 0.09));
    if (wi === 0) routes.inj = route; else routes.prod = route.reverse();
  });
  return { geos: kit.build(), routes };
}

/** Fracture network between the laterals: 7 seeded traces with side branches. */
function buildFractures() {
  const r = rng(53);
  const segs: [THREE.Vector2, THREE.Vector2][] = [];
  const traces: THREE.Vector2[][] = [];
  const xs = [-6.2, -5.5, -4.8, -4.15, -3.45, -2.8, -2.15];
  xs.forEach((x0) => {
    const tr: THREE.Vector2[] = [new THREE.Vector2(x0, WELL.injLat)];
    let p = tr[0].clone();
    while (p.y < WELL.prodLat - 0.01) {
      const q = new THREE.Vector2(p.x + (r() - 0.5) * 0.26, Math.min(WELL.prodLat, p.y + 0.14 + r() * 0.12));
      segs.push([p, q]); tr.push(q);
      if (r() < 0.34) {
        // side branch dying out within the reservoir
        let b = p.clone(); const sx = r() < 0.5 ? -1 : 1;
        const steps = 2 + Math.floor(r() * 3);
        for (let k = 0; k < steps; k++) {
          const c = new THREE.Vector2(b.x + sx * (0.12 + r() * 0.16), b.y + (r() - 0.35) * 0.2);
          c.y = Math.min(WELL.prodLat - 0.05, Math.max(WELL.injLat + 0.05, c.y));
          segs.push([b, c]); b = c;
        }
      }
      p = q;
    }
    traces.push(tr);
  });
  // also extend fractures a little beyond the laterals (stimulation reaches past them)
  xs.forEach((x0, i) => {
    const up = new THREE.Vector2(x0 + (r() - 0.5) * 0.3, WELL.prodLat + 0.25 + r() * 0.3);
    segs.push([traces[i][traces[i].length - 1], up]);
    const dn = new THREE.Vector2(x0 + (r() - 0.5) * 0.3, WELL.injLat - 0.2 - r() * 0.3);
    segs.push([traces[i][0], dn]);
  });
  return { segs, traces };
}

type Route = { pts: THREE.Vector3[]; cum: number[]; len: number; heatA: number; heatB: number };
function makeRoute(pts: THREE.Vector3[], heatA: number, heatB: number): Route {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const len = cum[cum.length - 1];
  return { pts, cum, len, heatA: cum[heatA] / len, heatB: cum[heatB] / len };
}
function sample(r: Route, s: number, out: THREE.Vector3) {
  let lo = 0, hi = r.cum.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (r.cum[m] < s) lo = m; else hi = m; }
  const u = (s - r.cum[lo]) / Math.max(1e-6, r.cum[hi] - r.cum[lo]);
  return out.lerpVectors(r.pts[lo], r.pts[hi], u);
}

function treeKit(kit: Kit, wing: 1 | -1) {
  const valve = (y: number, side: "z" | "x", sx = 0) => {
    kit.add("paint", new RoundedBoxGeometry(0.26, 0.28, 0.26, 2, 0.03), [sx, y, 0]);
    if (side === "z") {
      kit.cyl("paint", 0.065, 0.2, [sx, y, 0.2], [Math.PI / 2, 0, 0], 14);
      kit.cyl("steel", 0.014, 0.16, [sx, y, 0.36], [Math.PI / 2, 0, 0], 8);
      kit.add("wheel", new THREE.TorusGeometry(0.11, 0.013, 6, 22), [sx, y, 0.42]);
      for (let k = 0; k < 3; k++) kit.box("wheel", [0.22, 0.012, 0.012], [sx, y, 0.42], [0, 0, (k * Math.PI) / 3]);
    } else {
      kit.cyl("paint", 0.065, 0.2, [sx, y + 0.2, 0], [0, 0, 0], 14);
      kit.cyl("steel", 0.014, 0.14, [sx, y + 0.36, 0], [0, 0, 0], 8);
      kit.add("wheel", new THREE.TorusGeometry(0.1, 0.012, 6, 22), [sx, y + 0.42, 0], [Math.PI / 2, 0, 0]);
      for (let k = 0; k < 3; k++) kit.box("wheel", [0.2, 0.011, 0.011], [sx, y + 0.42, 0], [0, (k * Math.PI) / 3, 0]);
    }
  };
  const flange = (y: number, r: number, bolts: number) => {
    kit.cyl("steel", r, 0.05, [0, y, 0], [0, 0, 0], 28);
    for (let k = 0; k < bolts; k++) {
      const a = (k / bolts) * Math.PI * 2;
      kit.cyl("zinc", 0.014, 0.09, [Math.cos(a) * (r - 0.035), y, Math.sin(a) * (r - 0.035)], [0, 0, 0], 6);
    }
  };
  kit.cyl("concrete", 0.36, 0.06, [0, 0.03, 0], [0, 0, 0], 28);
  kit.cyl("paint", 0.2, 0.22, [0, 0.17, 0], [0, 0, 0], 24);
  for (const s of [1, -1]) {
    kit.cyl("paint", 0.045, 0.2, [s * 0.27, 0.17, 0], [0, 0, Math.PI / 2], 12);
    kit.cyl("steel", 0.07, 0.03, [s * 0.37, 0.17, 0], [0, 0, Math.PI / 2], 14);
  }
  kit.cyl("steel", 0.012, 0.08, [0.37 + 0.02, 0.26, 0], [0, 0, 0], 6);
  kit.cyl("zinc", 0.045, 0.02, [0.39, 0.31, 0], [Math.PI / 2, 0, 0], 16);
  flange(0.3, 0.27, 12);
  kit.cyl("paint", 0.16, 0.2, [0, 0.43, 0], [0, 0, 0], 22);
  flange(0.55, 0.22, 10);
  valve(0.72, "z");
  flange(0.89, 0.2, 8);
  valve(1.06, "z");
  flange(1.23, 0.2, 8);
  // cross with wing valves
  kit.add("paint", new RoundedBoxGeometry(0.24, 0.26, 0.24, 2, 0.03), [0, 1.38, 0]);
  for (const s of [1, -1]) {
    kit.cyl("steel", 0.15, 0.04, [s * 0.15, 1.38, 0], [0, 0, Math.PI / 2], 22);
    valve(1.38, "x", s * 0.33);
    kit.cyl("steel", 0.15, 0.04, [s * 0.48, 1.38, 0], [0, 0, Math.PI / 2], 22);
  }
  // flowline off the working wing, down to grade on a support
  kit.cyl("steel", 0.06, 0.34, [wing * 0.66, 1.38, 0], [0, 0, Math.PI / 2], 14);
  kit.add("steel", new THREE.TorusGeometry(0.16, 0.06, 10, 16, Math.PI / 2), [wing * 0.83, 1.22, 0], [0, wing > 0 ? 0 : Math.PI, 0]);
  kit.cyl("steel", 0.06, 0.95, [wing * 0.99, 0.74, 0], [0, 0, 0], 14);
  kit.box("galv", [0.3, 0.05, 0.3], [wing * 0.99, 0.25, 0]);
  kit.box("galv", [0.05, 0.22, 0.05], [wing * 0.99, 0.11, 0]);
  // swab valve, cap and gauge
  flange(1.53, 0.17, 8);
  valve(1.68, "z");
  kit.cyl("paint", 0.11, 0.12, [0, 1.88, 0], [0, 0, 0], 20);
  kit.cyl("steel", 0.014, 0.12, [0, 2.0, 0], [0, 0, 0], 8);
  kit.cyl("zinc", 0.065, 0.025, [0, 2.1, 0.0], [Math.PI / 2, 0, 0], 20);
}

const TREE_Z = FACE - 0.42;

export default function Geothermal({ local, quality }: { local: () => number; quality: Quality }) {
  const built = useMemo(() => {
    const w = buildWells();
    const f = buildFractures();
    const kit = new Kit();
    treeKit(kit.at([WELL.inj, 0, TREE_Z], [0, 0, 0], 0.82), -1);
    treeKit(kit.at([WELL.prod, 0, TREE_Z], [0, 0, 0], 0.82), 1);
    const trees = kit.build();
    // particle routes: down the injector, along its lateral to a fracture, up the fracture, back along the producer
    const routes: Route[] = f.traces.map((tr) => {
      const x0 = tr[0].x;
      const injIdx = w.routes.inj.findIndex((p) => p.y <= WELL.injLat + 0.001 && (WELL.injEnd > WELL.inj ? p.x >= x0 : p.x <= x0));
      const down = w.routes.inj.slice(0, Math.max(2, injIdx));
      const up = tr.map((p) => new THREE.Vector3(p.x, p.y, FACE + 0.06));
      const x1 = tr[tr.length - 1].x;
      const prodIdx = w.routes.prod.findIndex((p) => (WELL.prodEnd < WELL.prod ? p.x >= x1 : p.x <= x1));
      const back = w.routes.prod.slice(Math.max(0, prodIdx));
      const pts = [...down, ...up, ...back];
      return makeRoute(pts, down.length - 1, down.length + up.length - 1);
    });
    const fracGeo = new THREE.PlaneGeometry(1, 1);
    return { w, f, trees, routes, fracGeo };
  }, []);

  const mats = useMemo(() => ({
    bore: new THREE.MeshStandardMaterial({ color: "#5d5f60", metalness: 0.85, roughness: 0.38, side: THREE.BackSide }),
    cement: new THREE.MeshStandardMaterial({ color: "#a49f95", roughness: 0.9, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1 }),
    packer: new THREE.MeshStandardMaterial({ color: "#2b2a29", roughness: 0.6, metalness: 0.4 }),
    frac: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.25, 0.62, 0.32), toneMapped: false, transparent: true, opacity: 0.85, depthWrite: false }),
  }), []);
  useEffect(() => () => {
    Object.values(mats).forEach((m) => m.dispose());
    Object.values(built.w.geos).forEach((g) => g.dispose());
    Object.values(built.trees).forEach((g) => g.dispose());
    built.fracGeo.dispose();
  }, [mats, built]);

  const fracRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
    built.f.segs.forEach(([a, b], i) => {
      const d = b.clone().sub(a);
      p.set((a.x + b.x) / 2, (a.y + b.y) / 2, FACE + 0.012);
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.atan2(d.y, d.x));
      s.set(d.length() + 0.012, 0.022, 1);
      fracRef.current?.setMatrixAt(i, m.compose(p, q, s));
    });
    if (fracRef.current) fracRef.current.instanceMatrix.needsUpdate = true;
  }, [built]);

  const n = quality === "high" ? 160 : 80;
  const parts = useMemo(() => { const r = rng(71); return Array.from({ length: n }, (_, i) => ({ route: i % built.routes.length, p: r() })); }, [n, built]);
  const pRef = useRef<THREE.InstancedMesh>(null);
  const pGeo = useMemo(() => new THREE.SphereGeometry(0.038, 8, 6), []);
  useEffect(() => () => pGeo.dispose(), [pGeo]);
  const cold = useMemo(() => new THREE.Color("#d9a55b").multiplyScalar(0.85), []);
  const hot = useMemo(() => new THREE.Color("#ff6b2c").multiplyScalar(1.1), []);

  useFrame(() => {
    const t = local();
    const P = pRef.current;
    if (!P) return;
    const m = new THREE.Matrix4(), v = new THREE.Vector3(), c = new THREE.Color();
    const speed = 1.9;
    parts.forEach((pt, i) => {
      const r = built.routes[pt.route];
      const s = (pt.p * r.len + t * speed) % r.len;
      sample(r, s, v);
      const u = s / r.len;
      const h = Math.min(1, Math.max(0, (u - r.heatA) / Math.max(1e-3, r.heatB - r.heatA)));
      c.copy(cold).lerp(hot, h);
      const sc = t > 0 ? 1 : 0.7;
      m.makeScale(sc, sc, sc).setPosition(v);
      P.setMatrixAt(i, m);
      P.setColorAt(i, c);
    });
    P.instanceMatrix.needsUpdate = true;
    if (P.instanceColor) P.instanceColor.needsUpdate = true;
  });

  const kitMat: Record<string, THREE.Material> = {
    bore: mats.bore, rim: EM.stainless, cement: mats.cement, packer: mats.packer,
    paint: EM.paintValve, steel: EM.steelDark, zinc: EM.zinc, wheel: EM.rubber, concrete: EM.concrete, galv: EM.galv,
  };
  return (
    <group>
      {Object.entries(built.w.geos).map(([k, g]) => <mesh key={`w-${k}`} geometry={g} material={kitMat[k]} />)}
      {Object.entries(built.trees).map(([k, g]) => <mesh key={`t-${k}`} geometry={g} material={kitMat[k]} />)}
      <instancedMesh ref={fracRef} args={[built.fracGeo, mats.frac, built.f.segs.length]} frustumCulled={false} />
      <instancedMesh ref={pRef} args={[pGeo, EM.glow, n]} frustumCulled={false} />
    </group>
  );
}
