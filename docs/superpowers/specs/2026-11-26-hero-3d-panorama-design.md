# Hero panorama in WebGL: design

Date: 2026-11-26
Status: approved design, awaiting spec review
Replaces: `src/components/home/HeroMotion.tsx` (SVG, five chapters)

## Problem

The current panorama reads as childish. Each chapter is a symbol rather than a mechanism (a node-link "neural net", cards with check marks, toy boxes, a cartoon satellite). None of it carries a number. Every chapter is one centred object in empty black, and the ember thread is decoration.

The `/challenges` atlas sets the bar the hero should meet: real mechanisms, real figures, mono callouts on leader lines, and honesty labels ("Schematic", "Simulated").

## Goal

Rebuild the panorama as one 3D world with five detailed stations. Each station illustrates real hardware or a real mechanism with lit, physically based materials. The story is bold and concrete: every chapter makes one claim that rests on one checkable number.

## Storyline: follow one joule

A single path, the joule thread, runs from sunlight to a decision a person would make. What it carries changes at each station.

| # | Chapter | Thread carries | Claim (caption title line) | Supporting line | Number shown |
|---|---|---|---|---|---|
| 1 | Energy | photons → current | Energy isn't scarce. Capturing it is. | The sun delivers about 9,000× the power humanity uses. Matrix builds the systems that capture it, store it and spend it well. | ≈173,000 TW sunlight vs ≈19 TW human use |
| 2 | Compute | operands | Moving data costs more than the maths. | Our silicon keeps every operand beside the arithmetic, for training and inference. | DRAM read 640 pJ vs 3.7 pJ multiply (≈170×) |
| 3 | Link | encrypted updates (Δw) | Updates travel. Your data doesn't. | Nodes learn together over fiber and low orbit, exchanging encrypted weight updates. | LEO shell 550 km; fiber ≈5 µs/km |
| 4 | Intelligence | weight updates | One frontier model, eight billion adapters. | Personal superintelligence for everyone: a small set of weights that is yours, on hardware you own. | rank-16 adapter = 131k of 16.8M weights per layer (0.8%) |
| 5 | Taste | preferences | Models average us out. Yours shouldn't. | Human creativity and taste stay human. Every edit teaches your model your judgment, and keeps it distinct. | distance to your style (simulated) |

Sources go in `story.ts` beside each number:
- Solar intercept is about 173 PW. Global primary energy is about 620 EJ/yr, or about 19.6 TW.
- Energy per operation: Horowitz, ISSCC 2014, at 45 nm, as tabulated by Han et al. This matches atlas problem C2.
- LoRA arithmetic for d = 4096, r = 16: 2·d·r = 131,072 against d² = 16,777,216.
- 550 km is a typical LEO shell altitude.
- Light in fiber travels at about 0.68 c, which is about 4.9 µs/km.

## Architecture

New folder: `src/components/home/hero3d/`.

| File | Responsibility |
|---|---|
| `Hero3D.tsx` | Client entry. Owns chapter state, autoplay timer and play/pause. Renders the DOM plate (canvas slot, readout panel, caption and controls row). Lazy-loads `Stage` with `next/dynamic` and `ssr: false`. Shows the still for the current chapter while loading or when WebGL is unavailable. |
| `Stage.tsx` | `<Canvas>` setup: renderer (ACES tone mapping, sRGB), in-scene light panels for reflections (drei `Environment` + `Lightformer`, nothing downloaded), key and rim lights, post-processing (bloom and vignette, desktop only), adaptive DPR and performance monitor, and a frameloop that only draws on demand when paused, offscreen or the tab is hidden. |
| `CameraRig.tsx` | A Catmull-Rom path through the five station viewpoints. A chapter change eases along the path over 2.2 s (`cubic-bezier(.65,0,.35,1)` equivalent). While a chapter holds, it plays that station's beat sequence (dolly or orbit keyframes). Under reduced motion it cuts instead of flying. |
| `Thread.tsx` | The joule path as a tube. A shader flows particles along it. Carrier colour, size and spacing change per station segment, and the lit length grows to the active station. |
| `Callout.tsx` | drei `Html` label anchored at a 3D point, joined by a thin 3D leader line. Mono, 11–12 px, night-ink colour. At most four per station. |
| `Readout.tsx` | A 2D panel at the plate's top right, one per chapter. It holds the chapter's number as a small SVG chart (energy flow bars, log-scale pJ bars, latency rows, a loss curve, a distance curve). Values that are simulated carry a "Simulated" label. |
| `materials.ts` | Shared PBR materials: anodised aluminium, gold, copper, silicon (clearcoat with iridescence), FR4 substrate, glass (transmission), rock strata, emissive ember. |
| `textures.ts` | Procedural `CanvasTexture`s: die floorplan, typeset draft with tracked changes, Earth land mask and city lights, weight-matrix heatmaps (`DataTexture`). |
| `story.ts` | Chapter copy, numbers and sources (the table above). |
| `stations/energy/{Energy,TandemPV,Geothermal,Storage,Tokamak}.tsx` | Station 1. |
| `stations/{Compute,Link,Intelligence,Taste}.tsx` | Stations 2–5. A station may split into subfiles if it grows past about 300 lines. |

