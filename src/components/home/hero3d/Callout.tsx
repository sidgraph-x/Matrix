"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import * as THREE from "three";
import { STATION_GAP, useLocalTime } from "./clock";
import type { CalloutDef } from "./types";

/*
 * Callouts are split in two: the anchor dot and leader line live in the 3D scene, and the text lives
 * in a DOM overlay above the canvas (crisp, selectable, no portal roots). Each frame the scene
 * projects every label's end point to the screen and moves the matching DOM element there.
 */

const endOf = (d: CalloutDef): [number, number, number] => {
  const [ox, oy, oz] = d.offset ?? [2, 1.5, 0];
  return [d.anchor[0] + ox, d.anchor[1] + oy, d.anchor[2] + oz];
};
const visibleAt = (d: CalloutDef, t: number) => t >= (d.from ?? 1.2) && t <= (d.to ?? 99);

/** Inside the Canvas, inside the active station's group. */
export function CalloutLines({ defs, index, labels }: { defs: CalloutDef[]; index: number; labels: RefObject<(HTMLDivElement | null)[]> }) {
  const local = useLocalTime(index);
  const lines = useRef<({ material: { opacity: number } } | null)[]>([]);
  const dots = useRef<(THREE.Mesh | null)[]>([]);
  const v = useRef(new THREE.Vector3());

  useFrame(({ camera, size }) => {
    const t = local();
    defs.forEach((d, k) => {
      const on = visibleAt(d, t) ? 1 : 0;
      const dot = dots.current[k];
      if (dot) {
        // constant ~5 px dot regardless of how close the camera gets
        v.current.set(d.anchor[0] + index * STATION_GAP, d.anchor[1], d.anchor[2]);
        dot.scale.setScalar(camera.position.distanceTo(v.current) * 0.0025);
      }
      const ln = lines.current[k];
      if (ln) ln.material.opacity += (on * 0.55 - ln.material.opacity) * 0.08;
      const el = labels.current?.[k];
      if (!el) return;
      const [x, y, z] = endOf(d);
      v.current.set(x + index * STATION_GAP, y, z).project(camera);
      const behind = v.current.z > 1;
      // keep the whole label inside the plate (narrow screens would otherwise clip long labels)
      const w = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
      const left = (d.offset ?? [2, 1.5, 0])[0] < 0;
      let px = ((v.current.x + 1) / 2) * size.width;
      px = left ? Math.min(Math.max(px, w + 6), size.width - 6) : Math.max(Math.min(px, size.width - w - 6), 6);
      el.style.transform = `translate(${px}px, ${((1 - v.current.y) / 2) * size.height}px)`;
      el.style.opacity = String(on && !behind ? 1 : 0);
    });
  });

  return (
    <group>
      {defs.map((d, k) => (
        <group key={k}>
          <Line ref={(r) => { lines.current[k] = r as never; }} points={[d.anchor, endOf(d)]} color="#ede6da" lineWidth={0.8} transparent opacity={0} />
          <mesh ref={(r) => { dots.current[k] = r; }} position={d.anchor}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshBasicMaterial color="#ede6da" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Outside the Canvas: absolutely positioned over it. */
export function CalloutLabels({ defs, labels }: { defs: CalloutDef[]; labels: RefObject<(HTMLDivElement | null)[]> }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {defs.map((d, k) => {
        const left = (d.offset ?? [2, 1.5, 0])[0] < 0;
        return (
          <div
            key={`${d.text}-${k}`}
            ref={(r) => { labels.current[k] = r; }}
            className="absolute left-0 top-0 transition-opacity duration-700 will-change-transform"
            style={{ opacity: 0 }}
          >
            <span
              className={`block w-max max-w-[62vw] -translate-y-1/2 font-mono sm:max-w-none text-[11px] tracking-[.08em] text-night-ink ${left ? "-translate-x-full pr-2" : "pl-2"}`}
              style={{ textShadow: "0 1px 8px #171512, 0 0 2px #171512" }}
            >
              {d.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
