/* Minimal WebGL2 plumbing for the two GPU forms (reaction–diffusion and the transport network). */

export type GL = WebGL2RenderingContext;

export function getGL(canvas: HTMLCanvasElement): GL | null {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) return null;
  // float render targets are required for both simulations
  if (!gl.getExtension("EXT_color_buffer_float")) return null;
  return gl;
}

/** Full-screen triangle from gl_VertexID; no buffers needed. */
export const FULL_VS = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export function program(gl: GL, vs: string, fs: string) {
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
  const loc: Record<string, WebGLUniformLocation | null> = {};
  return {
    p,
    use() { gl.useProgram(p); },
    u(name: string) { return (loc[name] ??= gl.getUniformLocation(p, name)); },
  };
}

export type Target = { tex: WebGLTexture; fb: WebGLFramebuffer; w: number; h: number };

export function texture(
  gl: GL, w: number, h: number,
  internal: number, format: number, type: number,
  data: ArrayBufferView | null, filter: number = gl.NEAREST,
) {
  const t = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}

export function target(gl: GL, w: number, h: number, internal: number, format: number, type: number, data: ArrayBufferView | null, filter?: number): Target {
  const tex = texture(gl, w, h, internal, format, type, data, filter);
  const fb = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("framebuffer");
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { tex, fb, w, h };
}

/** The coverage mask as a single-channel texture (row 0 = top of the title). */
export function maskTexture(gl: GL, cols: number, rows: number, cov: Float32Array) {
  const b = new Uint8Array(cols * rows);
  for (let i = 0; i < b.length; i++) b[i] = Math.round(Math.min(1, cov[i]) * 255);
  return texture(gl, cols, rows, gl.R8, gl.RED, gl.UNSIGNED_BYTE, b, gl.LINEAR);
}

export function bindTex(gl: GL, unit: number, tex: WebGLTexture, loc: WebGLUniformLocation | null) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.uniform1i(loc, unit);
}

/** Palette shared by the GPU display passes (linear-ish sRGB, premultiplied on output). */
export const PALETTE_GLSL = `
const vec3 INK = vec3(0.098, 0.090, 0.078);
const vec3 EMBER = vec3(0.722, 0.275, 0.106);
const vec3 BRASS = vec3(0.851, 0.647, 0.357);
`;