The stations sit along +x, about 40 world units apart. Each exports its group, its camera viewpoint(s) and its callout anchors.

### State and data flow

`Hero3D` holds `ch` (0–4) and `playing`. A timer advances `ch` every 9 s while playing. `ch` reaches `Stage` → `CameraRig`, `Thread` and the stations (the active station runs its animations and the others idle). Inside the canvas, time comes from `useFrame`, with a per-chapter local clock reset on chapter change. No other shared state.

## Stations

### 1. Energy: cut-away terrain block
- **Block:** a rectangular terrain slab with two section faces. The faces show rock strata (displaced bands), temperature bands (shader gradient with labelled lines at 100, 150 and 200 °C) and the geothermal doublet. An injection well and a production well run 3–4 km deep (scaled), with horizontal laterals and a fracture network made of branching line segments. Particles move cold-down (brass) and hot-up (ember).
- **Surface:** rows of single-axis trackers. Instanced tandem PV modules with frames and cell texture, torque tubes and piles. Trackers tilt slowly with the sun angle.
- **Tandem stack:** an exploded six-layer stack floats above the field: glass, ITO, perovskite (1.68 eV), recombination layer, silicon (1.12 eV), back contact. Photon rays fall on it. Short wavelengths (blue) stop in the perovskite and long ones (red) reach the silicon.
- **Storage and power:** a battery container with a cut-away wall showing instanced rack modules, and a silicon-carbide inverter skid. The DC bus runs from the skid to the thread.
- **Fusion:** behind the block, a tokamak. The vacuum vessel torus is cut away by a quarter, with 18 D-shaped toroidal field coils (instanced) and an emissive plasma torus whose shader noise drifts like turbulence. Labelled as research.
- **Beats:** a wide establishing shot, then a push to the tandem stack, then a drop to the section face.
- **Callouts:** "tandem cell · >34% lab efficiency", "EGS doublet · ~3.5 km · >200 °C", "SiC power stage · DC bus", "tokamak · research".
- **Readout:** supply-and-demand bars per source (solar, geothermal, storage) against load. Simulated.

### 2. Compute: accelerator package in exploded view
- **Layers, bottom to top:** organic substrate with gold BGA pads and capacitors; silicon interposer; logic die, whose floorplan texture shows compute tiles, SRAM banks, a NoC mesh and PHYs at the edges, in clearcoat silicon with faint iridescence; four 12-high HBM stacks, one cut to show 12 die layers and TSV columns; a nickel-plated copper cold plate with microchannel fins and coolant particles.
- **Beats:** orbit with the package assembled, then the layers separate vertically, then a dive to the die, where an 8×8 grid of instanced processing elements pulses with diagonal systolic data waves.
- **Callouts:** "HBM · 12-high stack", "TSVs", "on-chip SRAM · operands stay here", "cold plate · microchannels".
- **Readout:** log-scale energy per operation: DRAM 640 pJ, SRAM 5 pJ, FP multiply 3.7 pJ.

