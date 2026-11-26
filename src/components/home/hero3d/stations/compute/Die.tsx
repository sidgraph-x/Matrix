"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Quality } from "../../types";
import { useGeo } from "./helpers";
import { DIE, Y } from "./layout";
import { CM } from "./mats";
import { useDieSideTexture, useDieTextures } from "./textures";

/*
 * The logic die: a reticle-sized slab of polished silicon. Its top carries the floorplan
 * (12 x 10 compute tiles, each an SRAM bank beside a MAC array, a NoC mesh, HBM PHYs on both long edges,
 * SerDes on the short edges). Roughness, bump and thin-film thickness all vary per block,
 * so reflections break up the way they do on a real die shot.
 */
export default function Die({ quality }: { quality: Quality }) {
  const t = useDieTextures(quality);
  const top = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: t.color, roughnessMap: t.rough, roughness: 1, bumpMap: t.bump, bumpScale: 0.6,
        metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.035,
        iridescence: 0.75, iridescenceIOR: 1.55, iridescenceThicknessMap: t.irid, iridescenceThicknessMinimum: 180, iridescenceThicknessMaximum: 620,
        specularIntensity: 1, envMapIntensity: 1.1,
      }),
    [t],
  );
  const box = useGeo(() => new THREE.BoxGeometry(DIE.w, DIE.h, DIE.d), []);
  const sideMap = useDieSideTexture();
  const side = useMemo(() => new THREE.MeshPhysicalMaterial({ map: sideMap, metalness: 0.5, roughness: 0.46 }), [sideMap]);
  const mats = useMemo(() => [side, side, top, CM.siliconEdge, side, side], [top, side]);
  return <mesh geometry={box} material={mats} position={[0, Y.dieBottom + DIE.h / 2, 0]} />;
}
