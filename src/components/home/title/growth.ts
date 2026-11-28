import { bindTex, FULL_VS, getGL, maskTexture, PALETTE_GLSL, program, target, type Target } from "./gl";
import { buildMask, fontSize, placeCanvas, rng } from "./mask";
import type { Engine, EngineCtx } from "./types";

/*
 * Self-sustaining pattern: the Gray–Scott reaction–diffusion model (Gray & Scott 1984; Pearson
 * 1993) on the GPU. Chemical U is fed in at rate F; V consumes it (U + 2V → 3V) and is removed
 * at rate F + k. Inside the letters the feed is on, so seeded V grows into a coral labyrinth that
 * fills each glyph. Outside the letters there is no feed and the pattern starves at the edge.
 * The pointer wipes the pattern away under it; while the feed flows it grows back.
 */

const GROW = 5200; // steps of fast growth
const DRIFT = 800; // slow steps before it holds still

const SIM_FS = `#version 300 es
precision highp float;
uniform sampler2D S;
uniform sampler2D M;
uniform vec2 FK;
// diffusion below 1 shrinks the pattern's wavelength so several bands fit across a stroke
const float DIFF = 0.42;
uniform vec4 PTR; // x, y (texels, top-down), radius, on
out vec4 o;
vec2 at(ivec2 c, ivec2 sz) { return texelFetch(S, clamp(c, ivec2(0), sz - 1), 0).xy; }
void main() {
  ivec2 sz = textureSize(S, 0);
  ivec2 c = ivec2(gl_FragCoord.xy);
  vec2 s = at(c, sz);
  vec2 lap = -s
    + 0.2 * (at(c + ivec2(1, 0), sz) + at(c - ivec2(1, 0), sz) + at(c + ivec2(0, 1), sz) + at(c - ivec2(0, 1), sz))
    + 0.05 * (at(c + ivec2(1, 1), sz) + at(c - ivec2(1, 1), sz) + at(c + ivec2(1, -1), sz) + at(c + ivec2(-1, 1), sz));
  float m = texelFetch(M, c, 0).r;
  float inside = smoothstep(0.35, 0.75, m);
  float F = FK.x * inside;
  float K = mix(0.075, FK.y, inside);
  float uvv = s.x * s.y * s.y;
  vec2 n = s + vec2(DIFF * lap.x - uvv + F * (1.0 - s.x), 0.5 * DIFF * lap.y + uvv - (F + K) * s.y);
  if (PTR.w > 0.5 && distance(vec2(c), PTR.xy) < PTR.z) n = vec2(1.0, 0.0);
  o = vec4(clamp(n, 0.0, 1.0), 0.0, 1.0);
}`;

const SHOW_FS = `#version 300 es
precision highp float;
uniform sampler2D S;
uniform sampler2D M;
uniform vec2 RES;
${PALETTE_GLSL}
out vec4 o;
void main() {
  vec2 uv = gl_FragCoord.xy / RES;
  uv.y = 1.0 - uv.y;
  float v = texture(S, uv).y;
  float m = texture(M, uv).r;
  float ink = smoothstep(0.16, 0.3, v);
  float edge = smoothstep(0.05, 0.16, v) * (1.0 - ink);
  // a faint ghost of the glyph keeps the word legible while the pattern is still growing
  float ghost = 0.1 * smoothstep(0.3, 0.7, m);
  vec3 col = INK * ink + EMBER * edge;
  float a = max(ink + edge * 0.9, ghost);
  col = mix(INK * ghost, col, step(ghost + 0.001, ink + edge * 0.9));
  o = vec4(col, a);
}`;

export function createGrowth({ canvas, h1, params, reduce, low, seed }: EngineCtx): Engine | null {
  const gl = getGL(canvas);
  if (!gl) return null;
  // CSS px per texel, scaled with the type so the pattern keeps the same size relative to a stroke
  const cell = Math.max(0.3, fontSize(h1) / 150);
  const m = buildMask(h1, cell, 8, 0, 2);
  if (!m) return null;
  const dpr = Math.min(2, devicePixelRatio || 1);
  placeCanvas(canvas, m, cell * dpr);
  canvas.style.imageRendering = "auto";
  const { cols, rows, cov } = m;

  let sim: ReturnType<typeof program>, show: ReturnType<typeof program>;
  try {
    sim = program(gl, FULL_VS, SIM_FS);
    show = program(gl, FULL_VS, SHOW_FS);
  } catch {
    return null;
  }

  // initial state: U = 1 everywhere, V seeded in small discs scattered through the glyphs
  const rand = rng(seed);
  const init = new Float32Array(cols * rows * 4);
  for (let i = 0; i < cols * rows; i++) init[i * 4] = 1;
  // sparse seeds through every glyph, so even an i's dot grows its own pattern
  for (let y = 2; y < rows - 2; y++) for (let x = 2; x < cols - 2; x++) {
    if (cov[y * cols + x] < 0.9 || rand() > 0.006) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const j = ((y + dy) * cols + x + dx) * 4;
      init[j] = 0.5; init[j + 1] = 0.25 + rand() * 0.1;
    }
  }
  const linear = gl.getExtension("OES_texture_float_linear") ? gl.LINEAR : gl.NEAREST;
  let a: Target, b: Target;
  try {
    a = target(gl, cols, rows, gl.RGBA32F, gl.RGBA, gl.FLOAT, init, linear);
    b = target(gl, cols, rows, gl.RGBA32F, gl.RGBA, gl.FLOAT, null, linear);
  } catch {
    return null;
  }
  const mask = maskTexture(gl, cols, rows, cov);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  let ptr: { x: number; y: number } | null = null;
  let done = 0;

  const step = (n: number) => {
    sim.use();
    gl.viewport(0, 0, cols, rows);
    gl.disable(gl.BLEND);
    gl.uniform2f(sim.u("FK"), params.feed, params.kill);
    bindTex(gl, 1, mask, sim.u("M"));
    for (let i = 0; i < n; i++) {
      gl.uniform4f(sim.u("PTR"), ptr?.x ?? 0, ptr?.y ?? 0, Math.max(10, rows * 0.16), ptr && i === 0 ? 1 : 0);
      if (i === 0) ptr = null;
      gl.bindFramebuffer(gl.FRAMEBUFFER, b.fb);
      bindTex(gl, 0, a.tex, sim.u("S"));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      [a, b] = [b, a];
    }
  };
  const render = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    show.use();
    gl.uniform2f(show.u("RES"), canvas.width, canvas.height);
    bindTex(gl, 0, a.tex, show.u("S"));
    bindTex(gl, 1, mask, show.u("M"));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  // reduced motion: grow to the finished pattern before the first paint
  if (reduce) { for (let i = 0; i < 30; i++) step(200); done = GROW + DRIFT; render(); }

  return {
    tick() {
      if (reduce) return false;
      // progress is counted in simulation steps, not wall time, so slow GPUs still finish growing
      const n = done < GROW ? (low ? 14 : 22) : done < GROW + DRIFT ? 4 : 0;
      if (n) { step(n); done += n; }
      render();
      return n > 0;
    },
    pointer(p) {
      if (!p) return;
      // wipe under the pointer on the next step, then let it regrow
      ptr = { x: (p.x + m.pad) / cell, y: (p.y + m.pad) / cell };
      done = Math.min(done, GROW - 1800);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
