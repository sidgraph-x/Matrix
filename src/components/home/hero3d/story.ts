/* Chapter copy, numbers and their sources. Every number shown in the hero comes from here. */

export type Readout =
  | { kind: "bars"; title: string; unit: string; log?: boolean; rows: { label: string; value: number; accent?: boolean }[]; note: string; simulated?: boolean }
  | { kind: "rows"; title: string; rows: { label: string; value: string; accent?: boolean }[]; note: string; simulated?: boolean }
  | { kind: "curve"; title: string; series: { label: string; points: number[]; accent?: boolean }[]; note: string; simulated?: boolean };

export type Chapter = {
  id: "energy" | "compute" | "link" | "intelligence" | "taste";
  name: string;
  claim: string;
  line: string;
  /** Short form of the chapter's number, used in the caption on small screens. */
  stat: string;
  readout: Readout;
  sources: string[];
};

// Smooth monotone curves for simulated readouts, deterministic so server and client agree.
const decay = (n: number, from: number, to: number, k: number) =>
  Array.from({ length: n }, (_, i) => +(to + (from - to) * Math.exp(-k * (i / (n - 1)))).toFixed(3));

export const CHAPTERS: Chapter[] = [
  {
    id: "energy",
    name: "Energy",
    claim: "Energy isn’t scarce. Capturing it is.",
    line: "The sun delivers about 9,000 times the power humanity uses. Matrix builds the systems that capture it, store it and spend it well: tandem solar, enhanced geothermal, storage, power electronics, and fusion research.",
    stat: "Sunlight ≈ 173,000 TW · humanity ≈ 19 TW",
    readout: {
      kind: "bars",
      title: "Power, by source",
      unit: "TW",
      log: true,
      rows: [
        { label: "Sunlight reaching Earth", value: 173000, accent: true },
        { label: "Humanity’s total use", value: 19.6 },
      ],
      note: "About 9,000× more arrives than we use.",
    },
    sources: ["Solar power intercepted by Earth ≈ 173 PW", "Global primary energy ≈ 620 EJ/yr ≈ 19.6 TW (2023)"],
  },
  {
    id: "compute",
    name: "Compute",
    claim: "Moving data costs more than the maths.",
    line: "Fetching a number from memory costs about 170 times the multiply that uses it. Our silicon keeps every operand beside the arithmetic, for training and inference.",
    stat: "DRAM read 640 pJ · multiply 3.7 pJ",
    readout: {
      kind: "bars",
      title: "Energy per 32-bit operation",
      unit: "pJ",
      log: true,
      rows: [
        { label: "DRAM read", value: 640, accent: true },
        { label: "On-chip SRAM read", value: 5 },
        { label: "Float multiply", value: 3.7 },
      ],
      note: "45 nm figures. Horowitz, ISSCC 2014.",
    },
    sources: ["Horowitz, ISSCC 2014, as tabulated by Han et al."],
  },
  {
    id: "link",
    name: "Link",
    claim: "Updates travel. Your data doesn’t.",
    line: "Nodes learn together over fiber and low orbit. Only encrypted weight updates leave a machine; what it knows about you stays on it.",
    stat: "LEO 550 km · fiber ≈ 5 µs/km",
    readout: {
      kind: "rows",
      title: "One-way latency",
      rows: [
        { label: "Fiber, per 1,000 km", value: "≈ 4.9 ms" },
        { label: "Ground to satellite, 550 km", value: "≈ 1.8 ms" },
        { label: "Laser hop, 1,000 km", value: "≈ 3.3 ms", accent: true },
      ],
      note: "Light in fiber ≈ 0.68 c; in vacuum, c.",
    },
    sources: ["Typical LEO shell altitude 550 km", "Group index of silica fiber ≈ 1.47"],
  },
  {
    id: "intelligence",
    name: "Intelligence",
    claim: "One frontier model. Eight billion adapters.",
    line: "Personal superintelligence for everyone: a shared base model, and a small set of weights that is only yours, trained on hardware you own.",
    stat: "Rank-16 adapter = 0.8% of a layer",
    readout: {
      kind: "rows",
      title: "One 4096 × 4096 layer",
      rows: [
        { label: "Base weights, frozen", value: "16,777,216" },
        { label: "Your adapter, rank 16", value: "131,072", accent: true },
        { label: "Share of the layer", value: "0.78%", accent: true },
      ],
      note: "ΔW = B·A, with B 4096×16 and A 16×4096.",
    },
    sources: ["LoRA arithmetic: 2·d·r vs d², d = 4096, r = 16"],
  },
  {
    id: "taste",
    name: "Taste",
    claim: "Models average us out. Yours shouldn’t.",
    line: "Human creativity and taste should stay human. Every edit you make teaches your model your judgment, and it keeps that judgment distinct.",
    stat: "Distance to your style, falling",
    readout: {
      kind: "curve",
      title: "Over a month of your edits",
      series: [
        { label: "Distance to your style", points: decay(24, 1, 0.18, 3.2), accent: true },
        { label: "Variety kept", points: decay(24, 0.92, 0.86, 2) },
      ],
      note: "Illustrative.",
      simulated: true,
    },
    sources: ["Illustrative curve"],
  },
];
