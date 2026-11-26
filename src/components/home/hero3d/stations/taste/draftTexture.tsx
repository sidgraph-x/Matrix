"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { Quality } from "../../types";
import { fontVars, whenFontsReady } from "./fonts";
import { rng } from "./space";

/*
 * The draft: page three of a working essay about the Node, typeset in Newsreader and double-spaced
 * the way drafts are when someone means to mark them up. Markup in the copy below:
 *   [old|new]  a tracked change: "old" is struck through in ink, "new" is written above it in ember.
 *   [|new]     a pure insertion with a caret.
 *   {note}     a margin note attached to the current line.  {!note} also underlines the rest of the paragraph.
 */
const TITLE = "A machine of one’s own";
const STANDFIRST = "Working draft, third pass. Changes in ember are mine.";
const COPY = [
  "Most software is designed for a statistical person, someone whose taste sits at the exact centre of every survey. [That person is rare.|That person does not exist.] Writers, engineers and cooks are particular in ways that matter, and the tools they use should learn those ways {too soft} [rather than gently smoothing them over.|instead of sanding them down.]",
  "The Node is a computer that lives in your house and runs a model that is yours. Nothing you write leaves it. When you cut a sentence, reorder a list or turn down a suggestion, the Node keeps that choice as a small[|, private] preference, and over [a period of several weeks|weeks] those choices [start to resemble|become] judgment.",
  "We think this matters more than speed. A model trained on everyone [tends toward|drifts to] the middle of everything it has read. The goal is not a smarter average. {!keep this} It is a model that, a year from now, still disagrees with the average in exactly the places you do.",
];

/** One tracked change, in texture space (u right, v down), for the preference pairs to lift off from. */
export type Edit = { del: string; ins: string; u: number; v: number };
/** The edits in reading order, available before layout (the pair slips only need the words). */
export const EDITS: { del: string; ins: string }[] = COPY.flatMap((p) =>
  [...p.matchAll(/\[([^|\]]*)\|([^\]]*)\]/g)].map((m) => ({ del: m[1], ins: m[2] })),
);

export const PAPER = "#f3eee4";
export const INK = "#1c1a17";
export const PEN = "#d4521b"; // ember, deepened so it reads on paper
const STRIKE = "#23253a";
const GREY = "#9b9284";

type Tok =
  | { k: "w"; text: string; ul: boolean }
  | { k: "edit"; del: string; ins: string; ul: boolean }
  | { k: "note"; text: string; under: boolean };

function parse(p: string): Tok[] {
  const out: Tok[] = [];
  let ul = false;
  for (const part of p.split(/(\[[^\]]*\]|\{[^}]*\})/)) {
    if (!part) continue;
    if (part.startsWith("[")) {
      const [del, ins] = part.slice(1, -1).split("|");
      out.push({ k: "edit", del, ins, ul });
    } else if (part.startsWith("{")) {
      const under = part[1] === "!";
      out.push({ k: "note", text: part.slice(under ? 2 : 1, -1), under });
      if (under) ul = true;
    } else {
      for (const w of part.split(/\s+/)) if (w) out.push({ k: "w", text: w, ul });
    }
  }
  return out;
}

/** Hand-ish lettering: italic Newsreader set glyph by glyph with a little rotation and baseline drift. */
function hand(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, r: () => number, color = PEN) {
  const { serif } = fontVars();
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `italic 400 ${size}px ${serif}`;
  let cx = x;
  for (const ch of text) {
    const w = ctx.measureText(ch).width;
    ctx.save();
    ctx.translate(cx, y + (r() - 0.5) * size * 0.07);
    ctx.rotate(-0.06 + (r() - 0.5) * 0.08);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    cx += w * (0.97 + r() * 0.05);
  }
  ctx.restore();
  return cx - x;
}

/** A pen stroke from a to b with a slight wobble and a pressure taper. */
function stroke(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, w: number, color: string, r: () => number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  const n = Math.max(6, Math.round(Math.hypot(x1 - x0, y1 - y0) / 18));
  let px = x0, py = y0;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + (r() - 0.5) * w * 0.9;
    ctx.lineWidth = w * (0.75 + 0.5 * Math.sin(Math.PI * t));
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
    px = x; py = y;
  }
  ctx.restore();
}

