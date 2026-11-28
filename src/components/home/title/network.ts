import { bindTex, FULL_VS, getGL, maskTexture, PALETTE_GLSL, program, target, type Target } from "./gl";
import { buildMask, fontSize, placeCanvas, rng } from "./mask";
import type { Engine, EngineCtx } from "./types";

/*
 * Transport network: a Physarum polycephalum model after Jones (2010), on the GPU. Agents live
 * inside the letters. Each one senses a chemical trail ahead, ahead-left and ahead-right, turns
 * towards the strongest, steps forward and deposits more trail; the trail diffuses and decays.
 * No agent sees more than a few pixels, yet together they lay down a network of veins that
 * thickens along the routes they share. The letters are both food and walls, so the network
 * converges on a single path through every stroke. The pointer is extra food the agents climb towards.
 */

// the network starts as fine filaments and coarsens; it is stopped while it still traces every stroke
const RUN = 150;

const AGENT_FS = `#version 300 es
precision highp float;
uniform sampler2D A;
uniform sampler2D TR;
uniform sampler2D M;
uniform vec4 SP; // sensor angle, sensor distance, turn angle, step
uniform vec2 SIZE;
uniform float T;
uniform vec4 PTR; // x, y, radius, on
uniform float FOOD;
out vec4 o;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float maskAt(vec2 p) { return texelFetch(M, ivec2(clamp(p, vec2(0.0), SIZE - 1.0)), 0).r; }
// the letters are food: agents may roam anywhere, but the glyphs attract them
float sense(vec2 p) {
  float t = texelFetch(TR, ivec2(clamp(p, vec2(0.0), SIZE - 1.0)), 0).r;
  vec2 d = p - PTR.xy;
  float ptr = PTR.w * 40.0 * exp(-dot(d, d) / (PTR.z * PTR.z));
  return t + FOOD * maskAt(p) + ptr;
}
vec2 dir(float a) { return vec2(cos(a), sin(a)); }
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  vec4 a = texelFetch(A, c, 0);
  vec2 p = a.xy;
  float ang = a.z;
  float f = sense(p + SP.y * dir(ang));
  float l = sense(p + SP.y * dir(ang + SP.x));
  float r = sense(p + SP.y * dir(ang - SP.x));
  float h = hash(vec2(c) + T);
  if (f > l && f > r) {}
  else if (f < l && f < r) ang += (h - 0.5) * 2.0 * SP.z;
  else if (l > r) ang += SP.z;
  else if (r > l) ang -= SP.z;
  vec2 np = p + dir(ang) * SP.w;
  if (maskAt(np) < 0.45) { np = p; ang = h * 6.2831853; }
  o = vec4(np, ang, 1.0);
}`;

const DEPOSIT_VS = `#version 300 es
uniform sampler2D A;
uniform vec2 SIZE;
uniform int AW;
void main() {
  vec2 p = texelFetch(A, ivec2(gl_VertexID % AW, gl_VertexID / AW), 0).xy;
  gl_Position = vec4((p + 0.5) / SIZE * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = 1.0;
}`;
const DEPOSIT_FS = `#version 300 es
precision highp float;
uniform float DEP;
out vec4 o;
void main() { o = vec4(DEP, 0.0, 0.0, 1.0); }`;

const DIFFUSE_FS = `#version 300 es
precision highp float;
uniform sampler2D TR;
uniform sampler2D M;
uniform float DECAY;
out vec4 o;
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  ivec2 sz = textureSize(TR, 0);
  float s = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) s += texelFetch(TR, clamp(c + ivec2(x, y), ivec2(0), sz - 1), 0).r;
  float m = texelFetch(M, c, 0).r;
  // trails off the glyphs fade faster, so the network concentrates on the letters
  o = vec4(s / 9.0 * DECAY * mix(0.7, 1.0, smoothstep(0.2, 0.6, m)), 0.0, 0.0, 1.0);
}`;

const SHOW_FS = `#version 300 es
precision highp float;
uniform sampler2D TR;
uniform sampler2D M;
uniform vec2 RES;
uniform float GAIN;
${PALETTE_GLSL}
out vec4 o;
void main() {
  vec2 uv = gl_FragCoord.xy / RES;
  uv.y = 1.0 - uv.y;
  float t = texture(TR, uv).r;
  float m = texture(M, uv).r;
  float v = 1.0 - exp(-t * GAIN);
  float ink = smoothstep(0.04, 0.7, v);
  float ghost = 0.11 * smoothstep(0.3, 0.7, m);
  vec3 col = INK;
  float a = max(ink * mix(0.42, 1.0, smoothstep(0.2, 0.6, m)), ghost);
  o = vec4(col * a, a);
}`;

