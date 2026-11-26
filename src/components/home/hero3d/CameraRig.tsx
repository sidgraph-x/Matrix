"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { chapterTime, FLY_SECONDS, STATION_GAP, useClockRef } from "./clock";
import type { Shot, StationDef } from "./types";

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Where station `def`'s camera should be `lt` seconds into its chapter, in world space. */
function shotAt(def: StationDef, index: number, lt: number, pos: THREE.Vector3, target: THREE.Vector3, narrow = false) {
  const s = narrow ? def.shots.map((x) => ({ ...x, ...x.narrow })) : def.shots;
  let a: Shot = s[0], b: Shot = s[0];
  for (let i = 0; i < s.length; i++) {
    if (s[i].at <= lt) { a = s[i]; b = s[Math.min(i + 1, s.length - 1)]; }
  }
  const span = b.at - a.at;
  const u = span > 0 ? smooth(THREE.MathUtils.clamp((lt - a.at) / span, 0, 1)) : 0;
  const ox = index * STATION_GAP;
  pos.set(ox + THREE.MathUtils.lerp(a.pos[0], b.pos[0], u), THREE.MathUtils.lerp(a.pos[1], b.pos[1], u), THREE.MathUtils.lerp(a.pos[2], b.pos[2], u));
  target.set(ox + THREE.MathUtils.lerp(a.target[0], b.target[0], u), THREE.MathUtils.lerp(a.target[1], b.target[1], u), THREE.MathUtils.lerp(a.target[2], b.target[2], u));
  return THREE.MathUtils.lerp(a.fov ?? 35, b.fov ?? 35, u);
}

export default function CameraRig({ stations }: { stations: StationDef[] }) {
  const get = useThree((s) => s.get);
  const clock = useClockRef();
  const v = useRef({
    ch: -1, start: 0,
    fromPos: new THREE.Vector3(), fromTarget: new THREE.Vector3(), fromFov: 35,
    pos: new THREE.Vector3(), target: new THREE.Vector3(), look: new THREE.Vector3(),
  });

  useEffect(() => {
    const st = v.current;
    const camera = get().camera as THREE.PerspectiveCamera;
    const sz = get().size;
    const fov = shotAt(stations[clock.current.ch], clock.current.ch, 0, st.pos, st.target, sz.width / Math.max(1, sz.height) < 1.4);
    camera.position.copy(st.pos); camera.fov = fov; camera.lookAt(st.target); camera.updateProjectionMatrix();
    st.look.copy(st.target);
  }, [get, stations, clock]);

  useFrame((state) => {
    const camera = state.camera as THREE.PerspectiveCamera;
    const st = v.current;
    const { ch, since, reduce, pin } = clock.current;
    if (st.ch !== ch) {
      st.fromPos.copy(camera.position); st.fromTarget.copy(st.look); st.fromFov = camera.fov;
      st.start = since || performance.now(); st.ch = ch;
    }
    const lt = Math.max(0, chapterTime(clock.current));
    const narrow = state.size.width / Math.max(1, state.size.height) < 1.4;
    const fov = shotAt(stations[ch], ch, lt, st.pos, st.target, narrow);
    const u = reduce || pin !== undefined ? 1 : THREE.MathUtils.clamp((performance.now() - st.start) / 1000 / FLY_SECONDS, 0, 1);
    if (u < 1) {
      const e = ease(u), lift = Math.sin(Math.PI * u);
      camera.position.lerpVectors(st.fromPos, st.pos, e);
      camera.position.y += lift * 4; camera.position.z += lift * 8;
      st.look.lerpVectors(st.fromTarget, st.target, e);
      camera.fov = THREE.MathUtils.lerp(st.fromFov, fov, e);
    } else {
      camera.position.copy(st.pos); st.look.copy(st.target); camera.fov = fov;
    }
    // keep the horizontal field of view on narrow plates (phones), so stations framed for ~2.4:1 stay in frame
    const aspect = state.size.width / Math.max(1, state.size.height);
    if (aspect < 2.4) camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * (2.4 / aspect)));
    camera.lookAt(st.look);
    camera.updateProjectionMatrix();
  });

  return null;
}