function paperGrain(ctx: CanvasRenderingContext2D, W: number, H: number, r: () => number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  // pixel grain
  const img = ctx.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * 7;
    d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9;
  }
  ctx.putImageData(img, 0, 0);
  // fibres: short faint curved hairs
  ctx.lineCap = "round";
  for (let i = 0; i < W * 1.4; i++) {
    const x = r() * W, y = r() * H, a = r() * Math.PI, l = 6 + r() * 26;
    ctx.strokeStyle = r() < 0.5 ? "rgba(120,104,84,0.05)" : "rgba(255,255,255,0.08)";
    ctx.lineWidth = 0.6 + r() * 0.8;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (r() - 0.5) * 6, y + Math.sin(a) * l * 0.5 + (r() - 0.5) * 6, x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
  // faint warm age toward the edges
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.78);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(120,96,64,0.10)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** Draws the whole page into `canvas` and fills `edits` with where each tracked change landed. */
function drawDraft(canvas: HTMLCanvasElement, edits: Edit[]) {
  const W = canvas.width, H = canvas.height, s = W / 1448;
  const ctx = canvas.getContext("2d")!;
  const { serif, mono } = fontVars();
  const r = rng(29);
  paperGrain(ctx, W, H, r);
  edits.length = 0;

  const L = 168 * s, TW = 930 * s, NOTE_X = L + TW + 52 * s;
  const body = 34 * s, lead = 80 * s;
  ctx.textBaseline = "alphabetic";

  // running head
  ctx.fillStyle = GREY;
  ctx.font = `400 ${17 * s}px ${mono}`;
  ctx.letterSpacing = `${2.4 * s}px`;
  ctx.fillText("MATRIX  ·  NODE FIELD NOTES", L, 118 * s);
  const rh = "DRAFT 3  ·  26 NOV";
  ctx.fillText(rh, L + TW + 150 * s - ctx.measureText(rh).width, 118 * s);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = "rgba(60,52,44,0.28)";
  ctx.fillRect(L, 138 * s, TW + 150 * s, 1.4 * s);

  // title block
  ctx.fillStyle = INK;
  ctx.font = `400 ${80 * s}px ${serif}`;
  ctx.fillText(TITLE, L - 3 * s, 282 * s);
  ctx.font = `italic 300 ${32 * s}px ${serif}`;
  ctx.fillStyle = "#5a5248";
  ctx.fillText(STANDFIRST, L, 340 * s);

  let y = 452 * s, line = 0;
  const lineNo = (yy: number) => {
    line++;
    ctx.save();
    ctx.fillStyle = "#b4ab9c";
    ctx.font = `400 ${15 * s}px ${mono}`;
    const t = String(line);
    ctx.fillText(t, L - 58 * s - ctx.measureText(t).width, yy - 2 * s);
    ctx.restore();
  };

  ctx.font = `400 ${body}px ${serif}`;
  const space = ctx.measureText(" ").width;

  COPY.forEach((p, pi) => {
    const toks = parse(p);
    let x = 0;
    const indent = pi === 0 ? 0 : 52 * s;
    x = indent;
    lineNo(y);
    let ulFrom: { x: number; y: number } | null = null;
    const ulSegs: [number, number, number][] = [];
    let bracketTop = 0;
    let hasBracket = false;
    const newline = () => {
      if (ulFrom) { ulSegs.push([ulFrom.x, x - space, y]); ulFrom = { x: 0, y: y + lead }; }
      y += lead; x = 0; lineNo(y);
    };
    for (const t of toks) {
      ctx.font = `400 ${body}px ${serif}`;
      if (t.k === "note") {
        if (t.under) {
          hasBracket = true; bracketTop = y - lead * 0.55;
          hand(ctx, t.text, NOTE_X + 26 * s, y - 6 * s, 50 * s, r);
          ulFrom = { x, y };
        } else {
          // note beside this line with a short leader from the text edge
          hand(ctx, t.text, NOTE_X + 8 * s, y + lead * 0.5, 50 * s, r);
          stroke(ctx, L + TW + 6 * s, y + lead * 0.22, NOTE_X + 2 * s, y + lead * 0.36, 2.2 * s, PEN, r);
        }
        continue;
      }
      if (t.k === "w") {
        const w = ctx.measureText(t.text).width;
        if (x + w > TW && x > 0) newline();
        ctx.fillStyle = INK;
        ctx.fillText(t.text, L + x, y);
        x += w + space;
        continue;
      }
      // tracked change
      const w = t.del ? ctx.measureText(t.del).width : 0;
      if (x + w > TW && x > 0) newline();
      const x0 = L + x;
      if (t.del) {
        ctx.fillStyle = INK;
        ctx.fillText(t.del, x0, y);
        stroke(ctx, x0 - 4 * s, y - body * 0.3, x0 + w + 2 * s, y - body * 0.33, 3.2 * s, STRIKE, r);
      }
      // insertion above, in the leading, with a caret for pure insertions
      ctx.font = `italic 400 ${40 * s}px ${serif}`;
      const iw = ctx.measureText(t.ins).width;
      const ix = t.del ? x0 + Math.max(0, (w - iw) / 2) : x0 - space * 0.6 - iw * 0.3;
      const iy = y - lead * 0.5;
      hand(ctx, t.ins, ix, iy, 40 * s, r);
      if (!t.del) {
        const cx = x0 - space * 0.55;
        stroke(ctx, cx - 9 * s, y + 6 * s, cx, y - 16 * s, 2.4 * s, PEN, r);
        stroke(ctx, cx, y - 16 * s, cx + 9 * s, y + 6 * s, 2.4 * s, PEN, r);
        x -= space * 0.35;
      }
      edits.push({ del: t.del, ins: t.ins, u: (ix + iw / 2) / W, v: (iy - 10 * s) / H });
      x += (t.del ? w + space : 0);
    }
    if (ulFrom) ulSegs.push([(ulFrom as { x: number }).x, x - space, y]);
    for (const [a, b, yy] of ulSegs) stroke(ctx, L + a, yy + 9 * s, L + b, yy + 10 * s, 2.4 * s, PEN, r);
    if (hasBracket) {
      const bx = L + TW + 30 * s, bot = y + lead * 0.25;
      stroke(ctx, bx - 10 * s, bracketTop + 26 * s, bx, bracketTop + 30 * s, 2.4 * s, PEN, r);
      stroke(ctx, bx, bracketTop + 30 * s, bx + 1 * s, bot, 2.6 * s, PEN, r);
      stroke(ctx, bx + 1 * s, bot, bx - 10 * s, bot + 3 * s, 2.4 * s, PEN, r);
    }
    y += lead * 1.0;
    ctx.font = `400 ${body}px ${serif}`;
  });

  // folio
  ctx.fillStyle = GREY;
  ctx.font = `400 ${26 * s}px ${serif}`;
  const folio = "3";
  ctx.fillText(folio, W / 2 - ctx.measureText(folio).width / 2, H - 110 * s);
}

export type Draft = { texture: THREE.CanvasTexture; edits: Edit[] };

/** The page as a CanvasTexture, 2048 px tall on high quality and 1024 on low; redrawn once fonts load. */
export function useDraft(quality: Quality): Draft {
  const gl = useThree((s) => s.gl);
  const draft = useMemo(() => {
    const H = quality === "high" ? 2048 : 1024;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(H / Math.SQRT2);
    canvas.height = H;
    const edits: Edit[] = [];
    drawDraft(canvas, edits);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());
    return { texture, edits };
  }, [quality, gl]);

  useEffect(() => {
    let alive = true;
    whenFontsReady().then(() => alive && redraw(draft));
    return () => { alive = false; };
  }, [draft]);
  useEffect(() => () => draft.texture.dispose(), [draft]);
  return draft;
}

function redraw(d: Draft) {
  drawDraft(d.texture.image as HTMLCanvasElement, d.edits);
  d.texture.needsUpdate = true;
}
