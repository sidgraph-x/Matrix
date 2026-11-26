import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export type Inst = { p: [number, number, number]; r?: [number, number, number]; s?: [number, number, number]; c?: THREE.ColorRepresentation };

const _o = new THREE.Object3D();
const _c = new THREE.Color();

/** Writes a static list of transforms (and optional colours) into an InstancedMesh once. */
export function useInstanced(list: Inst[]) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    list.forEach((it, i) => {
      _o.position.set(...it.p);
      _o.rotation.set(...(it.r ?? [0, 0, 0]));
      _o.scale.set(...(it.s ?? [1, 1, 1]));
      _o.updateMatrix();
      m.setMatrixAt(i, _o.matrix);
      if (it.c !== undefined) m.setColorAt(i, _c.set(it.c));
    });
    m.count = list.length;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [list]);
  return ref;
}

/** Disposes geometries created in useMemo when the component unmounts. */
export function useGeo<T extends THREE.BufferGeometry>(make: () => T, deps: unknown[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geo = useMemo(make, deps);
  useLayoutEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

/** A rounded rectangle path centred on the origin. */
export function roundedRect(path: THREE.Shape | THREE.Path, w: number, h: number, r: number) {
  const x = -w / 2, y = -h / 2;
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y); path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r); path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h); path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r); path.quadraticCurveTo(x, y, x + r, y);
  return path;
}

/** A flat frame (outer rounded rect minus inner rounded rect), extruded upward by `h` with a small chamfer. Base at y = 0. */
export function frameGeometry(ow: number, od: number, iw: number, id: number, h: number, bevel: number, r = 0.08) {
  const s = new THREE.Shape();
  roundedRect(s, ow - 2 * bevel, od - 2 * bevel, r);
  const hole = new THREE.Path();
  roundedRect(hole, iw + 2 * bevel, id + 2 * bevel, r * 0.6);
  s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, { depth: h - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 6 });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, bevel, 0);
  return geo;
}
