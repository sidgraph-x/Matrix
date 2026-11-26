/*
 * Procedural Earth, evaluated per fragment from the body-frame position so there are no seams or poles
 * and detail holds up close. Nothing is downloaded: continents are domain-warped fBm thresholded at
 * sea level, cities cluster along coasts and around the Nodes, clouds are a second warped field.
 *
 * OCT_* defines control cost; Earth.tsx lowers them on "low" quality.
 */

export const NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
const mat3 ROT = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);
// fp: the pixel footprint in the units of p. Octaves finer than a couple of pixels fade out instead of aliasing.
float fbm(vec3 p, int oct, float fp) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 10; i++) {
    if (i >= oct) break;
    float w = 1.0 - smoothstep(0.35, 0.8, fp);
    if (w <= 0.0) break;
    s += a * w * snoise(p);
    p = ROT * p * 2.03; fp *= 2.03;
    a *= 0.5;
  }
  return s;
}
float ridged(vec3 p, int oct, float fp) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= oct) break;
    float w = 1.0 - smoothstep(0.25, 0.6, fp);
    float n = 1.0 - abs(snoise(p));
    s += a * mix(0.45, n * n, w);
    p = ROT * p * 2.1; fp *= 2.1;
    a *= 0.5;
  }
  return s;
}
`;

export const earthVert = /* glsl */ `
varying vec3 vP;
varying vec3 vW;
varying vec3 vN;
varying vec3 vSunObj;
uniform vec3 uSun;
void main() {
  vP = position;
  vSunObj = transpose(mat3(modelMatrix)) * uSun;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

export const earthFrag = /* glsl */ `
uniform vec3 uSun;
uniform float uTime;
uniform vec3 uNodes[4];
varying vec3 vSunObj;
varying vec3 vP;
varying vec3 vW;
varying vec3 vN;
${NOISE}

vec3 landWarp(vec3 p) {
  vec3 w = vec3(snoise(p * 1.1 + vec3(1.7, 9.2, 3.1)), snoise(p * 1.1 + vec3(8.3, 2.8, 5.4)), snoise(p * 1.1 + vec3(4.1, 6.5, 0.7)));
  return p * 1.9 + w * 0.7;
}
float landHeight(vec3 p, vec3 q, float fp) {
  float h = fbm(q, OCT_LAND, fp * 1.9) + 0.16 * ridged(q * 2.6, OCT_RIDGE, fp * 5.0) - 0.05;
  for (int i = 0; i < 4; i++) {
    float d = distance(p, uNodes[i]);
    h += 0.20 * exp(-d * d / 0.010);
  }
  return h;
}

// one soft light per lattice cell, at a hashed position: towns and their scatter
vec3 hash3(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}
float lights(vec3 p, float radius) {
  vec3 c = floor(p);
  vec3 h = hash3(c);
  vec3 o = c + 0.25 + 0.5 * h;
  float d = length(p - o);
  return exp(-d * d / (radius * radius)) * step(0.35, h.x) * (0.4 + 0.6 * h.y);
}

void main() {
  vec3 p = normalize(vP);
  vec3 V = normalize(cameraPosition - vW);
  vec3 L = normalize(uSun);

  // ---- surface
  float fp = length(fwidth(p));
  vec3 q = landWarp(p);
  float h = landHeight(p, q, fp);
  const float SEA = 0.035;
  float aa = max(fwidth(h) * 1.2, 0.0015);
  float land = smoothstep(SEA - aa, SEA + aa, h);
  float shelf = (1.0 - land) * smoothstep(SEA - 0.08, SEA, h);
  float elev = clamp((h - SEA) * 2.4, 0.0, 1.0);

  // hillshade: ridges compared one step toward the sun
  vec3 N0 = normalize(vN);
  vec3 N = N0;
  float ndl0 = dot(N0, L);
  vec3 Lo = normalize(vSunObj);
  vec3 Lt = normalize(Lo - p * dot(p, Lo) + 1e-5);
  float hill = 0.0;
  #if OCT_RIDGE > 2
  hill = ridged((q + Lt * 0.012) * 2.6, 4, fp * 5.0) - ridged(q * 2.6, 4, fp * 5.0);
  #endif
  float ndl = ndl0;
  float shade = clamp(1.0 + hill * 9.0 * land * smoothstep(0.0, 0.3, elev + 0.15), 0.35, 1.6);

  float lat = abs(p.y);
  float moist = fbm(p * 4.2 + vec3(3.0, 1.0, 7.0), 4, fp * 4.2) + 0.35 * (1.0 - smoothstep(0.0, 0.1, h - SEA));
  float dryBelt = exp(-pow((lat - 0.42) / 0.16, 2.0));
  float dry = smoothstep(-0.05, 0.35, dryBelt * 0.8 - moist);
  float grain = fbm(p * 70.0, OCT_GRAIN, fp * 70.0);

  vec3 forest = vec3(0.045, 0.068, 0.036);
  vec3 grass = vec3(0.120, 0.118, 0.066);
  vec3 desert = vec3(0.360, 0.270, 0.170);
  vec3 rock = vec3(0.190, 0.170, 0.150);
  vec3 snow = vec3(0.70, 0.72, 0.75);
  vec3 landCol = mix(forest, grass, smoothstep(-0.2, 0.25, -moist + 0.1));
  landCol = mix(landCol, desert, dry);
  landCol = mix(landCol, rock, smoothstep(0.45, 0.85, elev) * 0.7);
  landCol = mix(landCol, snow, smoothstep(0.84, 0.92, lat + elev * 0.12));
  landCol *= 0.78 + 0.44 * grain;

  vec3 deep = vec3(0.004, 0.014, 0.030);
  vec3 shallow = vec3(0.016, 0.065, 0.080);
  vec3 ocean = mix(deep, shallow, shelf * shelf);

  // ---- clouds, drifting slowly against the surface
  float ca = uTime * 0.006;
  vec3 cp = vec3(p.x * cos(ca) - p.z * sin(ca), p.y, p.x * sin(ca) + p.z * cos(ca));
  vec3 cw = vec3(snoise(cp * 2.0 + 11.0), snoise(cp * 2.0 + 23.0), snoise(cp * 2.0 + 37.0));
  float cn = fbm(cp * 3.4 + cw * 0.9, OCT_CLOUD, fp * 3.4);
  float streak = fbm(vec3(cp.x * 9.0, cp.y * 26.0, cp.z * 9.0) + cw * 2.0, 3, fp * 26.0);
  float clouds = smoothstep(0.12, 0.55, cn + 0.16 * streak) * 0.9;
  clouds *= 1.0 - 0.7 * dryBelt * smoothstep(0.0, 0.4, dry);
  // keep the sky over the Nodes mostly clear so the hardware reads
  float nodeNear = 0.0;
  for (int i = 0; i < 4; i++) { float d = distance(p, uNodes[i]); nodeNear += exp(-d * d / 0.0016); }
  clouds *= 1.0 - 0.85 * clamp(nodeNear, 0.0, 1.0);

  // ---- light
  float day = smoothstep(-0.08, 0.2, ndl0);
  float diff = max(ndl, 0.0);
  vec3 sunCol = vec3(1.0, 0.95, 0.88) * 2.3;
  vec3 albedo = mix(ocean, landCol, land);
  float cloudShadow = 1.0 - 0.5 * smoothstep(0.15, 0.6, fbm(cp * 3.4 + cw * 0.9 + L * 0.015, 3, fp * 3.4));
  vec3 col = albedo * (diff * sunCol * cloudShadow * mix(1.0, shade, land) + vec3(0.006, 0.008, 0.014));

  // ocean: sun glitter on wind-ruffled water, plus sky reflection at grazing angles
  vec3 T1 = normalize(cross(N0, vec3(0.0, 1.0, 0.0)));
  vec3 T2 = cross(N0, T1);
  float wv1 = 1.0 - smoothstep(0.25, 0.6, fp * 420.0), wv2 = 1.0 - smoothstep(0.25, 0.6, fp * 1500.0);
  vec3 Nw = normalize(N0 + 0.03 * wv1 * (T1 * snoise(p * 420.0) + T2 * snoise(p * 420.0 + 19.0)) + 0.012 * wv2 * (T1 * snoise(p * 1500.0) + T2 * snoise(p * 1500.0 + 7.0)));
  float rough = mix(0.35, 1.0, wv1);
  vec3 H = normalize(L + V);
  float nh = max(dot(Nw, H), 0.0);
  float mu = max(dot(N0, V), 0.0);
  float fres = 0.02 + 0.98 * pow(1.0 - mu, 5.0);
  float spec = pow(nh, 1400.0) * 3.5 * rough + pow(nh, 160.0) * 0.9 + pow(max(dot(N0, H), 0.0), 24.0) * 0.12;
  vec3 water = vec3(1.0, 0.88, 0.70) * spec * (0.3 + fres) * smoothstep(-0.02, 0.12, ndl0);
  col += water * (1.0 - land) * (1.0 - clouds);
  col += (1.0 - land) * fres * vec3(0.06, 0.14, 0.32) * day * 0.6;

  // clouds over everything, lit, faintly visible at night
  vec3 cloudLit = vec3(0.86, 0.87, 0.89) * (max(ndl0, 0.0) * sunCol * 0.85 + 0.006);
  col = mix(col, cloudLit, clouds * (0.3 + 0.7 * day));

  // ---- city lights: metros cluster on coasts, scatter inland, brightest around the Nodes; only after dusk
  float night = 1.0 - smoothstep(-0.14, 0.03, ndl0);
  float coast = 1.0 - smoothstep(0.0, 0.14, h - SEA);
  float metro = smoothstep(0.15, 0.6, fbm(p * 9.0 + 5.0, 3, fp * 9.0) + 0.35 * coast - 0.1);
  float lt1 = 1.0 - smoothstep(0.3, 0.8, fp * 140.0), lt2 = 1.0 - smoothstep(0.3, 0.8, fp * 420.0);
  float towns = mix(0.035, lights(p * 140.0, 0.16), lt1) * metro;
  float scatter = mix(0.03, lights(p * 420.0, 0.2), lt2) * (0.25 + metro);
  float sprawl = mix(0.06, smoothstep(0.55, 0.95, snoise(p * 260.0) * 0.5 + 0.5), lt2) * metro * metro;
  float core = clamp(nodeNear, 0.0, 1.0) * 0.6;
  float city = land * (towns * 1.4 + scatter * 0.9 + sprawl * 0.35 + core * (0.4 + scatter * 2.5));
  vec3 cityCol = mix(vec3(1.0, 0.50, 0.18), vec3(1.0, 0.78, 0.50), towns);
  col += cityCol * city * night * (1.0 - clouds * 0.8) * 1.5;

  // ---- haze only toward the limb (the shell adds the bright rim)
  float haze = pow(1.0 - mu, 5.0);
  vec3 hazeCol = vec3(0.20, 0.40, 0.92) * smoothstep(-0.1, 0.4, ndl0);
  col = mix(col, hazeCol, haze * 0.4 * day);

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/* Atmosphere: a shell drawn additively. Each pixel integrates density along its own view ray. */
export const atmoVert = /* glsl */ `
varying vec3 vW;
varying vec3 vC;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vC = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

export const atmoFrag = /* glsl */ `
uniform vec3 uSun;
uniform float uR;
uniform float uRa;
varying vec3 vW;
varying vec3 vC;
void main() {
  vec3 C = vC;
  vec3 ro = cameraPosition;
  vec3 rd = normalize(vW - ro);
  vec3 oc = ro - C;
  float tca = -dot(oc, rd);
  float b2 = dot(oc, oc) - tca * tca;
  float b = sqrt(max(b2, 0.0));
  float len, hgt;
  vec3 P;
  if (b < uR) {
    float tHit = tca - sqrt(uR * uR - b2);
    float tIn = tca - sqrt(max(uRa * uRa - b2, 0.0));
    len = (tHit - tIn) * 0.17; hgt = 0.0; P = ro + rd * tHit;
  } else {
    len = 2.0 * sqrt(max(uRa * uRa - b2, 0.0)); hgt = b - uR; P = ro + rd * tca;
  }
  float rim = b < uR ? 0.0 : 1.0;
  float dens = exp(-hgt / 0.09) + 0.22 * exp(-hgt / 0.45);
  float od = len * dens;
  vec3 n = normalize(P - C);
  float s = dot(n, normalize(uSun));
  float lit = smoothstep(-0.28, 0.3, s);
  float dusk = exp(-pow((s + 0.04) / 0.16, 2.0));
  float mie = pow(max(dot(rd, normalize(uSun)), 0.0), 10.0);
  vec3 col = vec3(0.26, 0.52, 1.0) * lit * (1.0 + 0.7 * mie) + vec3(1.0, 0.46, 0.16) * dusk * 0.8 * rim + vec3(0.02, 0.03, 0.06);
  float glow = 1.0 - exp(-od * 0.55);
  gl_FragColor = vec4(col * glow * 1.15, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
