"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useLocalTime } from "../../clock";
import type { Quality } from "../../types";
import { EDITS, type Draft } from "./draftTexture";
import { fontVars, whenFontsReady } from "./fonts";
import { SHEET_NORMAL, SHEET_QUAT, YOU, easeInOut, sheetPoint, smooth } from "./space";
import { pixelScale, spriteFrag, spriteSize } from "./sprite";

/*
 * Every tracked change on the page is a preference: the words you wrote in (chosen) over the words you
 * struck (rejected). Each one lifts off the sheet as that pair of phrases, the kept one glowing in ember
 * and the struck one grey beneath it, turns to face us, and arcs into the style space toward your
 * cluster, trailing ember.
 */

const ROWS = EDITS.length;
const CELL_W = 1024, CELL_H = 128;
const WORD_H = 0.3, WORD_W = WORD_H * (CELL_W / CELL_H);
const DELAY0 = 0.5, STAGGER = 0.55, FLIGHT = 3.1, PERIOD = 6;
const TRAIL = 44;

/** Atlas of phrases on transparent ground: column 0 kept, column 1 struck; one row per edit. */
function drawWords(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const { serif, mono } = fontVars();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = "middle";
  EDITS.forEach((e, row) => {
    for (let col = 0; col < 2; col++) {
      const x = col * CELL_W, y = row * CELL_H + CELL_H / 2, kept = col === 0;
      const text = kept ? e.ins.replace(/^,\s*/, "") : e.del || "";
      const face = kept ? "italic 400" : "400";
      let size = 76;
      ctx.font = `${face} ${size}px ${serif}`;
      while (ctx.measureText(text).width > CELL_W - 190 && size > 30) ctx.font = `${face} ${(size -= 2)}px ${serif}`;
      const w = ctx.measureText(text).width, x0 = x + 150;
      if (kept) {
        ctx.fillStyle = "#ff8a4f";
        ctx.fillText(text, x0, y);
        ctx.font = `500 22px ${mono}`;
        ctx.letterSpacing = "3px";
        ctx.fillStyle = "#ffb08a";
        ctx.fillText("KEPT", x + 34, y);
      } else {
        ctx.fillStyle = "#b9b0a2";
        ctx.fillText(text || "—", x0, y);
        if (text) {
          ctx.strokeStyle = "#e9e1d4";
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(x0 - 6, y + 2); ctx.lineTo(x0 + w + 6, y - 1); ctx.stroke();
        }
        ctx.font = `500 22px ${mono}`;
        ctx.letterSpacing = "3px";
        ctx.fillStyle = "#958c7e";
        ctx.fillText(text ? "OVER" : "ADDED", x + 34, y);
      }
      ctx.letterSpacing = "0px";
    }
  });
}

const trailVert = /* glsl */ `
  attribute vec3 aColor; attribute float aSize;
  uniform float uPx;
  varying vec3 vColor; varying float vFade;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float size = aSize;
    ${spriteSize}
    vColor = aColor;
    gl_Position = projectionMatrix * mv;
  }
`;

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();
const _q = new THREE.Quaternion(), _roll = new THREE.Quaternion(), _z = new THREE.Vector3(0, 0, 1);
const TARGET = new THREE.Vector3(...YOU);

/** Point on pair `i`'s flight at phase p (0 on the page, 1 in your cluster): a cubic arc up and over. */
function flight(draft: Draft, i: number, p: number, out: THREE.Vector3) {
  const e = draft.edits[i] ?? { u: 0.5, v: 0.5 };
  sheetPoint(e.u, e.v, 0.03, _a);
  _b.copy(_a).addScaledVector(SHEET_NORMAL, 2.2).add(_d.set(1.2, 1.5 + i * 0.12, 0));
  _c.copy(TARGET).add(_d.set(-4.2, 2.4 - i * 0.18, 3.0));
  const k = easeInOut(p), m = 1 - k;
  return out.copy(_a).multiplyScalar(m * m * m)
    .addScaledVector(_b, 3 * m * m * k)
    .addScaledVector(_c, 3 * m * k * k)
    .addScaledVector(TARGET, k * k * k);
}

/** Flags dynamic buffers for upload (kept outside the component: they are mutable GPU buffers, not React state). */
function markDirty(...attrs: THREE.BufferAttribute[]) {
  for (const a of attrs) a.needsUpdate = true;
}

const phaseOf = (t: number, i: number) => {
  const d = DELAY0 + i * STAGGER;
  if (t < d) return -1;
  const p = ((t - d) % PERIOD) / FLIGHT;
  return p < 1 ? p : -1;
};

