"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { M } from "../../materials";
import type { Quality } from "../../types";
import type { Draft } from "./draftTexture";
import { curl, SHEET_H, SHEET_POS, SHEET_ROT, SHEET_W } from "./space";

/** A sheet of paper: a finely subdivided plane bent by `curl`, so light rolls across it. */
function paperGeometry(k: number, segX: number, segY: number) {
  const g = new THREE.PlaneGeometry(SHEET_W, SHEET_H, segX, segY);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, curl(p.getX(i), p.getY(i), k));
  g.computeVertexNormals();
  return g;
}

/**
 * A Gem clip: one wire bent into three nested U-turns. The inner loop sits behind the page and the
 * outer loop in front, crossing over the top edge, as a real clip grips paper.
 */
function clipGeometry() {
  const pts: THREE.Vector3[] = [];
  const FRONT = 0.03, BACK = -0.028;
  const leg = (x: number, y0: number, y1: number, z: number) => {
    for (let i = 0; i <= 8; i++) pts.push(new THREE.Vector3(x, y0 + (y1 - y0) * (i / 8), z));
  };
  const turn = (cx: number, cy: number, r: number, a0: number, a1: number, z0: number, z1: number) => {
    for (let i = 1; i < 12; i++) {
      const t = i / 12, a = a0 + (a1 - a0) * t;
      pts.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z0 + (z1 - z0) * t));
    }
  };
  leg(0.1, 0.5, -0.36, BACK);
  turn(0, -0.36, 0.1, 0, -Math.PI, BACK, BACK);
  leg(-0.1, -0.36, 0.66, BACK);
  turn(0.02, 0.66, 0.12, Math.PI, 0, BACK, FRONT);
  leg(0.14, 0.66, -0.6, FRONT);
  turn(0, -0.6, 0.14, 0, -Math.PI, FRONT, FRONT);
  leg(-0.14, -0.6, 0.12, FRONT);
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.2);
  return new THREE.TubeGeometry(curve, 260, 0.014, 8, false);
}

export default function DraftSheet({ draft, quality }: { draft: Draft; quality: Quality }) {
  const hi = quality === "high";
  const geo = useMemo(() => ({
    top: paperGeometry(1, hi ? 56 : 28, hi ? 80 : 40),
    under: paperGeometry(0.75, 24, 34),
    clip: clipGeometry(),
  }), [hi]);
  const mats = useMemo(() => ({
    top: new THREE.MeshStandardMaterial({ map: draft.texture, color: "#e8e4dc", roughness: 0.88, metalness: 0, side: THREE.DoubleSide }),
    under: new THREE.MeshStandardMaterial({ color: "#d9d3c7", roughness: 0.92, side: THREE.DoubleSide }),
  }), [draft.texture]);
  useEffect(() => () => { geo.top.dispose(); geo.under.dispose(); geo.clip.dispose(); }, [geo]);
  useEffect(() => () => { mats.top.dispose(); mats.under.dispose(); }, [mats]);

  const light = useMemo(() => {
    const target = new THREE.Object3D();
    target.position.set(SHEET_POS[0] - 0.4, SHEET_POS[1] + 0.6, SHEET_POS[2]);
    return target;
  }, []);

  return (
    <group>
      {/* a soft desk-lamp key from the upper left, so light falls off across the page */}
      <primitive object={light} />
      <spotLight
        position={[SHEET_POS[0] - 3.5, SHEET_POS[1] + 5.5, SHEET_POS[2] + 5]}
        target={light}
        angle={0.42}
        penumbra={1}
        decay={0}
        intensity={0.7}
        color="#ffe9d0"
      />
      <group position={SHEET_POS} rotation={SHEET_ROT}>
        {/* two pages underneath, a little askew, so the edges read as a stack */}
        <mesh geometry={geo.under} material={mats.under} position={[0.05, -0.06, -0.035]} rotation-z={-0.028} />
        <mesh geometry={geo.under} material={mats.under} position={[-0.04, -0.02, -0.018]} rotation-z={0.018} />
        <mesh geometry={geo.top} material={mats.top} />
        <mesh geometry={geo.clip} material={M.nickel} position={[-1.62, SHEET_H / 2 - 0.2, 0]} rotation-z={0.05} scale={0.62} />
      </group>
    </group>
  );
}
