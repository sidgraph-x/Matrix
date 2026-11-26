"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useLocalTime } from "../../clock";
import type { Quality } from "../../types";
import { touch } from "./Adapter";
import { rng } from "./weights";

/*
 * Memory: a helical track of small paper records winding in from outside the frame and into the
 * tower's glass at a low layer. Records advance along the track over the chapter and shrink into the
 * stack as they arrive. All cards are one merged mesh whose vertices are rewritten each frame.
 */

const CARD_W = 1.05, CARD_H = 0.42, CARD_T = 0.014;
const COLS = 4, ROWS = 10;
const TURNS = 0.43, THETA0 = -0.39 * Math.PI;
const R_OUT = 14, R_IN = 5.6, Y_OUT = 3.6, Y_IN = -0.7;
/** Cards advanced per second while active. */
const SPEED = 0.9;

export function helix(s: number, out: THREE.Vector3) {
  const th = THETA0 - s * Math.PI * 2 * TURNS;
  const r = R_OUT + (R_IN - R_OUT) * Math.pow(s, 0.85);
  return out.set(r * Math.cos(th), Y_OUT + (Y_IN - Y_OUT) * s, r * Math.sin(th));
}

const ENTRIES = [
  "kept tone", "rejected outline", "prefers short replies", "cut intro by 40%", "kept the second draft",
  "no exclamation marks", "asked for sources", "moved meeting to thu", "liked plain titles", "rewrote the ending",
  "dislikes 'leverage'", "kept the metaphor", "chose option b", "flagged as too soft", "reads before 9:00",
  "sign off: — s.", "tables over bullets", "kept this line", "rejected summary", "wants numbers first",
  "uses metric units", "rejected the pun", "kept british spelling", "shorter subject lines", "tone: direct, warm",
  "skip the preamble", "kept the diagram", "prefers serif", "trimmed adjectives", "accepted the edit",
];

