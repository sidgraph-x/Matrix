import * as THREE from "three";

/*
 * Energy-station materials. Module-level singletons, never mutated after creation
 * (per-frame changes go through refs on station-owned ShaderMaterials only).
 */
export const EM = {
  /** Container and cabinet paint: off-white industrial enamel. */
  paintWhite: new THREE.MeshPhysicalMaterial({ color: "#d9d5cc", metalness: 0.25, roughness: 0.48, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
  paintGrey: new THREE.MeshPhysicalMaterial({ color: "#9a9d9a", metalness: 0.3, roughness: 0.5, clearcoat: 0.25 }),
  /** Wellhead valve bodies: blue-grey oilfield paint. */
  paintValve: new THREE.MeshPhysicalMaterial({ color: "#56646b", metalness: 0.35, roughness: 0.42, clearcoat: 0.4 }),
  galv: new THREE.MeshStandardMaterial({ color: "#a3a6a4", metalness: 0.85, roughness: 0.42 }),
  steelDark: new THREE.MeshStandardMaterial({ color: "#43423f", metalness: 0.8, roughness: 0.5 }),
  stainless: new THREE.MeshPhysicalMaterial({ color: "#c3c4c2", metalness: 1, roughness: 0.22 }),
  zinc: new THREE.MeshStandardMaterial({ color: "#d6d4ce", metalness: 1, roughness: 0.3 }),
  rubber: new THREE.MeshStandardMaterial({ color: "#191817", metalness: 0, roughness: 0.85 }),
  cable: new THREE.MeshStandardMaterial({ color: "#1d1c1b", metalness: 0.05, roughness: 0.55 }),
  concrete: new THREE.MeshStandardMaterial({ color: "#8a857c", metalness: 0, roughness: 0.92 }),
  floor: new THREE.MeshStandardMaterial({ color: "#4b4741", metalness: 0.4, roughness: 0.7 }),
  insulator: new THREE.MeshStandardMaterial({ color: "#b49a6c", metalness: 0, roughness: 0.55 }),
  rackBlack: new THREE.MeshStandardMaterial({ color: "#2a2b2d", metalness: 0.6, roughness: 0.55 }),
  frameAlu: new THREE.MeshStandardMaterial({ color: "#c8c9c9", metalness: 1, roughness: 0.28 }),
  copperBar: new THREE.MeshPhysicalMaterial({ color: "#c97b4b", metalness: 1, roughness: 0.25, clearcoat: 0.3 }),
  tileGrey: new THREE.MeshStandardMaterial({ color: "#6b6a68", metalness: 0.7, roughness: 0.45 }),
  ledGreen: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 2.2, 1.0), toneMapped: false }),
  lightStrip: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.3, 2.1), toneMapped: false }),
  /** Instanced glowing particles: colour comes from instanceColor, scaled above 1 for bloom. */
  glow: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.6, 2.6), toneMapped: false }),
};