### 3. Link: Earth and constellation
- **Earth:** a sphere shader. A noise land mask gives oceans and land, the night side has a city-lights mask, there's a terminator band and a Fresnel atmosphere shell.
- **Constellation:** a Walker-style layout of 12 orbital planes × 20 satellites (instanced, simple bus-and-panels geometry) at a scaled 550 km. Laser inter-satellite links are thin lines to in-plane and cross-plane neighbours.
- **Ground:** four ground Nodes with flat phased-array terminals, and glowing fiber arcs over the surface with repeater ticks.
- **Beats:** Δw packets rise from the Nodes, travel the links, merge at an aggregation point, and the merged update returns.
- **Callouts:** "LEO shell · 550 km", "laser inter-satellite link", "fiber · ~5 µs/km", "only encrypted Δw leaves a Node".
- **Readout:** latency rows for fiber, ground to satellite, and satellite hops.

### 4. Intelligence: transformer tower with personal adapters
- **Tower:** a vertical stack of 24 glass layer plates (transmission material). Each plate shows its weight matrix as a lit heatmap `DataTexture` (frozen, greyscale).
- **Adapters:** on chosen layers, thin ember B (d×r) and A (r×d) strips extrude from the plate edges. Their outer product spreads across the plate as an ember low-rank pattern that changes with each simulated training step.
- **Memory:** a helical ribbon of memory records, small plates with timestamp texture, winds into the tower.
- **Callouts:** "base model · frozen · shared", "your adapter · rank 16 · 0.8% of weights", "memory · on your Node".
- **Readout:** a falling loss curve (simulated) and the parameter arithmetic.

### 5. Taste: draft sheet and style galaxy
- **Sheet:** a paper plane with a slight curl. Its texture is a typeset draft with tracked changes: strike-throughs, ember insertions and margin notes. The draft text is original copy about the Node, not lorem ipsum.
- **Galaxy:** about 20k points (instanced or `Points` with a soft sprite) for the population of human styles. The base model's outputs form a tight cluster at the centroid. The user's cluster sits off-centre in ember. Personal-model outputs (about 300 points) migrate from the centroid to the user's cluster over the chapter.
- **Beats:** preference pairs (chosen ≻ rejected) leave the sheet as small paired glyphs and fly into the galaxy, then the migration follows.
- **Callouts:** "base model · pulls toward the average", "your style", "preference pairs from your edits".
- **Readout:** distance to your style falling and variety retained holding. Simulated.

## Plate and DOM chrome

- Keep the plate: wide container, dark night background, the current caption and controls row.
- The caption title becomes the claim and the supporting line sits under it.
- Chapter length is 9 s. The progress bar duration matches.
- The readout panel is at top right on desktop. It is hidden under 760 px, where its number appears in the caption line instead.

## Performance, fallbacks and accessibility

- The canvas mounts after first paint. The headline stays the largest contentful paint.
- Adaptive DPR, from 1 to the device ratio, capped at 2. A performance monitor drops post-processing and halves instance counts when frame rate falls.
- The renderer draws on demand when paused, when the plate is offscreen (IntersectionObserver) or when the tab is hidden.
- Mobile (<760 px): DPR 1, no post-processing, reduced point and instance counts, and one framing per station.
- Reduced motion: no autoplay, camera cuts, and particle flows frozen at a representative frame.
- No WebGL, or a context-creation error: show stills `public/hero/ch{1..5}.webp`. These are captured from the scene by the headless screenshot script and committed.
- `aria-label` describes the whole sequence. The caption region stays `aria-live="polite"`, and the controls stay buttons with `aria-current`.

## Testing and acceptance

- `npm run build` and `eslint src` pass with no new errors.
- Headless screenshots of every chapter at 1920×1080, 1440×900 and 390×844 (WebGL through SwiftShader) are reviewed after each station is built.
- No console errors or warnings from three, R3F or the hero, apart from the existing harmless framer-motion one.
- The chapter change fly-through, play/pause, chapter buttons, reduced motion and the WebGL-off fallback are each checked once.

## Build order

1. Foundation: dependencies, `Hero3D`, `Stage`, `CameraRig`, `Thread`, `Callout`, `Readout`, `story.ts`, placeholder station groups, and the fallback path wired in place of `HeroMotion`.
2. Compute, which sets the material and lighting quality bar.
3. Energy (four systems).
4. Link.
5. Intelligence.
6. Taste.
7. Stills, mobile tuning, performance pass, then delete `HeroMotion.tsx` and any CSS used only by it.

## Out of scope

- Changes to `/node`, the blog or `/challenges`.
- Downloaded 3D models, HDRIs or Earth textures. Everything is procedural.
- Sound.
