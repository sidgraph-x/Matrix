# Hero 3D panorama: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the SVG hero panorama with one WebGL world of five detailed, physically lit stations that follow one joule from sunlight to taste.

**Architecture:** `Hero3D` (DOM plate, chapter state) lazy-loads `Stage` (R3F Canvas). `Stage` renders lights, stars, the joule `Thread`, the stations (each a self-contained folder exporting a `StationDef`), callout lines and the `CameraRig`. Labels and readouts are DOM overlays. Spec: `docs/superpowers/specs/2026-11-26-hero-3d-panorama-design.md`.

**Tech Stack:** Next.js 16, React 19, three 0.187, @react-three/fiber 9.8, @react-three/drei 10.7, @react-three/postprocessing 3.2, Tailwind v4.

**Repo rules:** commit only when the user asks (no commit steps here). Never download models, textures or HDRIs; everything is procedural. No new npm packages beyond the ones above.

**Verification for this codebase:** there is no unit-test runner. Every task verifies with type-check, lint, and headless WebGL screenshots that a human (the controller) reviews:

```bash
# type-check, filtered to your files
cd /Users/sidgraph/Matrix && npx tsc --noEmit -p . 2>&1 | grep "hero3d/stations/<id>" ; echo "tsc done"
# lint your folder
npx eslint src/components/home/hero3d/stations/<id>
# screenshots: chapter N (1-5) held still; WAIT ms before the first shot; steps separated by |
S=/private/tmp/claude-501/-Users-sidgraph-Matrix/9c34605c-9e65-439f-9024-0fc182440366/scratchpad
WAIT=9000 node $S/shoot3d.mjs "http://localhost:3000/?ch=N&hold=1" $S/<id>-a 1920 1080 "js:window.scrollTo(0,560)"
# animated beats: no hold, shots ~2.5 s apart
WAIT=3000 node $S/shoot3d.mjs "http://localhost:3000/?ch=N" $S/<id>-b 1920 1080 "js:window.scrollTo(0,560)|js:0|js:0"
# phone
WAIT=9000 node $S/shoot3d.mjs "http://localhost:3000/?ch=N&hold=1" $S/<id>-m 390 844 "js:window.scrollTo(0,520)"
```

The dev server is already running on :3000 with hot reload. Do not run `next build` (several agents share the folder). `shoot3d.mjs` prints console errors and warnings; `THREE.Clock … deprecated` comes from R3F and is expected.

---

## File structure

```
src/components/home/hero3d/
  types.ts        StationDef / StationProps / Shot / CalloutDef / Quality    (done)
  clock.tsx       STATION_GAP=40, CHAPTER_SECONDS=9, FLY_SECONDS=2.2, ClockProvider, useLocalTime(index)   (done)
  story.ts        chapter copy, numbers, sources, readout data   (done)
  materials.ts    shared PBR materials M.*, PALETTE   (done; read-only for station tasks)
  CameraRig.tsx   flies between stations, plays each station's shots   (done)
  Thread.tsx      joule thread through every station's `thread` waypoints   (done)
  Callout.tsx     3D leader lines + DOM labels   (done)
  Readout.tsx     DOM chart for the chapter number   (done)
  Stage.tsx       Canvas, lights, Environment light panels, stars, stations, post-processing   (done)
  Hero3D.tsx      DOM plate, chapter state, ?ch=N&hold=1, fallback stills   (done)
  stations/index.ts            registry   (done)
  stations/energy/…            Task 2
  stations/compute/…           Task 3
  stations/link/…              Task 4
  stations/intelligence/…      Task 5
  stations/taste/…             Task 6
public/hero/ch1..5.webp        Task 7
```

## The station contract (all station tasks)

Each station folder's `index.tsx` must export `station: StationDef`. Read `types.ts`, `clock.tsx` and `materials.ts` first.

```ts
export const station: StationDef = {
  id: "compute",
  Component: ComputeStation,           // ({ index, active, quality }: StationProps) => JSX
  shots: [ { pos, target, at: 0, fov? }, { pos, target, at: 3.5 }, … ],  // station-local, sorted by `at` (seconds into the chapter, chapter is 9 s)
  callouts: [ { anchor, text, offset?, from?, to? } ],                    // ≤ 4; station-local; text is lowercase mono with " · " separators
  thread: [ [-16, y, z], …, [16, y, z] ],                                  // station-local; first x ≈ -16, last x ≈ +16 so neighbours join up
};
```

