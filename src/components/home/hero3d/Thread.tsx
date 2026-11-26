"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { STATION_GAP, useClockRef } from "./clock";
import type { StationDef } from "./types";

/* Carrier colour per station segment: photons, current, operands, updates, weights, preferences. */
const CARRIER = ["#ffd59c", "#ff6b2c", "#d9a55b", "#9fc3ff", "#ff6b2c"];

const vert = /* glsl */ `
  attribute float aT;
  varying float vT;
  void main() { vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const frag = /* glsl */ `
  uniform float uTime; uniform float uReach; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform vec3 uD; uniform vec3 uE;
  varying float vT;
  vec3 carrier(float t) {
    float s = t * 5.0;
    if (s < 1.0) return mix(uA, uB, smoothstep(0.7, 1.0, s));
    if (s < 2.0) return mix(uB, uC, smoothstep(1.7, 2.0, s));
    if (s < 3.0) return mix(uC, uD, smoothstep(2.7, 3.0, s));
    if (s < 4.0) return mix(uD, uE, smoothstep(3.7, 4.0, s));
    return uE;
  }
  void main() {
    if (vT > uReach) discard;
    float pulse = pow(0.5 + 0.5 * sin((vT * 260.0 - uTime * 6.0)), 18.0);
    float head = smoothstep(uReach - 0.02, uReach, vT);
    vec3 c = carrier(vT);
    gl_FragColor = vec4(c * (0.55 + 2.6 * pulse + 3.0 * head), 0.55 + 0.45 * pulse);
  }
`;

export default function Thread({ stations }: { stations: StationDef[] }) {
  const clock = useClockRef();
  const mat = useRef<THREE.ShaderMaterial>(null);
  const reach = useRef(0.1);

  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    stations.forEach((s, i) => s.thread.forEach(([x, y, z]) => pts.push(new THREE.Vector3(x + i * STATION_GAP, y, z))));
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    const g = new THREE.TubeGeometry(curve, 1600, 0.06, 8, false);
    // per-vertex parameter along the curve, so the shader can light the thread up to the active station
    const n = g.attributes.position.count, rings = 1601, perRing = n / rings;
    const t = new Float32Array(n);
    for (let i = 0; i < n; i++) t[i] = Math.floor(i / perRing) / (rings - 1);
    g.setAttribute("aT", new THREE.BufferAttribute(t, 1));
    return g;
  }, [stations]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uReach: { value: 0.1 },
    uA: { value: new THREE.Color(CARRIER[0]) }, uB: { value: new THREE.Color(CARRIER[1]) }, uC: { value: new THREE.Color(CARRIER[2]) },
    uD: { value: new THREE.Color(CARRIER[3]) }, uE: { value: new THREE.Color(CARRIER[4]) },
  }), []);

  useFrame((_, dt) => {
    const goal = clock.current.ch === 4 ? 1 : (clock.current.ch + 0.62) / 5;
    reach.current += (goal - reach.current) * Math.min(1, dt * (clock.current.reduce ? 60 : 1.4));
    if (mat.current) {
      mat.current.uniforms.uTime.value += dt;
      mat.current.uniforms.uReach.value = reach.current;
    }
  });

  return (
    <mesh geometry={geo}>
      <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={uniforms} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  );
}
