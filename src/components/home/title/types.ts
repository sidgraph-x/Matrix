export type ParamDef = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  /** digits shown in the panel */
  digits?: number;
  unit?: string;
};

export type Params = Record<string, number>;

export type EngineCtx = {
  canvas: HTMLCanvasElement;
  h1: HTMLElement;
  params: Params;
  reduce: boolean;
  low: boolean;
  seed: number;
};

export type Engine = {
  /** Advance and draw one frame. Returns false once the form has settled and needs no more frames. */
  tick(now: number): boolean;
  /** Pointer in CSS px relative to the h1's top-left corner, or null when it leaves. */
  pointer(p: { x: number; y: number } | null): void;
  dispose(): void;
};

export type FormDef = {
  id: "print" | "growth" | "network" | "memory";
  /** Switcher label */
  name: string;
  /** Panel heading */
  title: string;
  /** Which part of the stack this form stands for */
  about: string;
  body: string;
  hint: string;
  refs: { text: string; href?: string }[];
  params: ParamDef[];
  needsGL: boolean;
  /** Returns null when the device can't run it (the host then falls back to the print). */
  create(ctx: EngineCtx): Engine | null;
};