export default function PreferencePairs({ index, draft }: { index: number; draft: Draft; quality: Quality }) {
  const local = useLocalTime(index);
  const atlas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = CELL_W * 2;
    c.height = CELL_H * ROWS;
    drawWords(c);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);
  useEffect(() => {
    let alive = true;
    whenFontsReady().then(() => {
      if (!alive) return;
      drawWords(atlas.image as HTMLCanvasElement);
      atlas.needsUpdate = true;
    });
    return () => { alive = false; };
  }, [atlas]);

  const mats = useMemo(() => EDITS.map((_, row) => [0, 1].map((col) => {
    const map = atlas.clone();
    map.repeat.set(0.5, 1 / ROWS);
    map.offset.set(col * 0.5, 1 - (row + 1) / ROWS);
    return new THREE.MeshBasicMaterial({
      map, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
      color: col === 0 ? new THREE.Color(2.4, 2.4, 2.4) : new THREE.Color(1.3, 1.3, 1.3), opacity: col === 0 ? 1 : 0.9,
    });
  })), [atlas]);
  const geo = useMemo(() => new THREE.PlaneGeometry(WORD_W, WORD_H), []);
  useEffect(() => () => {
    atlas.dispose(); geo.dispose();
    mats.flat().forEach((m) => { m.map?.dispose(); m.dispose(); });
  }, [atlas, mats, geo]);

  const trail = useMemo(() => {
    const n = ROWS * TRAIL;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
    const s = new Float32Array(n);
    for (let i = 0; i < n; i++) s[i] = 0.05 * Math.pow(1 - (i % TRAIL) / TRAIL, 1.5) + 0.012;
    g.setAttribute("aSize", new THREE.BufferAttribute(s, 1));
    return g;
  }, []);
  useEffect(() => () => trail.dispose(), [trail]);
  const uTrail = useMemo(() => ({ uPx: { value: 800 } }), []);

  const pairs = useRef<(THREE.Group | null)[]>([]);
  const trailMat = useRef<THREE.ShaderMaterial>(null);
  const v = useRef(new THREE.Vector3());

  useFrame((state) => {
    const t = local();
    const P = trail.attributes.position as THREE.BufferAttribute, C = trail.attributes.aColor as THREE.BufferAttribute;
    for (let i = 0; i < ROWS; i++) {
      const g = pairs.current[i];
      const p = t > 0 ? phaseOf(t, i) : -1;
      if (g) {
        g.visible = p >= 0;
        if (p >= 0) {
          flight(draft, i, p, g.position);
          g.scale.setScalar(Math.max(0.001, (0.5 + 0.5 * smooth(p / 0.25)) * (1 - 0.97 * smooth((p - 0.8) / 0.2))));
          _q.copy(SHEET_QUAT).slerp(state.camera.quaternion, smooth(p / 0.3));
          _roll.setFromAxisAngle(_z, Math.sin(p * 5 + i) * 0.05 * Math.sin(Math.PI * p));
          g.quaternion.copy(_q).multiply(_roll);
        }
      }
      for (let j = 0; j < TRAIL; j++) {
        const k = i * TRAIL + j;
        const pj = p - j * 0.0045;
        if (p < 0 || pj < 0.04) { P.setXYZ(k, 0, -999, 0); C.setXYZ(k, 0, 0, 0); continue; }
        flight(draft, i, pj, v.current);
        P.setXYZ(k, v.current.x, v.current.y, v.current.z);
        const f = (1 - j / TRAIL) * smooth((pj - 0.04) / 0.12) * (1 - smooth((p - 0.85) / 0.15)) * 0.8;
        C.setXYZ(k, f, f * 0.42, f * 0.16);
      }
    }
    markDirty(P, C);
    if (trailMat.current) trailMat.current.uniforms.uPx.value = pixelScale(state.size.height, state.viewport.dpr, (state.camera as THREE.PerspectiveCamera).fov);
  });

  return (
    <group>
      {EDITS.map((_, i) => (
        <group key={i} ref={(g) => { pairs.current[i] = g; }} visible={false}>
          {/* the kept phrase sits above the struck one, as it did in the margin of the page */}
          <mesh geometry={geo} material={mats[i][0]} position={[0, WORD_H * 0.55, 0]} />
          <mesh geometry={geo} material={mats[i][1]} position={[0.08, -WORD_H * 0.55, 0]} scale={0.82} />
        </group>
      ))}
      <points geometry={trail} frustumCulled={false}>
        <shaderMaterial ref={trailMat} vertexShader={trailVert} fragmentShader={spriteFrag} uniforms={uTrail}
          transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>
    </group>
  );
}