- **Coordinates:** the station is rendered inside a group at `x = index * 40`. Keep geometry within x ∈ [-15, 15], y ∈ [-9, 11], z ∈ [-14, 10] so neighbours don't collide. +y is up and the camera looks roughly toward -z.
- **Time:** `const local = useLocalTime(index)`, then inside `useFrame` call `const t = local()`. It is 0 when inactive, seconds since the chapter began when active, and fixed at 4 under reduced motion. Draw the "mechanism visible" state at t = 4. Neighbouring stations are mounted (visible, dimmer in fog) with `active=false`; keep them in a sensible resting state.
- **Quality:** when `quality === "low"`, roughly halve instance and point counts and skip expensive materials (transmission). Budget per station, high quality: ≤ 150 draw calls, ≤ 400k triangles. Use `InstancedMesh` (drei `<Instances>` or raw) for repeated parts.
- **Materials:** reuse `M.*` from `materials.ts`; never mutate them. Make station-specific materials in your own folder. Emissive "glow" materials should set `toneMapped={false}` and emissive intensity > 1 so bloom picks them up.
- **Textures:** generate them with `THREE.CanvasTexture` / `THREE.DataTexture` inside `useMemo`, with deterministic seeded randomness (copy the `rng` from `Stage.tsx`). Canvas text fonts: read `getComputedStyle(document.documentElement).getPropertyValue("--font-newsreader")` (serif), `--font-geist` (sans) and `--font-geist-mono` (mono).
- **Framing:** the plate is wide (about 2.6:1 on desktop). Keep the hero object centre-left to centre. The top-right 340×260 px is covered by the readout panel, so keep callout labels out of it, and out of the bottom 40 px.
- **Look:** realistic, technical and precise, never toy-like. Real proportions and real part counts, bevelled edges (drei `RoundedBox` or chamfered extrusions), micro-detail at the scale the camera reaches, material variety (anodised, brushed, polished, matte), and no flat untextured boxes in the hero object. Ember `#ff6b2c` is reserved for energy and data flow. Background is `#171512`.
- **Ownership:** edit only files inside your station folder. If you need a change to a shared file, stop and report it instead of editing it.

---

### Task 1: Foundation — DONE (controller)

- [x] Install three, @react-three/fiber, drei, postprocessing, @types/three
- [x] Contracts, clock, story, materials, CameraRig, Thread, Callout (DOM labels), Readout, Stage, Hero3D, placeholder stations, registry
- [x] `src/app/page.tsx` renders `<Hero3D />` in place of `<HeroMotion />`
- [x] tsc and eslint clean; chapter 2 placeholder renders under SwiftShader with thread, readout and callout

### Task 2: Energy station (chapter 1)

**Files:** `src/components/home/hero3d/stations/energy/{index,TerrainBlock,TandemPV,Geothermal,Storage,Tokamak}.tsx` (+ helpers in the folder).

