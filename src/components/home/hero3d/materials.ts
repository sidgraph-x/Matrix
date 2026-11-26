import * as THREE from "three";

/*
 * Shared physically based materials. Created once per module and reused, so do not mutate them;
 * clone() first if a station needs a variant. Station-specific materials belong in the station's folder.
 */

export const PALETTE = {
  night: "#171512",
  ink: "#ede6da",
  mute: "#b3a998",
  ember: "#ff6b2c",
  emberDeep: "#b8461b",
  brass: "#d9a55b",
};

export const M = {
  aluminium: new THREE.MeshPhysicalMaterial({ color: "#c9c6c0", metalness: 1, roughness: 0.32, clearcoat: 0.2 }),
  darkMetal: new THREE.MeshPhysicalMaterial({ color: "#3a3632", metalness: 0.9, roughness: 0.45 }),
  gold: new THREE.MeshPhysicalMaterial({ color: "#e3b866", metalness: 1, roughness: 0.22 }),
  copper: new THREE.MeshPhysicalMaterial({ color: "#c47a4a", metalness: 1, roughness: 0.28 }),
  nickel: new THREE.MeshPhysicalMaterial({ color: "#b9b4ab", metalness: 1, roughness: 0.18 }),
  /** Polished silicon: dark, mirror-like, faint thin-film rainbow. */
  silicon: new THREE.MeshPhysicalMaterial({
    color: "#22232b", metalness: 0.55, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05,
    iridescence: 0.6, iridescenceIOR: 1.6,
  }),
  substrate: new THREE.MeshPhysicalMaterial({ color: "#1f2a22", metalness: 0.1, roughness: 0.7 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: "#ffffff", metalness: 0, roughness: 0.05, transmission: 1, thickness: 0.4, ior: 1.5, transparent: true, opacity: 1,
  }),
  paper: new THREE.MeshStandardMaterial({ color: "#f3efe7", roughness: 0.9 }),
  concrete: new THREE.MeshStandardMaterial({ color: "#6d665c", roughness: 0.95 }),
  rock: new THREE.MeshStandardMaterial({ color: "#4a433b", roughness: 1 }),
  ember: new THREE.MeshStandardMaterial({ color: "#ff6b2c", emissive: "#ff6b2c", emissiveIntensity: 2.2, toneMapped: false }),
  brassGlow: new THREE.MeshStandardMaterial({ color: "#d9a55b", emissive: "#d9a55b", emissiveIntensity: 1.6, toneMapped: false }),
  inkGlow: new THREE.MeshStandardMaterial({ color: "#ede6da", emissive: "#ede6da", emissiveIntensity: 1.2, toneMapped: false }),
};

// thin-film thickness for the silicon rainbow, in nm (set after construction)
M.silicon.iridescenceThicknessMinimum = 200;
M.silicon.iridescenceThicknessMaximum = 600;
