"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useLocalTime } from "../../clock";
import { HM, PLATE, STRIP, STRIP_GAP, layerY } from "./layout";
import { N, RANK, SUB, aToRGBA, bToRGBA, dataTexture, deltaToRGBA, factorsAt, makeAdapter, product } from "./weights";

const HALF = PLATE / 2;
const STEP_SECONDS = 0.25;
/** Seconds after the chapter starts when the strips begin to slide out; per-layer stagger is added. */
const EXTRUDE_AT = 1.8;
const EXTRUDE_FOR = 1.3;
const TRAIN_AT = 2.8;

/** Flag GPU resources for re-upload (a helper, so hook-owned objects are not mutated inline). */
export const touch = (...xs: { needsUpdate: boolean }[]) => xs.forEach((x) => { x.needsUpdate = true; });

const smooth = (a: number, b: number, x: number) => {
  const u = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return u * u * (3 - 2 * u);
};

/* B lies along the +x edge (it spans the matrix rows, which run along z); A lies along the +z edge (it spans columns, along x). */
const B_QUAD = new THREE.PlaneGeometry(STRIP, HM).rotateX(-Math.PI / 2);
const A_QUAD = new THREE.PlaneGeometry(HM, STRIP).rotateX(-Math.PI / 2);
const D_QUAD = new THREE.PlaneGeometry(HM, HM).rotateX(-Math.PI / 2);
const B_BODY = new THREE.BoxGeometry(STRIP + 0.06, 0.03, HM + 0.06);
const A_BODY = new THREE.BoxGeometry(HM + 0.06, 0.03, STRIP + 0.06);
/** Hairline outline of a strip, drawn in ember. */
const outline = (w: number, d: number) =>
  new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-w / 2, 0, -d / 2), new THREE.Vector3(w / 2, 0, -d / 2),
    new THREE.Vector3(w / 2, 0, -d / 2), new THREE.Vector3(w / 2, 0, d / 2),
    new THREE.Vector3(w / 2, 0, d / 2), new THREE.Vector3(-w / 2, 0, d / 2),
    new THREE.Vector3(-w / 2, 0, d / 2), new THREE.Vector3(-w / 2, 0, -d / 2),
  ]);
const B_LINE = outline(STRIP + 0.06, HM + 0.06);
const A_LINE = outline(HM + 0.06, STRIP + 0.06);

/** A thin clear carrier for the factor; the factor itself is light inside it. */
const BODY_MAT = new THREE.MeshPhysicalMaterial({ color: "#3a2a24", metalness: 0, roughness: 0.1, transparent: true, opacity: 0.35, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.05 });
const LINE_MAT = new THREE.LineBasicMaterial({ color: "#ff8a52", transparent: true, opacity: 0.85, toneMapped: false });

/**
 * A rank-16 LoRA adapter on one layer: the B and A factor strips slide out of the plate's edges,
 * and their product ΔW = B·A lights the plate as an additive ember overlay, recomputed every
 * simulated optimiser step (0.25 s).
 */
export default function Adapter({ layer, order, index }: { layer: number; order: number; index: number }) {
  const local = useLocalTime(index);
  const sim = useMemo(() => makeAdapter(layer), [layer]);
  const buf = useMemo(() => ({
    b: new Float32Array(N * RANK), a: new Float32Array(RANK * N), d: new Float32Array(N * N),
    dPx: new Uint8Array(N * N * 4), bPx: new Uint8Array(N * RANK * SUB * 4), aPx: new Uint8Array(N * RANK * SUB * 4),
  }), []);
  const tex = useMemo(() => ({
    d: dataTexture(buf.dPx, N, N),
    b: dataTexture(buf.bPx, RANK * SUB, N),
    a: dataTexture(buf.aPx, N, RANK * SUB),
  }), [buf]);
  useEffect(() => () => { tex.d.dispose(); tex.b.dispose(); tex.a.dispose(); }, [tex]);

  const bGroup = useRef<THREE.Group>(null);
  const aGroup = useRef<THREE.Group>(null);
  const dMat = useRef<THREE.MeshBasicMaterial>(null);
  const last = useRef(-1);

  useFrame(() => {
    const t = local();
    const delay = order * 0.14;
    const e = smooth(EXTRUDE_AT + delay, EXTRUDE_AT + delay + EXTRUDE_FOR, t);
    // strips slide out from under the plate edge and open to full width
    if (bGroup.current) {
      bGroup.current.position.x = HALF + STRIP_GAP + STRIP / 2 - (1 - e) * (STRIP + STRIP_GAP);
      bGroup.current.scale.set(Math.max(0.001, e), 1, 1);
      bGroup.current.visible = e > 0.002;
    }
    if (aGroup.current) {
      aGroup.current.position.z = HALF + STRIP_GAP + STRIP / 2 - (1 - e) * (STRIP + STRIP_GAP);
      aGroup.current.scale.set(1, 1, Math.max(0.001, e));
      aGroup.current.visible = e > 0.002;
    }
    const step = t < TRAIN_AT + delay ? 0 : Math.floor((t - TRAIN_AT - delay) / STEP_SECONDS) + 1;
    if (step !== last.current) {
      last.current = step;
      factorsAt(sim, step, buf.b, buf.a);
      product(buf.b, buf.a, buf.d);
      deltaToRGBA(buf.d, sim.scale, buf.dPx);
      // B starts at exactly zero, so give its strip a fixed scale; A's random init shows from the start
      bToRGBA(buf.b, 0.55, buf.bPx);
      aToRGBA(buf.a, 0.55, buf.aPx);
      touch(tex.d, tex.b, tex.a);
    }
    if (dMat.current) dMat.current.opacity = e;
  });

  const y = layerY(layer);
  return (
    <group position={[0, y, 0]}>
      <mesh geometry={D_QUAD} position={[0, 0.004, 0]} renderOrder={3}>
        <meshBasicMaterial ref={dMat} map={tex.d} color={[2.4, 2.4, 2.4]} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <group ref={bGroup} visible={false}>
        <mesh geometry={B_BODY} material={BODY_MAT} />
        <mesh geometry={B_QUAD} position={[0, 0.017, 0]}>
          <meshBasicMaterial map={tex.b} color={[1.5, 1.5, 1.5]} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
        <lineSegments geometry={B_LINE} material={LINE_MAT} position={[0, 0.018, 0]} />
      </group>
      <group ref={aGroup} visible={false}>
        <mesh geometry={A_BODY} material={BODY_MAT} />
        <mesh geometry={A_QUAD} position={[0, 0.017, 0]}>
          <meshBasicMaterial map={tex.a} color={[1.5, 1.5, 1.5]} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
        <lineSegments geometry={A_LINE} material={LINE_MAT} position={[0, 0.018, 0]} />
      </group>
    </group>
  );
}
