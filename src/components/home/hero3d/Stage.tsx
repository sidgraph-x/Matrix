"use client";

import { AdaptiveDpr, Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import CameraRig from "./CameraRig";
import { CalloutLabels, CalloutLines } from "./Callout";
import { ClockProvider, STATION_GAP } from "./clock";
import { STATIONS } from "./stations";
import Thread from "./Thread";
import type { Quality } from "./types";

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/** A far shell of stars, deterministic, spanning the whole run of stations. */
function Stars({ count }: { count: number }) {
  const geo = useMemo(() => {
    const r = rng(7), p = new Float32Array(count * 3), c = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = r() * (STATION_GAP * 6) - STATION_GAP;
      p[i * 3 + 1] = r() * 70 - 12;
      p[i * 3 + 2] = -60 - r() * 60;
      const k = 0.35 + r() * 0.65, warm = r() < 0.2;
      c[i * 3] = k; c[i * 3 + 1] = k * (warm ? 0.82 : 0.95); c[i * 3 + 2] = k * (warm ? 0.62 : 0.9);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    return g;
  }, [count]);
  return (
    <points geometry={geo}>
      <pointsMaterial size={0.22} sizeAttenuation vertexColors transparent opacity={0.85} depthWrite={false} toneMapped={false} />
    </points>
  );
}

export default function Stage({ ch, reduce, low, running, pin }: { ch: number; reduce: boolean; low: boolean; running: boolean; pin?: number }) {
  const [declined, setDeclined] = useState(false);
  const quality: Quality = low || declined ? "low" : "high";
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const callouts = STATIONS[ch].callouts.slice(0, low ? 2 : 4);

  return (
    <div className="absolute inset-0">
    <Canvas
      frameloop={running ? "always" : "never"}
      dpr={low ? 1 : [1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
      camera={{ fov: 35, near: 0.1, far: 400, position: [0, 6, 22] }}
      onCreated={({ scene, gl }) => {
        scene.background = new THREE.Color("#171512");
        // neighbours sit 40 units away; fade them so they frame the shot instead of competing with it
        scene.fog = new THREE.Fog("#171512", 38, 95);
        // the glass refraction pass redraws every opaque object; half resolution keeps it affordable
        gl.transmissionResolutionScale = 0.5;
      }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => setDeclined(true)} />
      <AdaptiveDpr pixelated={false} />
      <ClockProvider ch={ch} reduce={reduce} pin={pin}>
        {/* in-scene light panels give metals and glass something to reflect; nothing is downloaded */}
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={2.2} color="#fff1dc" position={[0, 8, 6]} scale={[14, 5, 1]} rotation-x={Math.PI / 2.4} />
          <Lightformer form="rect" intensity={1.4} color="#ff9a57" position={[-10, 2, -4]} scale={[6, 10, 1]} rotation-y={Math.PI / 2} />
          <Lightformer form="rect" intensity={0.9} color="#9fb4ff" position={[10, 3, -2]} scale={[6, 8, 1]} rotation-y={-Math.PI / 2} />
          <Lightformer form="ring" intensity={1.2} color="#ffffff" position={[0, 4, -10]} scale={6} />
        </Environment>
        <ambientLight intensity={0.12} />
        {/* key from upper left, warm; rim from behind right, cool */}
        <directionalLight position={[-8, 14, 10]} intensity={2.4} color="#fff0dc" />
        <directionalLight position={[10, 6, -12]} intensity={1.2} color="#9fb4ff" />
        <hemisphereLight args={["#ffe9d2", "#1a1612", 0.35]} />

        <Stars count={quality === "high" ? 2600 : 1100} />
        <Thread stations={STATIONS} />

        {STATIONS.map((s, i) => {
          const near = Math.abs(i - ch) <= 1;
          return (
            <group key={s.id} position={[i * STATION_GAP, 0, 0]} visible={near}>
              {near && <s.Component index={i} active={i === ch} quality={quality} />}
              {i === ch && <CalloutLines key={ch} defs={callouts} index={i} labels={labels} />}
            </group>
          );
        })}

        <CameraRig stations={STATIONS} />
      </ClockProvider>

      {quality === "high" && (
        <EffectComposer multisampling={4}>
          <Bloom intensity={0.9} luminanceThreshold={0.85} luminanceSmoothing={0.2} mipmapBlur />
          <Vignette offset={0.25} darkness={0.75} />
        </EffectComposer>
      )}
    </Canvas>
    <CalloutLabels key={ch} defs={callouts} labels={labels} />
    </div>
  );
}