function atlasTexture(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const css = getComputedStyle(document.documentElement);
  const mono = css.getPropertyValue("--font-geist-mono").trim() || "ui-monospace, monospace";
  const serif = css.getPropertyValue("--font-newsreader").trim() || "Georgia, serif";
  const cw = size / COLS, chh = size / ROWS, k = size / 1024;
  const r = rng(4021);
  for (let i = 0; i < COLS * ROWS; i++) {
    const x = (i % COLS) * cw, y = Math.floor(i / COLS) * chh;
    g.fillStyle = i % 3 === 0 ? "#efe9df" : "#f4f0e8";
    g.fillRect(x, y, cw, chh);
    // fine paper grain
    for (let n = 0; n < 60; n++) {
      g.fillStyle = `rgba(90,80,60,${0.03 + r() * 0.04})`;
      g.fillRect(x + r() * cw, y + r() * chh, 1.2 * k, 1.2 * k);
    }
    const hh = String(7 + Math.floor(r() * 15)).padStart(2, "0"), mm = String(Math.floor(r() * 60)).padStart(2, "0");
    const pad = 16 * k;
    g.textBaseline = "alphabetic";
    g.fillStyle = "#6f675b";
    g.font = `500 ${15 * k}px ${mono}`;
    g.fillText(`${hh}:${mm}`, x + pad, y + 30 * k);
    g.textAlign = "right";
    g.fillText(`mem ${String(1200 + i * 37).padStart(5, "0")}`, x + cw - pad, y + 30 * k);
    g.textAlign = "left";
    g.fillStyle = "rgba(60,52,40,0.25)";
    g.fillRect(x + pad, y + 40 * k, cw - 2 * pad, Math.max(1, 1.2 * k));
    g.fillStyle = "#24201b";
    g.font = `400 ${25 * k}px ${serif}`;
    g.fillText(ENTRIES[i % ENTRIES.length], x + pad, y + 74 * k, cw - 2 * pad);
    // a keep / reject tick at the right edge
    g.fillStyle = i % 4 === 1 ? "#9a8f80" : "#3a352e";
    g.fillRect(x + cw - pad - 6 * k, y + 60 * k, 6 * k, 18 * k);
    // trim line so neighbouring cells never bleed in mipmaps
    g.strokeStyle = "rgba(40,34,26,0.35)"; g.lineWidth = 2 * k;
    g.strokeRect(x + 1, y + 1, cw - 2, chh - 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Template card: a thin box whose +z face maps to an atlas cell and other faces to plain paper. */
const BASE = new THREE.BoxGeometry(CARD_W, CARD_H, CARD_T);

export default function MemoryRibbon({ index, quality }: { index: number; quality: Quality }) {
  const local = useLocalTime(index);
  const count = quality === "high" ? 22 : 14;

  const res = useMemo(() => {
    const atlas = atlasTexture(quality === "high" ? 1024 : 512);
    const vpc = BASE.attributes.position.count, ipc = BASE.index!.count;
    const pos = new Float32Array(count * vpc * 3), nor = new Float32Array(count * vpc * 3), uv = new Float32Array(count * vpc * 2);
    const idx: number[] = [];
    const bu = BASE.attributes.uv;
    for (let c = 0; c < count; c++) {
      const cell = c % (COLS * ROWS), u0 = (cell % COLS) / COLS, v0 = 1 - (Math.floor(cell / COLS) + 1) / ROWS;
      for (let v = 0; v < vpc; v++) {
        const face = Math.floor(v / 4); // px, nx, py, ny, pz, nz
        const o = (c * vpc + v) * 2;
        if (face === 4) {
          uv[o] = u0 + (0.01 + bu.getX(v) * 0.98) / COLS;
          uv[o + 1] = v0 + (0.02 + bu.getY(v) * 0.96) / ROWS;
        } else {
          uv[o] = u0 + 0.5 / COLS; uv[o + 1] = v0 + 0.15 / ROWS; // blank paper inside the cell
        }
      }
      for (let i = 0; i < ipc; i++) idx.push(BASE.index!.getX(i) + c * vpc);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2.5, 0), 16);
    const mat = new THREE.MeshStandardMaterial({ map: atlas, roughness: 0.88, metalness: 0, emissive: "#fff6ea", emissiveMap: atlas, emissiveIntensity: 0.28 });

    // the track: a faint translucent band along the helix with hairline edges
    const segs = 220, band: number[] = [], edges: number[] = [], bandIdx: number[] = [], bandCol: number[] = [], edgeCol: number[] = [];
    const fade = (s: number) => THREE.MathUtils.smoothstep(s, 0, 0.18) * (1 - 0.6 * THREE.MathUtils.smoothstep(s, 0.9, 1));
    const p = new THREE.Vector3(), q = new THREE.Vector3();
    for (let i = 0; i <= segs; i++) {
      const s = i / segs;
      helix(s, p);
      const n = q.set(p.x, 0, p.z).normalize().multiplyScalar(-0.03);
      for (const dy of [-CARD_H * 0.72, CARD_H * 0.72]) { band.push(p.x + n.x, p.y + dy, p.z + n.z); bandCol.push(1, 1, 1, fade(s)); }
      if (i > 0) {
        const a = (i - 1) * 2;
        bandIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    for (let i = 0; i < segs; i++) {
      for (const side of [0, 1]) {
        const a = (i * 2 + side) * 3, b = ((i + 1) * 2 + side) * 3;
        edges.push(band[a], band[a + 1], band[a + 2], band[b], band[b + 1], band[b + 2]);
        edgeCol.push(1, 1, 1, fade(i / segs), 1, 1, 1, fade((i + 1) / segs));
      }
    }
    const bandGeo = new THREE.BufferGeometry();
    bandGeo.setAttribute("position", new THREE.Float32BufferAttribute(band, 3));
    bandGeo.setIndex(bandIdx);
    bandGeo.setAttribute("color", new THREE.Float32BufferAttribute(bandCol, 4));
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(edges, 3));
    edgeGeo.setAttribute("color", new THREE.Float32BufferAttribute(edgeCol, 4));
    return {
      atlas, geo, mat, bandGeo, edgeGeo,
      bandMat: new THREE.MeshBasicMaterial({ color: "#ede6da", vertexColors: true, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false }),
      edgeMat: new THREE.LineBasicMaterial({ color: "#ede6da", vertexColors: true, transparent: true, opacity: 0.34, depthWrite: false }),
    };
  }, [count, quality]);
  useEffect(() => () => {
    res.atlas.dispose(); res.geo.dispose(); res.mat.dispose(); res.bandGeo.dispose(); res.edgeGeo.dispose(); res.bandMat.dispose(); res.edgeMat.dispose();
  }, [res]);

  const tmp = useMemo(() => ({
    p: new THREE.Vector3(), p2: new THREE.Vector3(), tx: new THREE.Vector3(), ty: new THREE.Vector3(), tz: new THREE.Vector3(),
    m: new THREE.Matrix4(), nm: new THREE.Matrix3(), v: new THREE.Vector3(),
  }), []);
  const last = useRef(-1);

  useFrame(() => {
    const t = local();
    if (t === last.current) return;
    last.current = t;
    const pos = res.geo.attributes.position as THREE.BufferAttribute, nor = res.geo.attributes.normal as THREE.BufferAttribute;
    const bp = BASE.attributes.position, bn = BASE.attributes.normal, vpc = bp.count;
    for (let c = 0; c < count; c++) {
      const s = (((c + t * SPEED) / count) % 1 + 1) % 1;
      helix(s, tmp.p);
      helix(Math.min(1, s + 0.002), tmp.p2);
      tmp.tx.subVectors(tmp.p2, tmp.p).normalize();
      tmp.tz.set(tmp.p.x, 0, tmp.p.z).normalize(); // faces outward...
      if (tmp.tz.z < -0.2) { tmp.tz.negate(); tmp.tx.negate(); } // ...except behind the tower, where it turns to the viewer
      tmp.ty.crossVectors(tmp.tz, tmp.tx).normalize();
      tmp.tz.crossVectors(tmp.tx, tmp.ty);
      // grow in at the far end, shrink as the record passes into the glass
      const sc = THREE.MathUtils.smoothstep(s, 0, 0.05) * (1 - THREE.MathUtils.smoothstep(s, 0.86, 0.985));
      tmp.m.makeBasis(tmp.tx, tmp.ty, tmp.tz).scale(tmp.v.setScalar(Math.max(0.0001, sc))).setPosition(tmp.p);
      tmp.nm.getNormalMatrix(tmp.m);
      for (let v = 0; v < vpc; v++) {
        tmp.v.fromBufferAttribute(bp, v).applyMatrix4(tmp.m);
        pos.setXYZ(c * vpc + v, tmp.v.x, tmp.v.y, tmp.v.z);
        tmp.v.fromBufferAttribute(bn, v).applyMatrix3(tmp.nm).normalize();
        nor.setXYZ(c * vpc + v, tmp.v.x, tmp.v.y, tmp.v.z);
      }
    }
    touch(pos, nor);
  });

  return (
    <group>
      <mesh geometry={res.bandGeo} material={res.bandMat} />
      <lineSegments geometry={res.edgeGeo} material={res.edgeMat} />
      <mesh geometry={res.geo} material={res.mat} />
    </group>
  );
}