export function createNetwork({ canvas, h1, params, reduce, low, seed }: EngineCtx): Engine | null {
  const gl = getGL(canvas);
  if (!gl) return null;
  const cell = Math.max(0.3, fontSize(h1) / 140);
  const m = buildMask(h1, cell, 14, 0, 2);
  if (!m) return null;
  const dpr = Math.min(2, devicePixelRatio || 1);
  placeCanvas(canvas, m, cell * dpr);
  canvas.style.imageRendering = "auto";
  const { cols, rows, cov } = m;

  let agentP, depP, difP, showP;
  try {
    agentP = program(gl, FULL_VS, AGENT_FS);
    depP = program(gl, DEPOSIT_VS, DEPOSIT_FS);
    difP = program(gl, FULL_VS, DIFFUSE_FS);
    showP = program(gl, FULL_VS, SHOW_FS);
  } catch {
    return null;
  }

  // agents spawn uniformly inside the glyphs
  const inside: number[] = [];
  for (let i = 0; i < cov.length; i++) if (cov[i] > 0.6) inside.push(i);
  if (!inside.length) return null;
  const count = Math.min(low ? 120000 : 520000, Math.round(inside.length * params.density));
  const AW = 512, AH = Math.ceil(count / AW);
  const rand = rng(seed);
  const init = new Float32Array(AW * AH * 4);
  for (let k = 0; k < AW * AH; k++) {
    const i = inside[(rand() * inside.length) | 0];
    init[k * 4] = (i % cols) + rand();
    init[k * 4 + 1] = Math.floor(i / cols) + rand();
    init[k * 4 + 2] = rand() * Math.PI * 2;
    init[k * 4 + 3] = 1;
  }
  let a: Target, b: Target, ta: Target, tb: Target;
  try {
    a = target(gl, AW, AH, gl.RGBA32F, gl.RGBA, gl.FLOAT, init);
    b = target(gl, AW, AH, gl.RGBA32F, gl.RGBA, gl.FLOAT, null);
    ta = target(gl, cols, rows, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, null, gl.LINEAR);
    tb = target(gl, cols, rows, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, null, gl.LINEAR);
  } catch {
    return null;
  }
  const mask = maskTexture(gl, cols, rows, cov);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const deg = Math.PI / 180;
  let food: { x: number; y: number } | null = null;
  let frame = 0;
  let done = 0;

  const step = () => {
    frame++;
    // 1. agents sense and move
    agentP.use();
    gl.disable(gl.BLEND);
    gl.viewport(0, 0, AW, AH);
    gl.bindFramebuffer(gl.FRAMEBUFFER, b.fb);
    bindTex(gl, 0, a.tex, agentP.u("A"));
    bindTex(gl, 1, ta.tex, agentP.u("TR"));
    bindTex(gl, 2, mask, agentP.u("M"));
    gl.uniform4f(agentP.u("SP"), params.angle * deg, params.reach, params.angle * deg, 1);
    gl.uniform2f(agentP.u("SIZE"), cols, rows);
    gl.uniform1f(agentP.u("T"), (frame % 997) * 0.137);
    gl.uniform1f(agentP.u("FOOD"), params.food);
    gl.uniform4f(agentP.u("PTR"), food?.x ?? 0, food?.y ?? 0, Math.max(8, rows * 0.25), food ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    [a, b] = [b, a];
    // 2. deposit
    depP.use();
    gl.viewport(0, 0, cols, rows);
    gl.bindFramebuffer(gl.FRAMEBUFFER, ta.fb);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    bindTex(gl, 0, a.tex, depP.u("A"));
    gl.uniform2f(depP.u("SIZE"), cols, rows);
    gl.uniform1i(depP.u("AW"), AW);
    gl.uniform1f(depP.u("DEP"), 1);
    gl.drawArrays(gl.POINTS, 0, count);
    gl.disable(gl.BLEND);
    // 3. diffuse and decay
    difP.use();
    gl.bindFramebuffer(gl.FRAMEBUFFER, tb.fb);
    bindTex(gl, 0, ta.tex, difP.u("TR"));
    bindTex(gl, 1, mask, difP.u("M"));
    gl.uniform1f(difP.u("DECAY"), params.decay);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    [ta, tb] = [tb, ta];
  };
  const render = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    showP.use();
    gl.uniform2f(showP.u("RES"), canvas.width, canvas.height);
    gl.uniform1f(showP.u("GAIN"), 0.9 / Math.max(0.05, params.density) * (1 - params.decay));
    bindTex(gl, 0, ta.tex, showP.u("TR"));
    bindTex(gl, 1, mask, showP.u("M"));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  if (reduce) { for (let i = 0; i < RUN; i++) step(); render(); }

  return {
    tick() {
      if (reduce) return false;
      const n = done < RUN ? 1 : 0;
      for (let i = 0; i < n; i++) step();
      done += n;
      render();
      return n > 0;
    },
    pointer(p) {
      food = p ? { x: (p.x + m.pad) / cell, y: (p.y + m.pad) / cell } : null;
      if (p) done = Math.min(done, RUN - 40);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
