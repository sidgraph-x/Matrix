"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { HM, layerY } from "./layout";
import { N, dataTexture, layerWeights, weightsToRGBA } from "./weights";

/** Shared, so every heatmap is one quad lying in the plate's plane: u runs +x (input dims), v runs -z (output dims). */
const QUAD = new THREE.PlaneGeometry(HM, HM).rotateX(-Math.PI / 2);

/**
 * One frozen layer's weight matrix, drawn on a thin inner plane inside its glass plate.
 * The glass itself is instanced in Tower; this is only the matrix.
 */
export default function LayerPlate({ layer, dim = 1 }: { layer: number; dim?: number }) {
  const tex = useMemo(() => dataTexture(weightsToRGBA(layerWeights(layer)), N, N), [layer]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh geometry={QUAD} position={[0, layerY(layer), 0]} renderOrder={2}>
      <meshBasicMaterial
        map={tex}
        color={new THREE.Color(1.05 * dim, 1.05 * dim, 1.05 * dim)}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}