- [ ] **Terrain block (`TerrainBlock.tsx`):** a slab about 24 × 7 × 14 (x × y × z) with its top at y = 0. Two visible section faces (front and right). A section-face shader or canvas texture shows 5–6 rock strata with irregular boundaries, plus temperature bands shading from cool at the top to warm ember-brown at depth. Isotherm lines labelled "100 °C", "150 °C" and "200 °C" are drawn into the texture. The top surface is terrain: matte, with a subtle noise normal or roughness.
- [ ] **Geothermal (`Geothermal.tsx`):** on the front face, an injection well and a production well (thin steel tubes with casing steps) drop from wellheads (small valve "christmas trees" at the surface) to about y = -6. Horizontal laterals of about 6 units run between them. Between the laterals, a fracture network of branching thin planes or lines, 30–60 segments, seeded. Particles: brass going down the injection well and through the fractures, ember coming up the production well. They run when active.
- [ ] **Tandem PV (`TandemPV.tsx`):** 4–6 rows of single-axis trackers on the top surface. Each row is a torque tube on piles carrying instanced modules: dark blue-black glass with a cell grid texture, silver busbars and an aluminium frame. Rows tilt together as a slow function of t (morning to noon). Above the field float an **exploded tandem stack** of six thin layers, labelled in the texture or by callout: glass, ITO, perovskite 1.68 eV, recombination, silicon 1.12 eV, back contact. Photon rays fall on the stack: short blue lines stop at the perovskite layer and red lines pass to the silicon layer, as an animated loop.
- [ ] **Storage (`Storage.tsx`):** a 20 ft battery container (ribbed walls, door seals and hinges) with one long wall cut away. Inside are rack frames with instanced battery modules and small status LEDs. Beside it is a silicon-carbide inverter skid: a cabinet with vents, a busbar, and a heatsink with fins. A DC bus (copper bars or cable tray) runs from the skid toward the thread.
- [ ] **Tokamak (`Tokamak.tsx`):** behind the block (z ≈ -11, y raised so it reads on the horizon). A vacuum vessel torus (major radius about 3.2, minor about 1.3, slightly D-shaped cross-section) with a 90° cut-away. Around it, 18 instanced D-shaped toroidal field coils (extruded D profile, copper and steel), a central solenoid and a cryostat ring. Inside, a plasma torus with an emissive pink-orange shader with drifting noise (turbulent eddies), bloom-friendly.
- [ ] **index.tsx:** compose the parts. Shots: t = 0 wide establishing shot of the whole block, PV and tokamak; t ≈ 3.2 push in toward the tandem stack; t ≈ 6.2 drop and turn toward the front section face (geothermal). Callouts (≤ 4): `tandem cell · perovskite on silicon · >34% lab`, `egs doublet · ~3.5 km · >200 °C`, `sic power stage · dc bus`, `tokamak · research`. Thread waypoints enter at x = -16 from the sky toward the PV field (photons), run through the storage and inverter, and leave at x = 16.
- [ ] **Verify:** tsc (filtered) and eslint clean. Screenshots at ch=1 (held), three animated beats, and phone. Fix anything that looks toy-like before reporting.
- [ ] **Report:** files created, what each beat shows, screenshot paths, and any shared-file change you need.

### Task 3: Compute station (chapter 2)

**Files:** `src/components/home/hero3d/stations/compute/{index,Package,Die,HBM,ColdPlate,SystolicArray,textures}.tsx` (+ helpers).

- [ ] **Package (`Package.tsx`):** organic substrate about 10 × 0.35 × 8, dark green-black (`M.substrate`), with an instanced BGA ball grid underneath (gold or tin, ≥ 600 balls on high quality), instanced decoupling capacitors (tiny beige-and-silver boxes) around the edge, and a fine trace texture. Above it, the silicon interposer: slightly reflective grey, about 7.2 × 0.15 × 5.2.
- [ ] **Die (`Die.tsx` + `textures.tsx`):** one large logic die (about 3.6 × 0.12 × 4.4) in `M.silicon`, with a procedural floorplan texture at 2048 px on high quality and 1024 on low. It shows a grid of about 12 × 10 compute tiles, each with a darker SRAM-bank strip and a lighter MAC array, a NoC mesh of thin lines between tiles, and HBM PHY blocks along both long edges. Add a subtle normal or roughness variation per block so reflections break up realistically.
- [ ] **HBM (`HBM.tsx`):** four HBM stacks (two per long side of the die), each 12 stacked dies plus a base die, about 1.1 × 0.72 × 1.0 overall. Each layer is a separate thin slab with a hairline gap. One stack is cut in half (front face open) to show its 12 layers and vertical TSV columns (instanced thin copper cylinders).
- [ ] **Cold plate (`ColdPlate.tsx`):** nickel-plated copper plate (`M.nickel`) with inlet and outlet barbs. Its underside has instanced microchannel fins (≥ 60). Coolant particles (cool blue-white, small) flow inlet → channels → outlet while active.
- [ ] **Exploded view:** a function of t. Assembled at 0–1.5 s. From 1.5 to 3.5 s the layers separate vertically: substrate 0, interposer +1.2, die and HBM +2.4, cold plate +4.4. They stay exploded after that. Under reduced motion (t fixed at 4) it shows exploded.
- [ ] **Systolic array (`SystolicArray.tsx`):** near the die surface (the camera dives here at about 6 s), an 8 × 8 grid of instanced processing-element cells (small bevelled blocks, each with a tiny register cap). Diagonal waves of emission: activations flow +x (ember) and partial sums flow -z (brass), with timing based on (row + col).
- [ ] **index.tsx:** shots: t = 0 three-quarter orbit view of the assembled package; t ≈ 3.5 exploded view, slightly higher; t ≈ 6.2 close dive to the die surface and systolic array. Callouts: `hbm · 12-high stack`, `tsv · through-silicon vias`, `on-chip sram · operands stay here`, `cold plate · microchannels`. Thread waypoints come in at x = -16 at substrate level, rise into the die area and exit at x = 16.
- [ ] **Verify and report** as in Task 2, with ch=2.

