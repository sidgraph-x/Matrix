import { createGrowth } from "./growth";
import { createMemory } from "./memory";
import { createNetwork } from "./network";
import { createPrint } from "./print";
import type { FormDef } from "./types";

export const FORMS: FormDef[] = [
  {
    id: "growth",
    name: "Reaction–diffusion",
    title: "A pattern that sustains itself",
    about: "Energy",
    body:
      "Two simulated chemicals react and diffuse inside the letters (the Gray–Scott model). One is fed in; the other consumes it and multiplies. Where the feed flows, the coral pattern grows to fill each glyph and holds itself in shape. Where it stops, at the edge of the letters, the pattern starves. Lower the feed and watch it die back.",
    hint: "Drag across the title to wipe the pattern. It grows back while the feed is on.",
    refs: [
      { text: "Gray & Scott (1984). Autocatalytic reactions in the isothermal, continuous stirred tank reactor. Chemical Engineering Science 39." },
      { text: "Pearson (1993). Complex patterns in a simple system. Science 261.", href: "https://doi.org/10.1126/science.261.5118.189" },
    ],
    params: [
      { key: "feed", label: "Feed rate F", min: 0.01, max: 0.09, step: 0.0005, value: 0.0545, digits: 4 },
      { key: "kill", label: "Removal rate k", min: 0.045, max: 0.07, step: 0.0005, value: 0.062, digits: 4 },
    ],
    needsGL: true,
    create: createGrowth,
  },
  {
    id: "network",
    name: "Transport network",
    title: "A network with no centre",
    about: "Link",
    body:
      "Hundreds of thousands of agents wander inside the letters. Each senses a chemical trail a few pixels ahead, turns towards the strongest scent and leaves more behind, the way the slime mould Physarum polycephalum forages. No agent sees the whole, yet within seconds their shared trails converge on a single path through every stroke. The real organism, given food placed like Tokyo’s suburbs, grew a network as efficient as the rail system.",
    hint: "Move the pointer over the title. It acts as food, and the network reroutes towards it.",
    refs: [
      { text: "Jones (2010). Characteristics of pattern formation and evolution in approximations of Physarum transport networks. Artificial Life 16." },
      { text: "Tero et al. (2010). Rules for biologically inspired adaptive network design. Science 327.", href: "https://doi.org/10.1126/science.1177894" },
    ],
    params: [
      { key: "angle", label: "Sensor angle", min: 10, max: 60, step: 1, value: 30, digits: 0, unit: "°" },
      { key: "reach", label: "Sensor distance", min: 2, max: 16, step: 0.5, value: 4, digits: 1, unit: " px" },
      { key: "decay", label: "Trail persistence", min: 0.7, max: 0.98, step: 0.005, value: 0.82, digits: 3 },
      { key: "density", label: "Agents per pixel", min: 0.1, max: 2, step: 0.05, value: 0.6, digits: 2 },
      { key: "food", label: "Food in the letters", min: 0, max: 120, step: 1, value: 60, digits: 0 },
    ],
    needsGL: true,
    create: createNetwork,
  },
  {
    id: "memory",
    name: "Associative memory",
    title: "A memory that repairs itself",
    about: "Intelligence",
    body:
      "Every pixel around the title is a neuron in a Hopfield network. The title, along with three random memories, is stored in the connections between them. The network starts with a large share of its pixels flipped and recalls the title by settling into the lowest-energy state. Ember marks pixels that are on but shouldn’t be. Above a temperature of 1 the memory melts into noise.",
    hint: "Move the pointer across the title to scramble it. The network restores what it was taught.",
    refs: [
      { text: "Hopfield (1982). Neural networks and physical systems with emergent collective computational abilities. PNAS 79.", href: "https://doi.org/10.1073/pnas.79.8.2554" },
      { text: "Amit, Gutfreund & Sompolinsky (1985). Storing infinite numbers of patterns in a spin-glass model of neural networks. Physical Review Letters 55.", href: "https://doi.org/10.1103/PhysRevLett.55.1530" },
    ],
    params: [
      { key: "noise", label: "Pixels flipped at start", min: 0.05, max: 0.5, step: 0.01, value: 0.36, digits: 2 },
      { key: "temp", label: "Temperature", min: 0, max: 1.5, step: 0.01, value: 0, digits: 2 },
      { key: "speed", label: "Update rate", min: 0.25, max: 4, step: 0.05, value: 1, digits: 2, unit: "×" },
    ],
    needsGL: false,
    create: createMemory,
  },
  {
    id: "print",
    name: "Quantised print",
    title: "Meaning that survives one bit",
    about: "Compute",
    body:
      "Each glyph is reduced to a single bit per cell and thresholded against an 8×8 Bayer matrix, solid at the top and thinning into halftone at its foot. Low precision is how inference gets cheap enough to run on your own machine. The words survive it.",
    hint: "Move the pointer over the title to lift the ink under it into halftone.",
    refs: [{ text: "Bayer (1973). An optimum method for two-level rendition of continuous-tone pictures. IEEE International Conference on Communications." }],
    params: [
      { key: "density", label: "Cells per em", min: 12, max: 40, step: 1, value: 28, digits: 0 },
      { key: "fade", label: "Halftone depth", min: 0, max: 1.4, step: 0.05, value: 1, digits: 2 },
    ],
    needsGL: false,
    create: createPrint,
  },
];

export const defaults = (f: FormDef) => Object.fromEntries(f.params.map((p) => [p.key, p.value]));
