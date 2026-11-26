/*
 * Soft round point sprites, sized in world units and drawn additively. `uPx` converts world size at
 * unit depth to device pixels; set it per frame from the canvas height, the DPR and the camera fov.
 * Points smaller than about two pixels dim instead of shrinking, so the far cloud doesn't sparkle.
 */

export const spriteFrag = /* glsl */ `
  varying vec3 vColor;
  varying float vFade;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d2 = dot(c, c) * 4.0;
    float a = exp(-d2 * 7.0) + 0.16 * exp(-d2 * 1.8);
    a *= 1.0 - smoothstep(0.72, 1.0, d2);
    gl_FragColor = vec4(vColor * a * vFade, 1.0);
  }
`;

/** GLSL that turns `mv` (view-space position) and `size` (world units) into gl_PointSize and vFade. */
export const spriteSize = /* glsl */ `
  float px = size * uPx / max(0.1, -mv.z);
  vFade = clamp(px / 2.2, 0.0, 1.0);
  vFade *= vFade;
  gl_PointSize = max(px, 2.2);
`;

export function pixelScale(heightCss: number, dpr: number, fovDeg: number) {
  return (heightCss * dpr) / (2 * Math.tan((fovDeg * Math.PI) / 360));
}