### Task 4: Link station (chapter 3)

**Files:** `src/components/home/hero3d/stations/link/{index,Earth,Constellation,GroundNodes,Packets,earthTexture}.tsx` (+ helpers).

- [ ] **Earth (`Earth.tsx`, `earthTexture.tsx`):** a large sphere (radius about 12) centred around y = -14 so its limb arcs across the frame. Custom shader: a procedural land mask (fBm noise thresholded, with coast falloff), oceans dark blue-teal with specular, land in muted earth tones, a terminator so about 40% is night side, a city-lights mask on night-side land (warm points, clustered along coasts), cloud wisps (a second noise layer), and a Fresnel atmosphere shell (a separate slightly larger sphere, additive, blue-white at the limb). It rotates slowly.
- [ ] **Constellation (`Constellation.tsx`):** a Walker-style layout, 12 orbital planes × 20 satellites at radius 12 × (6921 / 6371) ≈ 13.04, inclined 53°. Satellites are instanced, each a bus box plus two solar wings (dark blue cells and a silver frame), oriented along velocity, and they orbit. Thin orbit rings are drawn faintly. Laser inter-satellite links are thin lines from each satellite to its in-plane neighbour and one cross-plane neighbour, updated per frame (`LineSegments` with a dynamic buffer).
- [ ] **Ground Nodes (`GroundNodes.tsx`):** four Nodes on the visible limb: small container-like hardware with a flat phased-array terminal (square panel with a fine element grid), placed with surface normals. Fiber arcs: glowing ember great-circle arcs just above the surface between two Node pairs, with small repeater ticks every few degrees.
- [ ] **Packets (`Packets.tsx`):** instanced small glowing tetrahedra or diamonds labelled Δw by callout. They rise from Nodes to the nearest satellite, hop along links to an aggregation satellite (which brightens), then a merged packet returns to every Node. This loops while active.
- [ ] **index.tsx:** shots: t = 0 low wide view along the limb with the constellation sweeping overhead; t ≈ 3.4 tilt up to follow packets into orbit; t ≈ 6.4 pull back for the whole network. Callouts: `leo shell · 550 km`, `laser inter-satellite link`, `fiber · ~5 µs/km`, `only encrypted Δw leaves a node`. Thread waypoints run along just above the limb from x = -16 to x = 16.
- [ ] **Verify and report** as in Task 2, with ch=3.

### Task 5: Intelligence station (chapter 4)

**Files:** `src/components/home/hero3d/stations/intelligence/{index,Tower,LayerPlate,Adapter,MemoryRibbon,weights}.tsx` (+ helpers).

