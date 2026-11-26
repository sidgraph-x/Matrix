"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { BLOCK, sectionTextures, topTexture } from "./textures";

/**
 * The cut-away terrain slab: 24 × 7 × 14 with its top at y = 0. The front (+z) and right (+x) faces are
 * geological sections (strata, fault, isotherms, depth ruler); the top is matte ground with roads and pads.
 */
export default function TerrainBlock({ quality }: { quality: "high" | "low" }) {
  const mats = useMemo(() => {
    const sec = sectionTextures();
    const top = topTexture();
    const section = (map: THREE.Texture) =>
      new THREE.MeshStandardMaterial({ map, bumpMap: map, bumpScale: 1.2, roughness: 0.93, metalness: 0 });
    const rock = new THREE.MeshStandardMaterial({ color: "#2a241f", roughness: 1 });
    const ground = new THREE.MeshStandardMaterial({ map: top, bumpMap: top, bumpScale: 1.6, roughness: 0.97, metalness: 0 });
    // BoxGeometry material order: +x, -x, +y, -y, +z, -z
    return [section(sec.right), rock, ground, rock, section(sec.front), rock];
  }, []);
  useEffect(() => () => mats.forEach((m) => { m.map?.dispose(); m.dispose(); }), [mats]);

  const lipGeo = useMemo(() => new THREE.BoxGeometry(BLOCK.w + 0.04, 0.05, BLOCK.d + 0.04), []);

  return (
    <group>
      <mesh position={[0, -BLOCK.h / 2, 0]} material={mats}>
        <boxGeometry args={[BLOCK.w, BLOCK.h, BLOCK.d, 1, 1, 1]} />
      </mesh>
      {/* slightly proud topsoil lip catches the key light along the section edges */}
      <mesh geometry={lipGeo} position={[0, -0.03, 0]}>
        <meshStandardMaterial color="#3b3026" roughness={1} />
      </mesh>
      {quality === "high" && (
        <mesh position={[0, -BLOCK.h - 0.06, 0]}>
          <boxGeometry args={[BLOCK.w - 0.3, 0.12, BLOCK.d - 0.3]} />
          <meshStandardMaterial color="#120f0d" roughness={1} />
        </mesh>
      )}
    </group>
  );
}
