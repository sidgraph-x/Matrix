import type { VizSpec } from "./viz";
export const VIZ: Record<string, VizSpec>;
export function defViz(id: string, spec: unknown): void;
export function rng(seed: number): () => number;
export function clamp(v: number, a: number, b: number): number;
export function lerp(a: number, b: number, t: number): number;
export function ease(t: number): number;
export function mountFigure(el: HTMLElement, id: string, opts?: { still?: boolean; warm?: number }): { destroy(): void };