- [ ] **Tower (`Tower.tsx`):** 24 layer plates about 7 × 0.08 × 7, stacked with a 0.32 gap (about 7.7 tall) and seated on a machined dark-metal plinth. On high quality, plates are glass (`MeshPhysicalMaterial` with transmission). On low, they are semi-transparent standard material. Plate edges get a thin bright rim line.
- [ ] **Weights (`weights.tsx`):** each plate carries a `DataTexture` of its frozen weight matrix: 128 × 128 greyscale with structured patterns (banded rows and columns, a few outlier stripes, seeded noise), so it reads as real weights rather than random static. It is shown on a thin inner plane inside the glass.
- [ ] **Adapter (`Adapter.tsx`):** on 6 chosen layers (for example 4, 8, 12, 16, 20, 23), two thin ember strips extrude from the plate: B along one edge (tall-thin, 128 × 16) and A along the perpendicular edge (16 × 128), each with its own small DataTexture. Their outer product ΔW = B·A is shown as an additive ember overlay on the plate (a 128 × 128 DataTexture recomputed every 0.25 s as B and A drift by a simulated gradient step). The rank-16 structure should be visible as a low-rank pattern.
- [ ] **Memory ribbon (`MemoryRibbon.tsx`):** a helical ribbon (tube or flat strip) of about 40 small record plates (paper-white with a tiny text texture such as "14:02 · kept tone", "09:47 · rejected outline") winding from outside into the tower, advancing along the helix over t.
- [ ] **index.tsx:** shots: t = 0 low three-quarter view of the full tower; t ≈ 3.4 rise to an adapter layer close-up showing B, A and ΔW; t ≈ 6.4 orbit slightly to show the memory ribbon entering. Callouts: `base model · frozen · shared`, `your adapter · rank 16 · 0.8% of weights`, `ΔW = B·A`, `memory · stays on your node`. Thread waypoints come in at x = -16, spiral once around the tower base and exit at x = 16.
- [ ] **Verify and report** as in Task 2, with ch=4.

### Task 6: Taste station (chapter 5)

**Files:** `src/components/home/hero3d/stations/taste/{index,DraftSheet,draftTexture,StyleGalaxy,PreferencePairs}.tsx` (+ helpers).

- [ ] **Draft sheet (`DraftSheet.tsx`, `draftTexture.tsx`):** an A4-proportion paper sheet (about 4.2 × 5.9), slightly curled (a bent plane geometry or a vertex shader), lit and matte, casting a soft contact shadow. The texture is a CanvasTexture at 2048 px high quality, 1024 low, of a typeset draft in Newsreader. It has a title line, 3 paragraphs of original copy about building a personal machine (no lorem ipsum), and tracked changes: some words struck through in ink with ember insertions above them, and two margin notes in a hand-ish italic ("too soft", "keep this").
- [ ] **Style galaxy (`StyleGalaxy.tsx`):** a soft 3D point cloud (`Points` with a round sprite shader, additive) of about 20k points on high and 8k on low: a broad galaxy-like distribution (several anisotropic Gaussian lobes) for the population of human styles, in muted warm greys. A tight bright cluster at the centroid is the base model's outputs. Off-centre, an ember cluster is "your style". About 300 brighter "personal model" points start at the centroid and migrate toward your cluster over t (eased, with per-point jitter and noise), and stay there under reduced motion (t = 4 shows mid-to-late migration).
- [ ] **Preference pairs (`PreferencePairs.tsx`):** small paired glyphs, two thin slabs side by side (one ember-edged "chosen", one grey "rejected"), detach from the sheet's edited spots and arc into the galaxy toward your cluster, staggered.
- [ ] **index.tsx:** shots: t = 0 the sheet in the foreground, left of centre, with the galaxy behind on the right; t ≈ 3.2 track a pair flying into the galaxy; t ≈ 6.2 wide view of the galaxy showing migration toward your cluster. Callouts: `base model · pulls toward the average`, `your style`, `preference pairs · from your edits`. Thread waypoints come in at x = -16, pass the sheet and end at your cluster (the last waypoint at x ≤ 16).
- [ ] **Verify and report** as in Task 2, with ch=5.

### Task 7: Integration, stills, polish (controller)

- [ ] Review every station screenshot together. Unify exposure, bloom levels and framing across stations, and adjust lights in `Stage.tsx` if needed.
- [ ] Check the fly-through between each pair of chapters (animated screenshots during the 2.2 s flight) and the thread's continuity across station boundaries.
- [ ] Capture stills: for N in 1..5, screenshot `?ch=N&hold=1` with the plate cropped to its canvas, saved as `public/hero/chN.webp` (quality 82).
- [ ] Phone pass at 390 × 844 (quality "low"), plus a reduced-motion check (emulate `prefers-reduced-motion: reduce`).
- [ ] Delete `src/components/home/HeroMotion.tsx` and the `hm-*` keyframes in `globals.css` that only it used (keep `hm-bar`, which Hero3D uses).
- [ ] `npx eslint src`, `npx next build` (all 49 pages), and a production screenshot pass.
- [ ] Report to the user and ask before committing.
