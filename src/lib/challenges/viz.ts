/* Client-side figure registry: importing this registers all 42 figures. */
import "./figs-core";
import "./figs-comp";
export { VIZ, mountFigure } from "./engine";

export type VizSpec = {
  toggle?: string[];
  slider?: { label: string; min: number; max: number; step: number; value: number; fmt?: (v: number) => string };
  button?: string;
  legend?: [string, string][];
  caption?: string;
};
