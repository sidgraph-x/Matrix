import * as THREE from "three";

/* Station-specific materials for compute. Shared M.* materials are reused directly and never mutated. */

export const CM = {
  /** SAC305 solder: tin-silver, bright but not mirror. */
  solder: new THREE.MeshPhysicalMaterial({ color: "#c9c9c3", metalness: 1, roughness: 0.3 }),
  /** MLCC ceramic body. */
  ceramic: new THREE.MeshPhysicalMaterial({ color: "#a48c68", metalness: 0, roughness: 0.55, clearcoat: 0.15 }),
  /** Nickel-tin termination. */
  termination: new THREE.MeshPhysicalMaterial({ color: "#d4d3cd", metalness: 1, roughness: 0.26 }),
  /** Laminate core seen at the substrate edge. */
  core: new THREE.MeshPhysicalMaterial({ color: "#8a7a55", metalness: 0, roughness: 0.75 }),
  /** Substrate edge and underside: solder mask. */
  mask: new THREE.MeshPhysicalMaterial({ color: "#18241c", metalness: 0, roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
  /** Brushed stainless stiffener ring. */
  stainless: new THREE.MeshPhysicalMaterial({ color: "#9a978f", metalness: 1, roughness: 0.34, anisotropy: 0.7 }),
  /** Diced silicon edge: matte grey. */
  siliconEdge: new THREE.MeshPhysicalMaterial({ color: "#45474d", metalness: 0.5, roughness: 0.52 }),
  /** Cross-section face of the cut HBM stack: lapped silicon, lighter and flatter. */
  hbmSection: new THREE.MeshPhysicalMaterial({ color: "#ffffff", metalness: 0.35, roughness: 0.4 }),
  /** Non-conductive film between stacked dies. */
  underfill: new THREE.MeshPhysicalMaterial({ color: "#121216", metalness: 0, roughness: 0.7 }),
  /** Polycarbonate manifold window. */
  window: new THREE.MeshPhysicalMaterial({
    color: "#d6e6ec", metalness: 0, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02,
    transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide,
  }),
  /** Nickel-plated brass barbs. */
  brass: new THREE.MeshPhysicalMaterial({ color: "#c7a66a", metalness: 1, roughness: 0.24 }),
  /** Black-oxide socket-head screws. */
  blackOxide: new THREE.MeshPhysicalMaterial({ color: "#26262a", metalness: 0.8, roughness: 0.38 }),
  /** SRAM macros feeding the array: the bluish, mirror-smooth blocks of a die shot. */
  sram: new THREE.MeshPhysicalMaterial({
    color: "#4a5478", metalness: 0.7, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.04,
    iridescence: 0.8, iridescenceIOR: 1.6, iridescenceThicknessMinimum: 300, iridescenceThicknessMaximum: 520,
  }),
  /** Processing-element blocks in the systolic inset. */
  pe: new THREE.MeshPhysicalMaterial({ color: "#3a3b42", metalness: 0.6, roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.1 }),
};
