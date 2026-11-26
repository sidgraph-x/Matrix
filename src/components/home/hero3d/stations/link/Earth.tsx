"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Quality } from "../../types";
import { atmoFrag, atmoVert, earthFrag, earthVert } from "./earthTexture";
import { NODES, R, SUN } from "./geo";

/** The planet surface, in the body frame (the parent spins it). */
export function EarthSurface({ quality, time }: { quality: Quality; time: () => number }) {
  const hi = quality === "high";
  const geo = useMemo(() => new THREE.SphereGeometry(R, hi ? 256 : 160, hi ? 128 : 80), [hi]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: earthVert,
        fragmentShader: earthFrag,
        defines: hi
          ? { OCT_LAND: 9, OCT_RIDGE: 4, OCT_GRAIN: 3, OCT_CLOUD: 7 }
          : { OCT_LAND: 6, OCT_RIDGE: 2, OCT_GRAIN: 1, OCT_CLOUD: 5 },
        uniforms: { uSun: { value: SUN.clone() }, uTime: { value: 0 }, uNodes: { value: NODES.map((n) => n.clone()) } },
      }),
    [hi],
  );
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) (ref.current.material as THREE.ShaderMaterial).uniforms.uTime.value = time();
  });
  return <mesh ref={ref} geometry={geo} material={mat} />;
}

/** The atmosphere shell, additive, in any frame centred on the planet. */
export function Atmosphere({ quality }: { quality: Quality }) {
  const ra = R * 1.045;
  const hi = quality === "high";
  const geo = useMemo(() => new THREE.SphereGeometry(ra, hi ? 192 : 96, hi ? 96 : 48), [ra, hi]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmoVert,
        fragmentShader: atmoFrag,
        uniforms: { uSun: { value: SUN.clone() }, uR: { value: R }, uRa: { value: ra } },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [ra],
  );
  return <mesh geometry={geo} material={mat} renderOrder={2} />;
}
