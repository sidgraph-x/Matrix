import { defViz, rng, clamp, lerp, ease } from "./engine";
/* Figures for computational problems 1.1-5.4 */
{
/* ---------- 1.1 Hubbard ---------- */
defViz("1.1", {
  toggle: ["t′ ≈ −0.2t · d-wave pairs", "t′ = 0 · filled stripes"],
  legend: [["dot", "Cu site"], ["spin", "Spin ↑↓"], ["hole", "Hole"], ["dash", "Pair bond (d-wave)"]],
  caption: "The one-band Hubbard model on the CuO₂ square lattice at 1/8 hole doping. With next-nearest-neighbour hopping t′, combined DMRG and AFQMC calculations find d-wave superconductivity (2024); without it, holes order into filled stripes separating antiphase antiferromagnetic domains (2020). Deciding which ground state wins needs energy differences smaller than today's method error bars. Schematic.",
  init(s) { const r = rng(13); s.r = r; s.pairs = Array.from({ length: 9 }, () => ({ i: 1 + Math.floor(r() * 22), j: 1 + Math.floor(r() * 11), h: r() < 0.5, t: r() })); },
  step(s, dt) { s.pairs.forEach((p) => { p.t -= dt; if (p.t < 0) { p.t = 0.5 + s.r() * 0.7; const k = Math.floor(s.r() * 4); p.i = clamp(p.i + [1, -1, 0, 0][k], 1, 22); p.j = clamp(p.j + [0, 0, 1, -1][k], 1, 11); if (s.r() < 0.2) p.h = !p.h; } }); },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const d = Math.max(26, Math.min(40, W / 26)), nx = Math.floor(W / d), ny = Math.floor((H - 40) / d), ox = (W - (nx - 1) * d) / 2, oy = 36 + (H - 36 - (ny - 1) * d) / 2;
    const holes = new Set();
    s.pairs.forEach((p) => { holes.add(p.i + "," + p.j); holes.add((p.h ? p.i + 1 : p.i) + "," + (p.h ? p.j : p.j + 1)); });
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const x = ox + i * d, y = oy + j * d;
      if (i + 1 < nx) g.line(x, y, x + d, y, col.grid, 1); if (j + 1 < ny) g.line(x, y, x, y + d, col.grid, 1);
      const stripe = i % 8 === 3, m = s.mix;
      const hA = holes.has(i + "," + j), hB = stripe;
      const spinA = (i + j) % 2 === 0, spinB = (i + j + Math.floor((i + 5) / 8)) % 2 === 0;
      if (m < 0.5) { if (hA) g.hole(x, y, 5, col.acc); else g.spin(x, y, spinA, d * 0.26, col.ink); }
      else { if (hB) g.hole(x, y, 5, col.acc); else g.spin(x, y, spinB, d * 0.26, col.ink); }
    }
    if (s.mix < 0.5) s.pairs.forEach((p) => { const x = ox + p.i * d, y = oy + p.j * d, x2 = p.h ? x + d : x, y2 = p.h ? y : y + d; if (p.i < nx - 1 && p.j < ny - 1) { g.line(x, y, x2, y2, col.acc, 1.4, [3, 3]); g.text(p.h ? "+" : "−", (x + x2) / 2 + (p.h ? 0 : 9), (y + y2) / 2 - (p.h ? 9 : 0), { align: "center", color: col.acc, size: 12 }); } });
    else for (let i = 3; i < nx; i += 8) g.text("stripe", ox + i * d, oy - 18, { align: "center", color: col.acc });
    const px = ox + 2 * d, py = oy + (ny - 2) * d;
    if (!g.narrow) { g.text("t", px + d / 2, py + 12, { align: "center", color: col.mute }); g.line(px, py, px + d, py - d, col.mute, 1, [2, 3]); g.text("t′", px + d / 2 + 10, py - d / 2, { color: col.mute }); }
    g.corner("one-band Hubbard model · H = −t Σ c†c − t′ Σ c†c + U Σ n↑n↓ · p = 1/8", "tl");
  },
});

/* ---------- 1.2 exchange-correlation ---------- */
defViz("1.2", {
  toggle: ["Semi-local functional (GGA)", "Target: exact functional"],
  legend: [["line", "Exact energy"], ["accline", "Density functional approximation"], ["warm", "Error"]],
  caption: "Stretching H₂ is a textbook test. Near equilibrium, semi-local functionals are close to exact; as the bond breaks, each electron should localise on one atom, but the approximate functional spreads charge across both and the energy is far too high (delocalisation and static-correlation error). Learned functionals now reach chemical accuracy for small molecules; this regime and correlated solids remain open. Shapes schematic; exact curve is a Morse fit (De 4.75 eV, Re 0.74 Å).",
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const De = 4.75, Re = 0.74, a = 1.94, ex = (R) => De * (1 - Math.exp(-a * (R - Re))) ** 2 - De;
    const err = (R) => (1 - s.mix) * 2.0 / (1 + Math.exp(-(R - 1.9) * 2.6)) + 0.12 * (1 - s.mix);
    const b = { x: 64, y: H * 0.12, w: g.narrow ? W - 90 : W * 0.56, h: H * 0.7 };
    const ax = g.axes(b, [0.4, 4], [-5.2, 1], { xt: [0.5, 1, 2, 3, 4], yt: [-5, -4, -3, -2, -1, 0, 1], xl: "H–H distance R (Å)", yl: "energy (eV)", ygrid: true });
    const P1 = [], P2 = [];
    for (let R = 0.45; R <= 4; R += 0.02) { P1.push([ax.X(R), ax.Y(ex(R))]); P2.push([ax.X(R), ax.Y(ex(R) + err(R))]); }
    g.poly(P2.concat(P1.slice().reverse()), null, 0, { close: true, fill: col.warm, alpha: 0.18 });
    g.poly(P1, col.ink, 2); g.poly(P2, col.acc, 2);
    let R0 = s.ptr.x > b.x && s.ptr.x < b.x + b.w ? 0.4 + ((s.ptr.x - b.x) / b.w) * 3.6 : 3.2;
    g.line(ax.X(R0), b.y, ax.X(R0), b.y + b.h, col.mute, 0.8, [3, 3]);
    g.text(`error at R = ${R0.toFixed(2)} Å: ${err(R0).toFixed(2)} eV`, ax.X(R0) + 6, b.y + 10, { color: col.warm });
    g.text("1 kcal/mol ≈ 0.043 eV = chemical accuracy", b.x + 8, b.y + b.h - 12, { color: col.mute, size: 10.5 });
    if (!g.narrow) {
      const x = W * 0.72, rungs = ["learned (DM21, Skala)", "double hybrid", "hybrid", "meta-GGA (SCAN, r2SCAN)", "GGA (PBE)", "LDA"];
      g.text("Jacob's ladder", x, H * 0.14, { weight: 600 });
      rungs.forEach((r, i) => { const y = H * 0.22 + i * (H * 0.1); g.line(x, y + 10, x + W * 0.22, y + 10, col.mute, 1); g.text(r, x + 4, y, { color: i === 0 ? col.acc : col.ink }); });
      g.arrow(x - 14, H * 0.22 + 5 * H * 0.1 + 6, x - 14, H * 0.2, col.mute, 1);
      g.text("cost ↑ accuracy ↑", x, H * 0.22 + 6 * H * 0.1, { color: col.mute, size: 10.5 });
    }
  },
});

/* ---------- 1.3 sign problem ---------- */
defViz("1.3", {
  slider: { label: "Inverse temperature β", min: 1, max: 12, step: 0.5, value: 4, fmt: (v) => v.toFixed(1) },
  legend: [["accline", "Worldline configuration with weight +"], ["warmline", "Configuration with weight − (odd exchange)"], ["dash", "⟨sign⟩ ∝ e^(−βNΔf)"]],
  caption: "Quantum Monte Carlo samples particle worldlines in imaginary time. For fermions, configurations where particles exchange carry negative weight, and positive and negative contributions cancel. The average sign falls exponentially with inverse temperature and system size, so the samples needed grow exponentially: the general problem is NP-hard (Troyer and Wiese, 2005). Sampler simplified for illustration.",
  init(s) { s.r = rng(17); s.cfg = null; s.cnt = 0; s.sum = 0; s.tm = 0; },
  step(s, dt) {
    s.tm -= dt;
    if (s.tm <= 0) {
      s.tm = 0.45; const N = 5, L = 12, T = Math.round(s.val * 6);
      let pos = Array.from({ length: N }, (_, i) => 2 + i * 2); const paths = pos.map((p) => [p]);
      for (let t = 0; t < T; t++) pos = pos.map((p, i) => { const q = s.r() < 0.35 ? clamp(p + (s.r() < 0.5 ? -1 : 1), 0, L - 1) : p; paths[i].push(q); return q; });
      const order = pos.map((p, i) => [p, i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((x) => x[1]);
      let inv = 0; for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) if (order[i] > order[j]) inv++;
      const sign = inv % 2 ? -1 : 1; s.cfg = { paths, sign, L, T }; s.cnt++; s.sum += sign;
    }
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear(); if (!s.cfg) return;
    const { paths, sign, L, T } = s.cfg;
    const b = { x: 40, y: H * 0.12, w: g.narrow ? W - 70 : W * 0.42, h: H * 0.72 };
    for (let i = 0; i < L; i++) g.line(b.x + (i / (L - 1)) * b.w, b.y, b.x + (i / (L - 1)) * b.w, b.y + b.h, col.faint);
    paths.forEach((p) => g.poly(p.map((x, t) => [b.x + (x / (L - 1)) * b.w, b.y + b.h - (t / T) * b.h]), sign > 0 ? col.acc : col.warm, 1.8));
    g.text("sites →", b.x + b.w, b.y + b.h + 14, { align: "right", color: col.mute }); g.text("imaginary time τ ↑ (0 to β)", b.x, b.y - 12, { color: col.mute });
    g.text(sign > 0 ? "weight +" : "weight −", b.x + b.w, b.y - 12, { align: "right", color: sign > 0 ? col.acc : col.warm, weight: 600 });
    if (!g.narrow) {
      const c = { x: W * 0.6, y: H * 0.16, w: W * 0.34, h: H * 0.6 };
      const ax = g.axes(c, [0, 12], [0.001, 1], { ylog: true, xt: [0, 4, 8, 12], yt: [0.001, 0.01, 0.1, 1], xl: "β", yl: "average sign ⟨s⟩" });
      const pts = []; for (let b2 = 0; b2 <= 12; b2 += 0.2) pts.push([ax.X(b2), ax.Y(Math.exp(-0.55 * b2))]);
      g.poly(pts, col.acc, 1.6, { dash: [5, 3] });
      const sv = Math.exp(-0.55 * s.val); g.dot(ax.X(s.val), ax.Y(sv), 5, col.warm);
      g.text(`⟨s⟩ ≈ ${sv.toPrecision(2)} → ~${Math.round(1 / (sv * sv)).toLocaleString()}× more samples`, c.x + c.w, c.y - 14, { align: "right", weight: 600 });
    }
  },
});

/* ---------- 1.4 Allen-Dynes ---------- */
defViz("1.4", {
  toggle: ["ω_log = 30 meV · typical metal", "ω_log = 120 meV · light hydride"],
  slider: { label: "Electron-phonon coupling λ", min: 0.3, max: 3, step: 0.05, value: 1.0, fmt: (v) => v.toFixed(2) },
  legend: [["accline", "Allen–Dynes Tc(λ), μ* = 0.10"], ["warm", "Strong coupling: lattice-instability risk"], ["dash", "77 K and 293 K"]],
  caption: "Conventional Tc follows from the phonon spectrum: Tc ≈ (ω_log/1.2)·exp[−1.04(1+λ)/(λ − μ*(1+0.62λ))]. Stiff, light lattices (high ω_log) and strong coupling λ push Tc up, but strong coupling softens phonons and destabilises the crystal. That trade-off is why near-room-temperature hydrides need megabar pressure, and why a rigorous ambient-pressure bound is open.",
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const wK = s.mode ? 1393 : 348, mu = 0.1;
    const Tc = (l) => { const den = l - mu * (1 + 0.62 * l); return den <= 0 ? 0 : (wK / 1.2) * Math.exp((-1.04 * (1 + l)) / den); };
    const b = { x: 64, y: H * 0.12, w: g.narrow ? W - 90 : W * 0.58, h: H * 0.7 };
    const ax = g.axes(b, [0.3, 3], [0, 350], { xt: [0.5, 1, 1.5, 2, 2.5, 3], yt: [0, 77, 150, 293], yf: (v) => v + " K", xl: "λ", yl: "Tc" });
    g.rect(ax.X(2), b.y, ax.X(3) - ax.X(2), b.h, col.warm, null, 0, 0.1);
    g.text("instability risk", ax.X(2.5), b.y + 12, { align: "center", color: col.warm });
    [77, 293].forEach((v) => g.line(b.x, ax.Y(v), b.x + b.w, ax.Y(v), col.mute, 1, [4, 4]));
    const pts = []; for (let l = 0.3; l <= 3; l += 0.02) pts.push([ax.X(l), ax.Y(Math.min(350, Tc(l)))]);
    g.poly(pts, col.acc, 2);
    const t = Tc(s.val); g.dot(ax.X(s.val), ax.Y(Math.min(350, t)), 6, col.ink);
    g.text(`Tc ≈ ${t.toFixed(0)} K`, ax.X(s.val) + 10, ax.Y(Math.min(350, t)) - 12, { weight: 600 });
    if (!g.narrow) {
      const c = { x: W * 0.74, y: H * 0.2, w: W * 0.21, h: H * 0.42 };
      const ax2 = g.axes(c, [0, 200], [0, 1.2], { xt: [0, 100, 200], yt: [], xl: "ω (meV)", yl: "α²F(ω)" });
      const sc = s.mode ? 1 : 0.25, P = [];
      for (let w = 0; w <= 200; w += 2) { const v = 0.7 * Math.exp(-(((w - 22 * (s.mode ? 1.3 : 1)) / (8 * (s.mode ? 1.5 : 1))) ** 2)) + (s.mode ? 0.9 * Math.exp(-(((w - 150) / 22) ** 2)) : 0.5 * Math.exp(-(((w - 32) / 6) ** 2))); P.push([ax2.X(w), ax2.Y(v * Math.min(1.4, s.val / 1.2) * (0.8 + 0.2 * sc))]); }
      g.poly(P, col.acc, 1.6);
      g.text(s.mode ? "H vibrations at high ω" : "heavy-atom phonons", c.x, c.y + c.h + 28, { color: col.mute, size: 10.5 });
    }
  },
});

/* ---------- 1.5 synthesisability ---------- */
defViz("1.5", {
  toggle: ["Thermodynamics only", "Reveal synthesis outcomes"],
  legend: [["line", "Convex hull"], ["dot", "Phase on hull"], ["acc", "Made in the lab"], ["hole", "Attempted, not made"]],
  caption: "Formation energy against composition for a hypothetical binary system. Phases on the lower convex hull are thermodynamically stable; distance above the hull is the usual synthesisability proxy. Revealing outcomes shows why it fails: some metastable phases are made easily (kinetics, precursors), some near-hull phases never form. Points illustrative; hover for energy above hull.",
  init(s) {
    const r = rng(29); s.pts = [];
    for (let i = 0; i < 46; i++) { const x = 0.05 + r() * 0.9; const base = -0.55 * Math.sin(Math.PI * x) * (0.8 + 0.4 * Math.sin(5 * x)); s.pts.push({ x, e: base + Math.pow(r(), 1.8) * 0.5 }); }
    s.pts.push({ x: 0, e: 0 }, { x: 1, e: 0 });
    const P = s.pts.slice().sort((a, b) => a.x - b.x), hull = [];
    P.forEach((p) => { while (hull.length >= 2) { const a = hull[hull.length - 2], b = hull[hull.length - 1]; if ((b.x - a.x) * (p.e - a.e) - (b.e - a.e) * (p.x - a.x) <= 0) hull.pop(); else break; } hull.push(p); });
    s.hull = hull;
    const hAt = (x) => { for (let i = 0; i < hull.length - 1; i++) if (x >= hull[i].x && x <= hull[i + 1].x) return lerp(hull[i].e, hull[i + 1].e, (x - hull[i].x) / (hull[i + 1].x - hull[i].x)); return 0; };
    s.pts.forEach((p) => { p.eh = p.e - hAt(p.x); p.made = p.eh < 0.005 ? r() < 0.8 : r() < Math.max(0.08, 0.6 - p.eh * 2.2); });
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const b = { x: 70, y: H * 0.1, w: W - 100, h: H * 0.74 };
    const ax = g.axes(b, [0, 1], [-0.75, 0.3], { xt: [0, 0.25, 0.5, 0.75, 1], xf: (v) => (v === 0 ? "A" : v === 1 ? "B" : "x=" + v), yt: [-0.6, -0.4, -0.2, 0, 0.2], xl: "composition", yl: "formation energy (eV/atom)" });
    g.poly(s.hull.map((p) => [ax.X(p.x), ax.Y(p.e)]), col.ink, 1.6);
    let best = null, bd = 1e9;
    s.pts.forEach((p) => {
      const x = ax.X(p.x), y = ax.Y(p.e), on = p.eh < 0.005;
      if (s.mix < 0.5) { if (on) g.dot(x, y, 4.5, col.ink); else g.ring(x, y, 4, col.mute, 1.2); }
      else { if (p.made) g.dot(x, y, 4.5, on ? col.ink : col.acc); else g.hole(x, y, 4.5, col.acc); }
      const dd = Math.hypot(s.ptr.x - x, s.ptr.y - y); if (dd < bd && dd < 20) { bd = dd; best = [x, y, p]; }
    });
    if (best) { g.ring(best[0], best[1], 9, col.ink); g.text(`${(best[2].eh * 1000).toFixed(0)} meV/atom above hull${s.mix > 0.5 ? (best[2].made ? " · made" : " · not made") : ""}`, best[0] + 12, best[1] - 14, { weight: 600 }); }
    g.text("stable", ax.X(0.5), ax.Y(-0.7), { align: "center", color: col.mute });
  },
});

/* ---------- 1.6 OER scaling plane ---------- */
defViz("1.6", {
  toggle: ["Free point · any catalyst", "Constrained to scaling line"],
  legend: [["line", "Scaling relation ΔG(OOH) = ΔG(OH) + 3.2 eV"], ["dash", "Ideal: ΔG(OOH) = ΔG(OH) + 2.46 eV"], ["soft", "Low overpotential region"]],
  caption: "Each catalyst site is a point on the plane of *OH and *OOH binding. Assuming *O sits at its best position between them, the theoretical overpotential is η = max(step) − 1.23 V. Real oxides and metals fall near the scaling line, whose best point still has η ≈ 0.37 V. Drag the catalyst; constrained mode keeps it on the line.",
  init(s) { s.p = [1.0, 4.4]; },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const b = { x: 70, y: H * 0.1, w: W - 110, h: H * 0.74 };
    const ax = g.axes(b, [0, 2], [2, 5.5], { xt: [0, 0.5, 1, 1.5, 2], yt: [2, 3, 4, 5], xl: "ΔG(*OH) (eV)", yl: "ΔG(*OOH) (eV)" });
    const eta = (oh, ooh) => { const o = (oh + ooh) / 2; return Math.max(oh, o - oh, ooh - o, 4.92 - ooh) - 1.23; };
    const n = 40; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const oh = (i + 0.5) / n * 2, ooh = 2 + (j + 0.5) / n * 3.5, e = eta(oh, ooh); const a = Math.max(0, 0.5 - e) * 0.9; if (a > 0.01) g.rect(ax.X(i / n * 2), ax.Y(2 + (j + 1) / n * 3.5), b.w / n + 0.5, b.h / n + 0.5, col.acc, null, 0, a * 0.6); }
    g.line(ax.X(0), ax.Y(3.2), ax.X(2), ax.Y(5.2), col.ink, 1.6);
    g.line(ax.X(0), ax.Y(2.46), ax.X(2), ax.Y(4.46), col.acc, 1.4, [5, 4]);
    if (s.ptr.down && s.ptr.x > b.x && s.ptr.x < b.x + b.w && s.ptr.y > b.y && s.ptr.y < b.y + b.h) s.p = [((s.ptr.x - b.x) / b.w) * 2, 2 + ((b.y + b.h - s.ptr.y) / b.h) * 3.5];
    let [oh, ooh] = s.p; if (s.mode) { ooh = oh + 3.2; }
    const e = eta(oh, ooh); const x = ax.X(oh), y = ax.Y(ooh);
    g.dot(x, y, 7, col.ink); g.ring(x, y, 12, col.ink, 1, [2, 2]);
    g.text(`η = ${e.toFixed(2)} V`, x + 16, y - 12, { weight: 600, color: e < 0.38 ? col.acc : col.ink });
    g.text("drag me", x + 16, y + 6, { color: col.mute, size: 10.5 });
    g.text("best on scaling line: η ≈ 0.37 V", b.x + b.w, b.y + 10, { align: "right", color: col.mute });
  },
});

/* ---------- 1.7 ion hopping ---------- */
defViz("1.7", {
  toggle: ["bcc anion framework", "fcc anion framework"],
  legend: [["grey", "Anion (S²⁻)"], ["acc", "Li⁺"], ["accline", "Migration energy along path"]],
  caption: "In the best sulfide conductors the anions form a body-centred-cubic lattice, letting lithium hop directly between face-sharing tetrahedral sites with a barrier around 0.15 eV. In fcc frameworks the path goes through an octahedral site, around 0.4 eV. At room temperature that difference changes the hop rate by roughly 10⁴. Barriers approximate (Wang et al., Nature Materials 2015); real conductivity also depends on disorder, grain boundaries and interfaces.",
  init(s) { s.r = rng(5); s.ion = { i: 4, f: 0, tgt: 4 }; s.wait = 0.4; s.hops = 0; },
  step(s, dt) {
    const Ea = s.mode ? 0.4 : 0.15, rate = 2.5 * Math.exp(-(Ea - 0.15) / 0.06);
    if (s.ion.f > 0) { s.ion.f += dt * 2.5; if (s.ion.f >= 1) { s.ion.i = s.ion.tgt; s.ion.f = 0; s.hops++; } }
    else { s.wait -= dt; if (s.wait <= 0) { if (s.r() < rate * 0.5) { s.ion.tgt = clamp(s.ion.i + (s.r() < 0.5 ? 1 : -1), 0, 9); s.ion.f = 0.001; } s.wait = 0.3; } }
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const d = Math.min(W / 12, 64), x0 = (W - 10 * d) / 2, y0 = H * 0.18;
    for (let i = 0; i <= 10; i++) for (let j = 0; j <= 3; j++) { g.dot(x0 + i * d, y0 + j * d, 6, col.mute); if (!s.mode && i < 10 && j < 3) g.dot(x0 + (i + 0.5) * d, y0 + (j + 0.5) * d, 6, col.mute); if (s.mode && i < 10 && j < 3 && (i + j) % 2 === 0) g.dot(x0 + (i + 0.5) * d, y0 + (j + 0.5) * d, 6, col.mute); }
    const yy = y0 + 1.5 * d, siteX = (k) => x0 + (k + 0.5) * d;
    for (let k = 0; k < 10; k++) g.ring(siteX(k), yy + (s.mode ? 0 : d * 0.25), 4, col.acc, 1, [2, 2]);
    const i = s.ion.i, f = s.ion.f, tx = s.ion.tgt;
    const x = lerp(siteX(i), siteX(tx), ease(Math.min(1, f))), arc = s.mode ? Math.sin(Math.min(1, f) * Math.PI) * d * 0.25 : 0;
    g.dot(x, yy + (s.mode ? -arc : d * 0.25), 7, col.acc);
    const b = { x: x0, y: H * 0.62, w: 10 * d, h: H * 0.24 };
    const ax = g.axes(b, [0, 10], [0, 0.5], { xt: [], yt: [0, 0.2, 0.4], yf: (v) => v + " eV", yl: "migration energy" });
    const Ea = s.mode ? 0.4 : 0.15, P = [];
    for (let u = 0; u <= 10; u += 0.02) { const ph = u % 1; P.push([ax.X(u), ax.Y(s.mode ? 0.4 * Math.sin(2 * ph * Math.PI) ** 2 + 0.12 * Math.sin(ph * Math.PI) ** 2 : Ea * Math.sin(ph * Math.PI) ** 2)]); }
    g.poly(P, col.acc, 2);
    g.text(`barrier ≈ ${Ea} eV · relative hop rate at 300 K ≈ ${s.mode ? "1" : "1.6×10⁴"}`, W - 20, H * 0.08, { align: "right", weight: 600 });
    g.text(s.mode ? "tetrahedral → octahedral → tetrahedral" : "tetrahedral → tetrahedral (face-sharing)", x0, H * 0.08, { color: col.mute });
  },
});

/* ---------- 2.1 metadynamics ---------- */
defViz("2.1", {
  toggle: ["Plain molecular dynamics", "Metadynamics · biased"],
  legend: [["line", "Free-energy contour"], ["acc", "System state"], ["soft", "Deposited bias (Gaussian hills)"]],
  caption: "A system trapped in one free-energy basin almost never crosses the barrier in the time a simulation can afford. Metadynamics adds small Gaussian hills where the system has been, filling the basin until it escapes, and the accumulated bias estimates the free-energy surface. It only works well if the chosen coordinates capture the slow motion, which is the open problem for complex materials. Toy two-dimensional potential.",
  init(s) { s.r = rng(3); s.x = -1; s.y = 0; s.h = []; s.cross = 0; s.side = -1; s.dep = 0; s.trail = []; },
  step(s, dt) {
    const V = (x, y) => 1.2 * (x * x - 1) ** 2 + 1.6 * y * y + 0.25 * x * y;
    const B = (x, y) => s.h.reduce((a, h) => a + 0.12 * Math.exp(-((x - h[0]) ** 2 + (y - h[1]) ** 2) / 0.08), 0);
    const kT = 0.13, sub = 6;
    for (let k = 0; k < sub; k++) {
      const e = 1e-3, F = (x, y) => V(x, y) + B(x, y);
      const gx = (F(s.x + e, s.y) - F(s.x - e, s.y)) / (2 * e), gy = (F(s.x, s.y + e) - F(s.x, s.y - e)) / (2 * e), h = 0.004;
      const n1 = Math.sqrt(-2 * Math.log(s.r() + 1e-9)) * Math.cos(6.283 * s.r()), n2 = Math.sqrt(-2 * Math.log(s.r() + 1e-9)) * Math.cos(6.283 * s.r());
      s.x += -gx * h + Math.sqrt(2 * kT * h) * n1; s.y += -gy * h + Math.sqrt(2 * kT * h) * n2;
    }
    s.x = clamp(s.x, -2, 2); s.y = clamp(s.y, -1.3, 1.3);
    const side = s.x > 0 ? 1 : -1; if (Math.abs(s.x) > 0.7 && side !== s.side) { s.cross++; s.side = side; }
    s.dep += dt; if (s.mode && s.dep > 0.15) { s.dep = 0; s.h.push([s.x, s.y]); if (s.h.length > 400) s.h.shift(); }
    if (!s.mode && s.h.length) s.h = [];
    s.trail.push([s.x, s.y]); if (s.trail.length > 120) s.trail.shift();
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const V = (x, y) => 1.2 * (x * x - 1) ** 2 + 1.6 * y * y + 0.25 * x * y;
    const X = (x) => W * 0.08 + ((x + 2) / 4) * W * 0.84, Y = (y) => H * 0.12 + ((1.3 - y) / 2.6) * H * 0.62;
    const cx = 170, cy = 70, lv = (i, j) => Math.floor(V(-2 + (i + 0.5) / cx * 4, -1.3 + (j + 0.5) / cy * 2.6) * 4);
    for (let i = 0; i < cx - 1; i++) for (let j = 0; j < cy - 1; j++) { const a = lv(i, j); if (a < 14 && (a !== lv(i + 1, j) || a !== lv(i, j + 1))) g.rect(X(-2 + (i + 1) / cx * 4) - 0.6, Y(-1.3 + (j + 1) / cy * 2.6) - 0.6, 1.3, 1.3, col.mute); }
    const nx = 64, ny = 30;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const x = -2 + (i + 0.5) / nx * 4, y = -1.3 + (j + 0.5) / ny * 2.6;
      if (s.h.length) { const bsum = s.h.reduce((a, h) => a + 0.12 * Math.exp(-((x - h[0]) ** 2 + (y - h[1]) ** 2) / 0.08), 0); if (bsum > 0.05) g.rect(X(x - 2 / nx), Y(y + 1.3 / ny), W * 0.84 / nx + 0.5, H * 0.62 / ny + 0.5, col.acc, null, 0, Math.min(0.35, bsum * 0.4)); }
    }
    g.poly(s.trail.map(([x, y]) => [X(x), Y(y)]), col.acc, 0.8);
    g.dot(X(s.x), Y(s.y), 6, col.acc);
    g.text("basin A", X(-1), Y(-1.05), { align: "center", color: col.mute }); g.text("basin B", X(1), Y(-1.05), { align: "center", color: col.mute });
    const b = { x: W * 0.08, y: H * 0.8, w: W * 0.84, h: H * 0.12 };
    const P = [], Q = [];
    for (let x = -2; x <= 2; x += 0.04) { const v = V(x, 0); P.push([X(x), b.y + b.h - Math.min(1, v / 3) * b.h]); const bb = s.h.reduce((a, h) => a + 0.12 * Math.exp(-((x - h[0]) ** 2) / 0.08), 0); Q.push([X(x), b.y + b.h - Math.min(1, (v + bb) / 3) * b.h]); }
    g.poly(P, col.ink, 1.4); if (s.h.length) g.poly(Q, col.acc, 1.4, { dash: [4, 3] });
    g.text(`barrier crossings: ${s.cross}`, W - 20, 22, { align: "right", weight: 600 });
  },
});

/* ---------- 2.2 cascade survival (arc-dpa) ---------- */
defViz("2.2", {
  slider: { label: "Damage energy", min: 0.1, max: 200, step: 0.1, value: 20, fmt: (v) => v.toFixed(1) + " keV" },
  legend: [["line", "NRT displacements"], ["accline", "arc-dpa: surviving defects"], ["acc", "Surviving Frenkel pair"]],
  caption: "The standard NRT model counts displaced atoms as 0.8·T/(2E_d). Molecular dynamics shows most of them recombine within picoseconds: only about 30% survive at high energy (arc-dpa, Nordlund et al. 2018). Carrying that surviving damage forward from picoseconds to decades, with helium in the mix, is the multiscale problem. Iron parameters: E_d = 40 eV, b = −0.568, c = 0.286.",
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const Ed = 0.04, b0 = -0.568, c0 = 0.286;
    const nrt = (T) => (T < Ed ? 0 : T < 2 * Ed / 0.8 ? 1 : (0.8 * T) / (2 * Ed));
    const xi = (T) => ((1 - c0) / Math.pow(2 * Ed / 0.8, b0)) * Math.pow(T, b0) + c0;
    const arc = (T) => (T < 2 * Ed / 0.8 ? nrt(T) : nrt(T) * Math.min(1, xi(T)));
    const T = s.val, nN = nrt(T), nA = arc(T);
    const b = { x: 70, y: H * 0.12, w: g.narrow ? W - 100 : W * 0.48, h: H * 0.7 };
    const ax = g.axes(b, [0.1, 200], [1, 5000], { xlog: true, ylog: true, xt: [0.1, 1, 10, 100], xf: (v) => v + " keV", yt: [1, 10, 100, 1000], xl: "damage energy", yl: "defects" });
    const P1 = [], P2 = []; for (let e = -1; e <= 2.3; e += 0.03) { const t = 10 ** e; P1.push([ax.X(t), ax.Y(Math.max(1, nrt(t)))]); P2.push([ax.X(t), ax.Y(Math.max(1, arc(t)))]); }
    g.poly(P1, col.ink, 1.6); g.poly(P2, col.acc, 2);
    g.dot(ax.X(T), ax.Y(Math.max(1, nN)), 5, col.ink); g.dot(ax.X(T), ax.Y(Math.max(1, nA)), 5, col.acc);
    g.text(`NRT ${nN.toFixed(0)} · surviving ${nA.toFixed(0)} (${((nA / Math.max(1, nN)) * 100).toFixed(0)}%)`, b.x + 6, b.y + 6, { weight: 600 });
    if (!g.narrow) {
      const cx = W * 0.78, cy = H * 0.48, R = Math.min(W * 0.18, H * 0.36) * Math.min(1, 0.35 + Math.log10(T * 10) / 3.6), r = rng(Math.round(T * 10));
      const ph = (g.t % 3) / 3, d = 12;
      for (let x = cx - W * 0.19; x < cx + W * 0.19; x += d) for (let y = cy - H * 0.36; y < cy + H * 0.36; y += d) {
        const dist = Math.hypot(x - cx, y - cy);
        if (dist < R && ph < 0.35) { const a = Math.atan2(y - cy, x - cx); g.dot(x + Math.cos(a) * 6 * ph * 3, y + Math.sin(a) * 6 * ph * 3, 1.7, col.warm); } else g.dot(x, y, 1.6, col.mute);
      }
      const nShow = Math.min(60, Math.round(nA / Math.max(1, nN / 60)));
      if (ph >= 0.35) for (let k = 0; k < Math.min(nShow, Math.round(nA)); k++) { const a = r() * 6.28, rr = r() * R; g.hole(cx + Math.cos(a) * rr * 0.6, cy + Math.sin(a) * rr * 0.6, 3, col.acc); g.dot(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 2.6, col.acc); }
      g.text(ph < 0.35 ? "thermal spike · ~1 ps" : "after recombination · ~10 ps", cx, cy + H * 0.4, { align: "center", color: col.mute });
    }
  },
});

/* ---------- 2.3 SEI growth ---------- */
defViz("2.3", {
  toggle: ["Baseline electrolyte", "With film-forming additive"],
  legend: [["grey", "Electrolyte molecule"], ["acc", "Inorganic SEI (e.g. LiF)"], ["ring", "Organic SEI"], ["accline", "Capacity retention"]],
  caption: "On every cycle a little electrolyte is reduced at the anode surface, forming the solid-electrolyte interphase. The layer protects the electrode but consumes lithium, and its growth is roughly diffusion-limited, so capacity fades about as the square root of time. Additives change its composition and growth rate. Predicting that from chemistry, rather than measuring it over months, is open. Schematic.",
  init(s) { s.r = rng(12); s.m = Array.from({ length: 50 }, () => ({ x: s.r(), y: s.r(), vx: s.r() - 0.5, vy: s.r() - 0.5 })); s.cyc = 0; s.sei = []; },
  step(s, dt, g) {
    s.cyc += dt * 60; if (s.cyc > 1000) { s.cyc = 0; s.sei = []; }
    const k = s.mode ? 0.45 : 1, thick = k * Math.sqrt(s.cyc) / Math.sqrt(1000);
    s.m.forEach((p) => { p.x += p.vx * dt * 0.1; p.y += p.vy * dt * 0.1; if (p.x < 0 || p.x > 1) p.vx *= -1; if (p.y > 1) p.vy *= -1; if (p.y < 0.02 + thick * 0.5) { p.vy = Math.abs(p.vy); if (s.r() < 0.15 && s.sei.length < 600) s.sei.push({ x: p.x, y: s.r() * thick * 0.5, inorg: s.r() < (s.mode ? 0.75 : 0.4) }); } });
    s.th = thick;
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const x0 = 30, x1 = g.narrow ? W - 30 : W * 0.58, yb = H * 0.82, yt = H * 0.12, P = (u, v) => [lerp(x0, x1, u), lerp(yb, yt, v)];
    for (let k = 0; k < 5; k++) g.line(x0, yb + 6 + k * 5, x1, yb + 6 + k * 5, col.ink, 1.2);
    g.text("graphite anode", x0, yb + 40, { color: col.mute });
    s.sei.forEach((p) => { const [x, y] = P(p.x, p.y); if (p.inorg) g.dot(x, y, 2.4, col.acc); else g.ring(x, y, 2.6, col.ink, 0.8); });
    s.m.forEach((p) => { const [x, y] = P(p.x, Math.max(p.y, (s.th || 0) * 0.5 + 0.04)); g.dot(x - 3, y, 1.8, col.mute); g.dot(x, y - 2, 2.2, col.mute); g.dot(x + 3, y, 1.8, col.mute); });
    g.text("SEI", x1 + 6, P(0, (s.th || 0) * 0.25)[1], { color: col.acc });
    if (!g.narrow) {
      const b = { x: W * 0.68, y: H * 0.16, w: W * 0.27, h: H * 0.6 };
      const ax = g.axes(b, [0, 1000], [0.8, 1.0], { xt: [0, 500, 1000], yt: [0.8, 0.9, 1], yf: (v) => (v * 100).toFixed(0) + "%", xl: "cycles", yl: "capacity" });
      const curve = (k) => { const P1 = []; for (let c = 0; c <= 1000; c += 10) P1.push([ax.X(c), ax.Y(1 - 0.18 * k * Math.sqrt(c / 1000))]); return P1; };
      g.poly(curve(1), s.mode ? col.mute : col.acc, s.mode ? 1 : 2); g.poly(curve(0.45), s.mode ? col.acc : col.mute, s.mode ? 2 : 1);
      const k = s.mode ? 0.45 : 1; g.dot(ax.X(s.cyc), ax.Y(1 - 0.18 * k * Math.sqrt(s.cyc / 1000)), 5, col.ink);
      g.text(`cycle ${Math.round(s.cyc)}`, b.x + b.w, b.y - 14, { align: "right", weight: 600 });
    }
  },
});

/* ---------- 2.4 boiling curve ---------- */
defViz("2.4", {
  slider: { label: "Applied heat flux", min: 3, max: 7, step: 0.02, value: 5.4, fmt: (v) => (10 ** v / 1e4).toFixed(v > 5 ? 0 : 1) + " W/cm²" },
  legend: [["line", "Boiling curve (water, 1 atm)"], ["acc", "Operating point"], ["warm", "Film boiling after burnout"]],
  caption: "Nukiyama's boiling curve for saturated water at atmospheric pressure. Raising heat flux moves the surface through natural convection and nucleate boiling to the critical heat flux (about 110 W/cm² here); past it, vapour blankets the surface and temperature jumps by hundreds of degrees. Coming back down follows the film branch until the Leidenfrost point (hysteresis). Approximate values; no theory predicts CHF from first principles.",
  init(s) { s.film = false; s.r = rng(4); s.bub = []; },
  step(s, dt) {
    const q = 10 ** s.val; if (q > 1.1e6) s.film = true; if (q < 2e4) s.film = false;
    const rate = s.film ? 0 : q > 2e4 ? Math.min(1, (Math.log10(q) - 4.3) / 1.6) : 0;
    if (s.r() < rate) s.bub.push({ x: s.r(), y: 0, r: 2 + s.r() * 3 });
    s.bub.forEach((b) => { b.y += dt * (0.4 + b.r * 0.05); b.r += dt * 2; }); s.bub = s.bub.filter((b) => b.y < 1);
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const curve = [[1, 1e3], [5, 1e4], [8, 4e4], [15, 3e5], [30, 1.1e6]], film = [[120, 2e4], [300, 5e4], [600, 1.2e5], [1000, 2.4e5], [1500, 5e5], [2500, 1.1e6]];
    const b = { x: 70, y: H * 0.1, w: g.narrow ? W - 100 : W * 0.56, h: H * 0.72 };
    const ax = g.axes(b, [1, 3000], [1e3, 1e7], { xlog: true, ylog: true, xt: [1, 10, 100, 1000], xf: (v) => v + " K", yt: [1e3, 1e4, 1e5, 1e6, 1e7], yf: (v) => (v / 1e4 >= 1 ? v / 1e4 : v / 1e4) + "", xl: "wall superheat ΔT", yl: "heat flux (W/cm²)" });
    g.poly(curve.map(([x, y]) => [ax.X(x), ax.Y(y)]), col.ink, 2);
    g.poly([[ax.X(30), ax.Y(1.1e6)], [ax.X(120), ax.Y(2e4)]], col.mute, 1.2, { dash: [4, 3] });
    g.poly(film.map(([x, y]) => [ax.X(x), ax.Y(y)]), col.warm, 2);
    g.text("CHF", ax.X(30), ax.Y(1.1e6) - 12, { align: "center", weight: 600 }); g.text("Leidenfrost", ax.X(120), ax.Y(2e4) + 14, { align: "center", color: col.mute });
    g.text("nucleate", ax.X(12), ax.Y(1.2e5), { align: "right", color: col.mute }); g.text("film", ax.X(900), ax.Y(3e5), { color: col.warm });
    const q = 10 ** s.val, interp = (arr) => { for (let i = 0; i < arr.length - 1; i++) if (q >= arr[i][1] && q <= arr[i + 1][1]) { const f = (Math.log10(q) - Math.log10(arr[i][1])) / (Math.log10(arr[i + 1][1]) - Math.log10(arr[i][1])); return 10 ** lerp(Math.log10(arr[i][0]), Math.log10(arr[i + 1][0]), f); } return q < arr[0][1] ? arr[0][0] : arr[arr.length - 1][0]; };
    const dT = s.film ? interp(film) : interp(curve);
    g.dot(ax.X(dT), ax.Y(q), 7, s.film ? col.warm : col.acc);
    g.text(`ΔT ≈ ${dT.toFixed(0)} K`, ax.X(dT) + 12, ax.Y(q) - 12, { weight: 600 });
    if (!g.narrow) {
      const x0 = W * 0.7, x1 = W * 0.95, y0 = H * 0.18, y1 = H * 0.78;
      g.rect(x0, y1, x1 - x0, 10, s.film ? col.warm : col.ink);
      if (s.film) g.rect(x0, y1 - 18, x1 - x0, 18, col.warm, null, 0, 0.3);
      s.bub.forEach((bb) => g.ring(lerp(x0 + 8, x1 - 8, bb.x), lerp(y1 - 6, y0, bb.y), bb.r, col.ink, 1));
      g.text(s.film ? "vapour film" : "heated surface", (x0 + x1) / 2, y1 + 24, { align: "center", color: col.mute });
    }
  },
});

/* ---------- 2.5 turbulence spectrum ---------- */
defViz("2.5", {
  toggle: ["LES · resolve large eddies", "RANS · model all turbulence"],
  slider: { label: "LES filter cutoff k_c", min: 0.5, max: 2.6, step: 0.05, value: 1.4, fmt: (v) => "10^" + v.toFixed(1) },
  legend: [["line", "Energy spectrum E(k)"], ["soft", "Resolved"], ["warm", "Modelled (closure)"], ["acc", "Tracer"]],
  caption: "Turbulent energy cascades from large eddies to small ones along the k⁻⁵ᐟ³ inertial range until viscosity dissipates it. Direct simulation resolves everything at enormous cost; large-eddy simulation resolves eddies larger than a cutoff and models the rest; RANS models all of it. Every closure is an approximation, and data-driven closures still fail on flows unlike their training data. Spectrum is the model Kolmogorov form.",
  init(s) { const r = rng(10); s.v = Array.from({ length: 14 }, () => ({ x: r(), y: r(), w: (r() - 0.5) * 2, R: 0.05 + r() * 0.12 })); s.p = Array.from({ length: 360 }, () => ({ x: r(), y: r() })); s.r = r; },
  step(s, dt) {
    const small = s.mode ? 0 : 1;
    s.p.forEach((p) => {
      let u = 0.06, v = 0;
      s.v.forEach((o) => { if (s.mode && o.R < 0.1) return; const dx = p.x - o.x, dy = p.y - o.y, r2 = dx * dx + dy * dy + 0.002; const f = (o.w * 0.012) / r2 * Math.exp(-r2 / (o.R * o.R)); u += -dy * f; v += dx * f; });
      p.x += u * dt * 2.5; p.y += v * dt * 2.5 * (small ? 1 : 0.4);
      if (p.x > 1) p.x -= 1; if (p.y < 0 || p.y > 1) { p.y = s.r(); p.x = 0; }
    });
    s.v.forEach((o) => { o.x += 0.03 * dt; if (o.x > 1.1) o.x = -0.1; });
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const fh = H * 0.4;
    s.p.forEach((p) => g.dot(20 + p.x * (W - 40), 14 + p.y * fh, 1.4, col.acc));
    g.text(s.mode ? "mean flow only" : "resolved eddies", W - 20, 22, { align: "right", color: col.mute });
    const b = { x: 70, y: H * 0.58, w: W - 100, h: H * 0.3 };
    const ax = g.axes(b, [0, 3.2], [-6, 1], { xt: [0, 1, 2, 3], xf: (v) => "10^" + v, yt: [-5, -3, -1, 1], yf: (v) => "10^" + v, xl: "wavenumber k", yl: "E(k)" });
    const E = (lk) => { const k = 10 ** lk; return Math.log10(1.5 * k ** -1.667 * Math.exp(-((k / 600) ** 1.3)) * (k ** 4 / (1 + k ** 4))); };
    const kc = s.mode ? 0 : s.val, P = [], R = [], M = [];
    for (let lk = 0; lk <= 3.2; lk += 0.02) { const y = clamp(E(lk), -6, 1); P.push([ax.X(lk), ax.Y(y)]); (lk <= kc ? R : M).push([ax.X(lk), ax.Y(y)]); }
    if (R.length > 1) g.poly(R.concat([[R[R.length - 1][0], ax.Y(-6)], [R[0][0], ax.Y(-6)]]), null, 0, { close: true, fill: col.acc, alpha: 0.18 });
    if (M.length > 1) g.poly(M.concat([[M[M.length - 1][0], ax.Y(-6)], [M[0][0], ax.Y(-6)]]), null, 0, { close: true, fill: col.warm, alpha: 0.2 });
    g.poly(P, col.ink, 1.8);
    if (!s.mode) { g.line(ax.X(kc), b.y, ax.X(kc), b.y + b.h, col.ink, 1, [4, 3]); g.text("k_c", ax.X(kc) + 4, b.y + 8); }
    g.text("k^(−5/3)", ax.X(1.6), ax.Y(E(1.6)) - 14, { color: col.mute });
  },
});

/* ---------- 3.1 quasisymmetry ---------- */
defViz("3.1", {
  toggle: ["Quasi-axisymmetric (QA)", "Quasi-helical (QH, N = 4)"],
  slider: { label: "Symmetry-breaking amplitude", min: 0, max: 0.3, step: 0.01, value: 0.04, fmt: (v) => v.toFixed(2) },
  legend: [["line", "|B| contour on a flux surface"], ["acc", "Trapped particle"], ["accline", "Field line"]],
  caption: "On a magnetic surface unrolled into poloidal angle θ and toroidal angle φ, quasisymmetry means |B| depends on a single combination of angles, so its contours are straight. Then trapped particles bounce without drifting out. Symmetry-breaking terms bend the contours and particles leak. Whether exact quasisymmetry can hold throughout a volume is unproven (Garren-Boozer). Model field |B|/B₀ = 1 + 0.15 cos(θ − Nφ) + ε cos(θ + 3φ).",
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const N = s.mode ? 4 : 0, eps = s.val;
    const B = (th, ph) => 1 + 0.15 * Math.cos(th - N * ph) + eps * Math.cos(th + 3 * ph);
    const b = { x: 60, y: H * 0.1, w: W - 90, h: H * 0.74 };
    const ax = g.axes(b, [0, 6.2832], [0, 6.2832], { xt: [0, 3.1416, 6.2832], xf: (v) => (v ? (v > 4 ? "2π" : "π") : "0"), yt: [0, 3.1416, 6.2832], yf: (v) => (v ? (v > 4 ? "2π" : "π") : "0"), xl: "toroidal angle φ (one field period ×)", yl: "poloidal angle θ" });
    const nx = 120, ny = 70, levels = [0.88, 0.94, 1.0, 1.06, 1.12];
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const ph = (i / nx) * 6.2832, th = (j / ny) * 6.2832, v = B(th, ph);
      const x = ax.X(ph), y = ax.Y(th);
      g.rect(x, y - b.h / ny, b.w / nx + 0.6, b.h / ny + 0.6, v > 1 ? col.acc : col.bg, null, 0, Math.abs(v - 1) * 1.6);
    }
    const cx = 220, cy = 130, q = (i, j) => Math.floor((B((j / cy) * 6.2832, (i / cx) * 6.2832) - 0.85) / 0.05);
    for (let i = 0; i < cx; i++) for (let j = 0; j < cy; j++) { const a = q(i, j); if (a !== q(i + 1, j) || a !== q(i, j + 1)) g.rect(ax.X((i + 0.5) / cx * 6.2832) - 0.7, ax.Y((j + 0.5) / cy * 6.2832) - 0.7, 1.4, 1.4, col.ink); }
    const iota = 0.42, ph0 = (g.t * 0.6) % 6.2832;
    const fl = []; for (let ph = 0; ph <= 6.2832; ph += 0.03) fl.push([ax.X(ph), ax.Y((1.2 + iota * ph) % 6.2832)]);
    fl.forEach((p, i) => { if (i && Math.abs(p[1] - fl[i - 1][1]) < b.h * 0.5) g.line(fl[i - 1][0], fl[i - 1][1], p[0], p[1], col.acc, 1); });
    const tB = (ph) => B((1.2 + iota * ph) % 6.2832, ph);
    let pph = 2.4 + Math.sin(g.t * 1.3) * 1.1 + eps * g.t * 2 % 3;
    pph = ((pph % 6.2832) + 6.2832) % 6.2832;
    g.dot(ax.X(pph), ax.Y((1.2 + iota * pph) % 6.2832), 6, col.acc);
    g.text(eps < 0.02 ? "contours straight · particle confined" : "contours bent · bounce points drift", b.x + b.w, b.y - 14, { align: "right", weight: 600, color: eps < 0.02 ? col.acc : col.warm });
  },
});

/* ---------- 3.2 stiff transport ---------- */
defViz("3.2", {
  toggle: ["Stiff (ITG above threshold)", "Reduced stiffness (shear, shaping)"],
  slider: { label: "Heating power", min: 1, max: 10, step: 0.1, value: 3, fmt: (v) => v.toFixed(1) + " × base" },
  legend: [["accline", "Heat flux vs gradient"], ["dash", "Critical gradient"], ["line", "Resulting temperature profile"]],
  caption: "Ion-temperature-gradient turbulence switches on above a critical normalised gradient R/L_T and then grows steeply. With stiff transport, doubling heating barely raises the gradient, so core temperature is pinned to the edge value. Predicting threshold and stiffness from first principles, at reactor scale and with uncertainty, is what reduced models and surrogates try to do. Model: Q = χ(R/L_T − κc)^1.5 above κc = 4.",
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const kc = 4, chi = s.mode ? 0.6 : 6, P = s.val;
    const Q = (k) => (k < kc ? 0.05 * k : 0.05 * k + chi * (k - kc) ** 1.5);
    let lo = 0, hi = 30; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (Q(m) < P) lo = m; else hi = m; }
    const kop = lo;
    const b = { x: 60, y: H * 0.12, w: g.narrow ? W - 90 : W * 0.4, h: H * 0.7 };
    const ax = g.axes(b, [0, 14], [0, 10], { xt: [0, 4, 8, 12], yt: [0, 5, 10], xl: "R/L_T", yl: "heat flux Q" });
    const pts = []; for (let k = 0; k <= 14; k += 0.05) pts.push([ax.X(k), ax.Y(Math.min(10, Q(k)))]);
    g.poly(pts, col.acc, 2); g.line(ax.X(kc), b.y, ax.X(kc), b.y + b.h, col.acc, 1, [4, 3]);
    g.line(b.x, ax.Y(P), ax.X(kop), ax.Y(P), col.mute, 0.8, [2, 3]); g.dot(ax.X(kop), ax.Y(P), 6, col.ink);
    g.text(`R/L_T = ${kop.toFixed(2)}`, ax.X(kop) + 10, ax.Y(P) + 14, { weight: 600 });
    if (!g.narrow) {
      const c = { x: W * 0.58, y: H * 0.12, w: W * 0.36, h: H * 0.7 };
      const ax2 = g.axes(c, [0, 1], [0, 12], { xt: [0, 0.5, 1], yt: [0, 4, 8, 12], xl: "radius ρ", yl: "T (keV)" });
      const prof = (k) => { const pts2 = []; for (let r = 1; r >= 0; r -= 0.01) { const T = 1.5 * Math.exp((k / 3) * (1 - r) * 0.55); pts2.push([ax2.X(r), ax2.Y(Math.min(12, T))]); } return pts2; };
      g.poly(prof(kop), col.ink, 2);
      g.text(`core T ≈ ${Math.min(99, 1.5 * Math.exp((kop / 3) * 0.55)).toFixed(1)} keV`, c.x + c.w, c.y - 12, { align: "right", weight: 600 });
    }
  },
});

/* ---------- 3.3 disruption prediction ---------- */
defViz("3.3", {
  toggle: ["Same machine as training", "New machine (transfer)"],
  slider: { label: "Alarm threshold", min: 0.2, max: 0.95, step: 0.01, value: 0.6, fmt: (v) => v.toFixed(2) },
  legend: [["line", "Plasma current"], ["grey", "Locked-mode amplitude"], ["accline", "Predicted disruption risk"], ["warm", "Alarm and disruption"]],
  caption: "A predictor watches diagnostic signals and raises an alarm before the current quench. Lower thresholds give more warning but more false alarms. On a new machine, precursors look different, warning time shrinks and calibration breaks; a reactor cannot afford to learn from its own disruptions. Synthetic signals.",
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const shot = Math.floor(g.t / 5) % 3, disrupt = shot !== 1, td = 1.6, tr = s.mode ? 1.45 : 1.15;
    const r = rng(shot * 7 + 3 + s.mode * 11);
    const noise = Array.from({ length: 201 }, () => r() - 0.5);
    const Ip = (t) => (t < 0.2 ? t / 0.2 : disrupt && t > td ? Math.max(0, 1 - (t - td) / 0.03) : 1);
    const lm = (t) => (disrupt && t > tr ? Math.min(1, ((t - tr) / (td - tr)) ** 2) : 0) + 0.06 * Math.abs(noise[Math.floor(t * 100)] || 0) + (shot === 1 && t > 1.0 && t < 1.2 ? 0.35 : 0);
    const risk = (t) => clamp((s.mode ? 0.65 : 1) * lm(t) * 1.25 + 0.06 * (noise[Math.floor(t * 100)] || 0), 0, 1);
    const b = { x: 60, y: H * 0.1, w: W - 90, h: H * 0.72 };
    const ax = g.axes(b, [0, 2], [0, 1.1], { xt: [0, 0.5, 1, 1.5, 2], xf: (v) => v + " s", yt: [] });
    const now = Math.min(2, (g.t % 5) * 0.55);
    const ser = (f, c, lw) => { const P = []; for (let t = 0; t <= now; t += 0.01) P.push([ax.X(t), ax.Y(f(t))]); g.poly(P, c, lw); };
    ser(Ip, col.ink, 2); ser((t) => lm(t) * 0.8, col.mute, 1.2); ser(risk, col.acc, 2);
    g.line(b.x, ax.Y(s.val), b.x + b.w, ax.Y(s.val), col.acc, 1, [4, 3]);
    let ta = null; for (let t = 0.2; t <= 2; t += 0.01) if (risk(t) > s.val) { ta = t; break; }
    if (ta !== null && ta <= now) { g.line(ax.X(ta), b.y, ax.X(ta), b.y + b.h, col.warm, 1.4); g.text("alarm", ax.X(ta) - 6, b.y + 10, { align: "right", color: col.warm, weight: 600 }); }
    if (disrupt && now > td) { g.line(ax.X(td), b.y, ax.X(td), b.y + b.h, col.ink, 1.4, [3, 3]); g.text("current quench", ax.X(td) + 6, b.y + 10); }
    const warn = ta !== null && disrupt ? Math.max(0, td - ta) * 1000 : null;
    const msg = disrupt ? (warn !== null && ta < td ? `warning time ${warn.toFixed(0)} ms` : "missed disruption") : ta !== null ? "false alarm (non-disruptive shot)" : "correctly quiet (non-disruptive shot)";
    g.text(`shot ${shot + 1} · ${msg}`, W - 20, 18, { align: "right", weight: 600, color: msg.includes("missed") || msg.includes("false") ? col.warm : col.ink });
  },
});

/* ---------- 3.4 tritium breeding Monte Carlo ---------- */
defViz("3.4", {
  button: "New nuclear-data sample",
  legend: [["warm", "Tritium produced (⁶Li(n,α)t)"], ["acc", "Neutron track"], ["line", "TBR distribution across data samples"], ["dash", "Design target TBR = 1.05"]],
  caption: "Monte Carlo transport follows neutrons from the plasma through the first wall into a lithium breeder with a beryllium multiplier, counting tritium made per fusion neutron. Each press redraws cross-sections within their uncertainties and reruns, building the spread of the breeding ratio. Published DEMO studies find nuclear-data spreads of a few per cent, similar to the design margin. Toy one-dimensional model tuned to TBR ≈ 1.1 with a ~2% spread.",
  init(s) { s.r = rng(19); s.samples = []; s.tracks = []; s.run = null; s.newRun = () => { const f = 1 + (s.r() - 0.5) * 0.12, m = 1 + (s.r() - 0.5) * 0.14; s.run = { f, m, n: 0, t: 0 }; }; s.newRun(); },
  onButton(s) { if (s.run && s.run.n > 800) s.samples.push(s.run.t / s.run.n); s.newRun(); },
  step(s, dt) {
    const run = s.run;
    for (let k = 0; k < 40; k++) {
      const q = [[0.02, 0.5 + (s.r() - 0.5) * 0.8]]; run.n++;
      while (q.length) {
        let [x, y] = q.pop(); const pts = [[x, y]]; let alive = true, hit = false;
        while (alive) {
          const dir = s.r() < 0.88 ? 1 : -1; x += -Math.log(s.r() + 1e-9) * 0.12 * dir; y += (s.r() - 0.5) * 0.12;
          if (x < 0) { pts.push([0, y]); break; }
          if (x > 1) x = 2 - x;
          pts.push([x, y]); const u = s.r();
          if (x > 0.08 && x < 0.3 && u < 0.18 * run.m) q.push([x, y]);
          else if (x > 0.3 && u < 0.3 * run.f) { run.t++; hit = true; alive = false; }
          else if (u > 0.99) alive = false;
        }
        if (hit) pts[pts.length - 1][2] = 1;
        if (s.tracks.length < 40 || s.r() < 0.04) { s.tracks.push(pts); if (s.tracks.length > 40) s.tracks.shift(); }
      }
    }
    if (run.n > 2400) { s.samples.push(run.t / run.n); if (s.samples.length > 60) s.samples.shift(); s.newRun(); }
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const x0 = 30, x1 = g.narrow ? W - 30 : W * 0.55, y0 = H * 0.14, y1 = H * 0.86, X = (u) => lerp(x0 + 30, x1, u), Y = (v) => lerp(y0, y1, clamp(v, 0, 1));
    g.rect(x0, y0, 30, y1 - y0, col.acc, null, 0, 0.15); g.text("plasma", x0 + 15, y1 + 14, { align: "center", color: col.mute });
    g.rect(X(0), y0, X(0.08) - X(0), y1 - y0, col.faint, col.ink); g.rect(X(0.08), y0, X(0.3) - X(0.08), y1 - y0, col.bg, col.mute);
    g.rect(X(0.3), y0, X(1) - X(0.3), y1 - y0, col.warm, col.mute, 1, 0.06);
    g.text("first wall", X(0.04), y0 - 12, { align: "center", size: 10.5 }); g.text("Be multiplier", X(0.19), y0 - 12, { align: "center", size: 10.5 }); g.text("Li breeder", X(0.65), y0 - 12, { align: "center", size: 10.5 });
    s.tracks.forEach((p) => { g.poly(p.map(([x, y]) => [X(clamp(x, 0, 1)), Y(y)]), col.acc, 0.6); const e = p[p.length - 1]; if (e[2]) g.dot(X(e[0]), Y(e[1]), 2.4, col.warm); });
    const cur = s.run.n ? s.run.t / s.run.n : 0;
    g.text(`running TBR ${cur.toFixed(3)} · ${s.run.n} neutrons`, x1, y1 + 14, { align: "right", weight: 600 });
    if (!g.narrow) {
      const b = { x: W * 0.64, y: H * 0.16, w: W * 0.31, h: H * 0.6 };
      const lo = 0.95, hi = 1.3;
      const ax = g.axes(b, [lo, hi], [0, 1], { xt: [1.0, 1.1, 1.2, 1.3], xf: (v) => v.toFixed(1), yt: [], xl: "TBR", yl: "samples" });
      const bins = new Array(14).fill(0); s.samples.forEach((v) => { const k = Math.floor(((v - lo) / (hi - lo)) * 14); if (k >= 0 && k < 14) bins[k]++; });
      const mx = Math.max(1, ...bins); bins.forEach((c, k) => { const xx = ax.X(lo + ((k + 0.1) / 14) * (hi - lo)); g.rect(xx, ax.Y(c / mx), (b.w / 14) * 0.8, ax.Y(0) - ax.Y(c / mx), col.ink, null, 0, 0.75); });
      g.line(ax.X(1.05), b.y, ax.X(1.05), b.y + b.h, col.acc, 1.4, [4, 3]); g.text("target 1.05", ax.X(1.05) + 4, b.y + 8, { color: col.acc });
      if (s.samples.length > 1) { const m = s.samples.reduce((a, b2) => a + b2, 0) / s.samples.length, sd = Math.sqrt(s.samples.reduce((a, b2) => a + (b2 - m) ** 2, 0) / s.samples.length); g.text(`${s.samples.length} samples · mean ${m.toFixed(3)} ± ${sd.toFixed(3)}`, b.x + b.w, b.y - 14, { align: "right", weight: 600 }); }
    }
  },
});

/* ---------- 3.5 stellarator coils ---------- */
defViz("3.5", {
  slider: { label: "Coil complexity (Fourier modes)", min: 1, max: 12, step: 1, value: 4 },
  legend: [["line", "Plasma boundary"], ["accline", "Modular coil"], ["dot", "Current design"], ["dash", "Pareto front"]],
  caption: "A stellarator's twisted plasma is shaped by modular coils. Allowing more complex coil shapes reproduces the target field more accurately, but complex coils are longer, harder to build and less tolerant of errors. Mapping that trade-off and finding designs that stay good under manufacturing errors is the open problem. Field error vs complexity is a model curve.",
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const cx = g.narrow ? W * 0.5 : W * 0.36, cy = H * 0.5, R0 = Math.min(W * 0.22, H * 0.34), a = R0 * 0.32, Np = 4, rot = g.t * 0.25, tilt = 0.55;
    const P3 = (phi, th, extra) => {
      const e = 0.35, A = a * (1 + (extra || 0)), sx = Math.cos(th) * (1 + e) * A, sz = Math.sin(th) * (1 - e) * A, al = Np * phi / 2;
      const u = sx * Math.cos(al) - sz * Math.sin(al), w = sx * Math.sin(al) + sz * Math.cos(al);
      const R = R0 + u, x = R * Math.cos(phi + rot), y = R * Math.sin(phi + rot), z = w;
      return [cx + x, cy + y * Math.sin(tilt) - z * Math.cos(tilt), y];
    };
    for (let k = 0; k < 24; k++) { const th = (k / 24) * 6.283, P = []; for (let i = 0; i <= 120; i++) P.push(P3((i / 120) * 6.283, th)); g.poly(P.map((p) => [p[0], p[1]]), col.mute, 0.5); }
    for (let k = 0; k < 64; k++) { const phi = (k / 64) * 6.283, P = []; for (let i = 0; i <= 30; i++) P.push(P3(phi, (i / 30) * 6.283)); g.poly(P.map((p) => [p[0], p[1]]), col.faint, 0.6); }
    const nm = s.val;
    for (let c = 0; c < 12; c++) {
      const phi0 = (c / 12) * 6.283, P = [];
      for (let i = 0; i <= 60; i++) { const th = (i / 60) * 6.283; let wig = 0; for (let m = 1; m <= nm; m++) wig += (0.1 / m) * Math.sin(m * th + c * 0.7 + m); P.push(P3(phi0 + wig * 0.18, th, 0.38)); }
      g.poly(P.map((p) => [p[0], p[1]]), col.acc, 1.4);
    }
    if (!g.narrow) {
      const b = { x: W * 0.7, y: H * 0.2, w: W * 0.25, h: H * 0.55 };
      const ax = g.axes(b, [1, 12], [0.001, 0.2], { ylog: true, xt: [1, 4, 8, 12], yt: [0.001, 0.01, 0.1], xl: "coil modes", yl: "field error" });
      const err = (m) => 0.15 * Math.exp(-0.42 * m) + 0.0015;
      const P = []; for (let m = 1; m <= 12; m += 0.2) P.push([ax.X(m), ax.Y(err(m))]);
      g.poly(P, col.acc, 1.4, { dash: [4, 3] });
      g.dot(ax.X(nm), ax.Y(err(nm)), 6, col.ink);
      g.text(`error ${(err(nm) * 100).toFixed(1)}% · relative coil length ${(1 + 0.06 * nm).toFixed(2)}`, b.x + b.w, b.y - 34, { align: "right", weight: 600 });
    }
    g.corner("four field periods · modular coils", "tl");
  },
});

/* ---------- 4.1 AC-OPF bounds ---------- */
defViz("4.1", {
  button: "Add a round of cuts",
  legend: [["line", "Best feasible cost (upper bound)"], ["accline", "Relaxation bound (lower bound)"], ["soft", "Certified optimality gap"]],
  caption: "A local solver finds a good dispatch quickly but cannot prove it is the best. A convex relaxation gives a lower bound on cost; the gap between the two is the certificate. Each press adds valid cuts or tightens bounds, raising the lower bound. Sparse moment-SOS methods have certified a 1% gap on a 6,515-bus benchmark; doing so at operational scale within minutes is open. Values illustrative.",
  init(s) { s.lb = [0.86]; s.ub = 1.0; s.tm = 0; },
  step(s, dt) { s.tm += dt; if (s.tm > 1.1) { s.tm = 0; if (s.lb.length < 12) this.onButton(s); else s.lb = [0.86]; } },
  onButton(s) { const last = s.lb[s.lb.length - 1]; if (s.lb.length < 14) s.lb.push(last + (s.ub - last) * 0.42); },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const N = [[0.08, 0.3], [0.22, 0.15], [0.36, 0.32], [0.18, 0.55], [0.34, 0.7], [0.08, 0.8]];
    const E = [[0, 1], [1, 2], [0, 3], [3, 2], [3, 4], [4, 5], [5, 0], [2, 4]];
    const sx = g.narrow ? W / 0.42 : W;
    E.forEach(([a, b], i) => { const p = [N[a][0] * sx, N[a][1] * H], q = [N[b][0] * sx, N[b][1] * H]; g.line(p[0], p[1], q[0], q[1], col.mute, 1.4); const u = (g.t * 0.3 + i * 0.13) % 1; g.dot(lerp(p[0], q[0], u), lerp(p[1], q[1], u), 2.2, col.acc); });
    N.forEach(([x, y], i) => { if (i % 2 === 0) { g.ring(x * sx, y * H, 12, col.ink, 1.3); g.text("G", x * sx, y * H, { align: "center", size: 10.5 }); } else g.rect(x * sx - 6, y * H - 6, 12, 12, col.ink); });
    if (g.narrow) return;
    const b = { x: W * 0.5, y: H * 0.14, w: W * 0.44, h: H * 0.66 };
    const ax = g.axes(b, [0, 13], [0.84, 1.01], { xt: [0, 4, 8, 12], yt: [0.85, 0.9, 0.95, 1.0], yf: (v) => v.toFixed(2), xl: "cut rounds", yl: "cost (normalised)" });
    const L = s.lb;
    g.poly(L.map((v, i) => [ax.X(i), ax.Y(v)]).concat([[ax.X(L.length - 1), ax.Y(s.ub)], [ax.X(0), ax.Y(s.ub)]]), null, 0, { close: true, fill: col.acc, alpha: 0.12 });
    g.line(ax.X(0), ax.Y(s.ub), ax.X(13), ax.Y(s.ub), col.ink, 1.8);
    g.poly(L.map((v, i) => [ax.X(i), ax.Y(v)]), col.acc, 2); L.forEach((v, i) => g.dot(ax.X(i), ax.Y(v), 3.5, col.acc));
    const gap = ((s.ub - L[L.length - 1]) / s.ub) * 100;
    g.text(`certified gap ${gap.toFixed(gap < 1 ? 2 : 1)}%`, b.x + b.w, b.y - 14, { align: "right", weight: 600, color: gap < 1 ? col.acc : col.ink });
  },
});

/* ---------- 4.2 representative days ---------- */
defViz("4.2", {
  toggle: ["Full year · 8,760 hours", "12 representative days"],
  legend: [["soft", "Net load (low → high)"], ["warm", "Peak hours"]],
  caption: "Planning models trade time resolution for tractability. Replacing a year of hourly net load (demand minus wind and solar) with 12 representative days averages away the extreme hours that set how much firm capacity is needed. How much error aggregation introduces, with a provable bound, is open. Synthetic year with seasonal, daily and weather variation.",
  init(s) {
    const r = rng(23); s.Y = []; let w = 0;
    for (let d = 0; d < 365; d++) { w = 0.8 * w + (r() - 0.5) * 0.5; const row = []; for (let h = 0; h < 24; h++) { const season = 0.6 + 0.25 * Math.cos(((d - 200) / 365) * 6.283), daily = 0.18 * Math.sin(((h - 8) / 24) * 6.283) + 0.08 * Math.sin(((h - 18) / 12) * 6.283), solar = Math.max(0, Math.sin(((h - 6) / 12) * Math.PI)) * (0.35 + 0.2 * Math.cos(((d - 172) / 365) * 6.283)); row.push(season + daily - solar + w * 0.4 + (r() - 0.5) * 0.06); } s.Y.push(row); }
    s.R = s.Y.map((_, d) => { const m = Math.floor(d / 30.42), days = s.Y.slice(Math.floor(m * 30.42), Math.floor((m + 1) * 30.42)); return Array.from({ length: 24 }, (_, h) => days.reduce((a, x) => a + x[h], 0) / days.length); });
    const flat = (A) => A.flat(); s.pk = [Math.max(...flat(s.Y)), Math.max(...flat(s.R))]; s.mn = Math.min(...flat(s.Y)); s.mx = s.pk[0];
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const D = s.mix < 0.5 ? s.Y : s.R, b = { x: 56, y: H * 0.1, w: W - 80, h: H * 0.72 };
    const cw = b.w / 365, ch = b.h / 24, thr = s.mn + (s.mx - s.mn) * 0.88;
    for (let d = 0; d < 365; d++) for (let h = 0; h < 24; h++) { const v = (D[d][h] - s.mn) / (s.mx - s.mn); g.rect(b.x + d * cw, b.y + h * ch, cw + 0.4, ch + 0.4, D[d][h] > thr ? col.warm : col.acc, null, 0, D[d][h] > thr ? 0.9 : clamp(v, 0, 1) * 0.85); }
    ["Jan", "Apr", "Jul", "Oct"].forEach((m, i) => g.text(m, b.x + (i * 91.25) * cw, b.y + b.h + 14, { color: col.mute, size: 10.5 }));
    [0, 6, 12, 18].forEach((h) => g.text(h + ":00", b.x - 6, b.y + (h + 0.5) * ch, { align: "right", color: col.mute, size: 10.5 }));
    const err = ((s.pk[0] - s.pk[1]) / s.pk[0]) * 100;
    g.text(s.mix < 0.5 ? `peak net load ${s.pk[0].toFixed(2)} (normalised)` : `peak seen by model ${s.pk[1].toFixed(2)} · underestimates peak by ${err.toFixed(0)}%`, W - 20, H * 0.05, { align: "right", weight: 600, color: s.mix < 0.5 ? col.ink : col.warm });
  },
});

/* ---------- 4.3 stability certificate ---------- */
defViz("4.3", {
  toggle: ["Quadratic Lyapunov certificate", "Energy-function / learned certificate"],
  legend: [["soft", "True region of attraction"], ["accline", "Certified region"], ["dot", "Stable equilibrium"], ["hole", "Saddle"]],
  caption: "A generator connected to the grid obeys the swing equation δ̈ = P − sin δ − Dδ̇. States inside the region of attraction return to equilibrium after a disturbance. A Lyapunov function certifies part of that region; a richer certificate (the classical energy function here, or a verified neural network) certifies far more. Scaling such proofs to whole grids with inverters and AI loads is open. P = 0.5, D = 0.3.",
  init(s) {
    const P = 0.5, D = 0.3, ds = Math.asin(P); s.ds = ds; s.sad = Math.PI - ds; s.grid = []; const nx = 70, ny = 44;
    for (let i = 0; i < nx; i++) { s.grid.push([]); for (let j = 0; j < ny; j++) { let d = -2.2 + (i + 0.5) / nx * 6.2, w = -3 + (j + 0.5) / ny * 6, ok = false; for (let k = 0; k < 6000; k++) { const h = 0.01; const a = P - Math.sin(d) - D * w; w += a * h; d += w * h; if (Math.abs(d - ds) < 0.15 && Math.abs(w) < 0.15) { ok = true; break; } if (d > 3.5 || d < -4) break; } s.grid[i].push(ok); } }
    s.tr = []; s.r = rng(2);
  },
  step(s, dt) {
    const P = 0.5, D = 0.3;
    if (s.tr.length < 14 && s.r() < 0.08) s.tr.push({ d: -2 + s.r() * 5.8, w: -2.8 + s.r() * 5.6, path: [] });
    s.tr.forEach((t) => { for (let k = 0; k < 6; k++) { const a = P - Math.sin(t.d) - D * t.w; t.w += a * 0.01 * 3; t.d += t.w * 0.01 * 3; } t.path.push([t.d, t.w]); if (t.path.length > 160) t.path.shift(); t.age = (t.age || 0) + dt; });
    s.tr = s.tr.filter((t) => t.age < 7 && Math.abs(t.d) < 9);
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const b = { x: 60, y: H * 0.08, w: W - 90, h: H * 0.78 };
    const ax = g.axes(b, [-2.2, 4], [-3, 3], { xt: [-2, 0, 2, 4], yt: [-2, 0, 2], xl: "rotor angle δ (rad)", yl: "speed deviation ω" });
    const nx = s.grid.length, ny = s.grid[0].length;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) if (s.grid[i][j]) g.rect(b.x + (i / nx) * b.w, b.y + b.h - ((j + 1) / ny) * b.h, b.w / nx + 0.5, b.h / ny + 0.5, col.acc, null, 0, 0.14);
    const P = 0.5, Vf = (d, w) => 0.5 * w * w - P * (d - s.ds) - (Math.cos(d) - Math.cos(s.ds));
    const Vc = Vf(s.sad, 0);
    if (s.mix > 0.5) { for (let i = 0; i < 200; i++) for (let j = 0; j < 120; j++) { const d = -2.2 + (i / 200) * 6.2, w = -3 + (j / 120) * 6; const v = Vf(d, w); if (Math.abs(v - Vc) < 0.012 && d < s.sad && d > -2.2) g.dot(ax.X(d), ax.Y(w), 1.1, col.acc); } }
    else { const rq = 0.62, P2 = []; for (let k = 0; k <= 100; k++) { const a = (k / 100) * 6.283; P2.push([ax.X(s.ds + rq * 1.4 * Math.cos(a)), ax.Y(rq * 1.6 * Math.sin(a))]); } g.poly(P2, col.acc, 2); }
    s.tr.forEach((t) => g.poly(t.path.map(([d, w]) => [ax.X(clamp(d, -2.2, 4)), ax.Y(clamp(w, -3, 3))]), col.ink, 0.8));
    g.dot(ax.X(s.ds), ax.Y(0), 5, col.ink); g.hole(ax.X(s.sad), ax.Y(0), 5, col.warm);
    g.text("saddle (loss of synchronism)", ax.X(s.sad) + 8, ax.Y(0) - 14, { color: col.warm });
    g.text(s.mix > 0.5 ? "certified ≈ most of the true region" : "certified: small ellipse", b.x + b.w, b.y + 6, { align: "right", weight: 600 });
  },
});

/* ---------- 4.4 cascading failure ---------- */
defViz("4.4", {
  button: "Trip a random line",
  legend: [["line", "Transmission line (width = flow)"], ["warm", "Overloaded or tripped"], ["dot", "Generator"], ["sq", "Load"]],
  caption: "Line flows follow physics (DC power flow here), not the operator's wishes. When a line trips, its flow reroutes; neighbours can overload and trip in turn, and islands without generation lose their load. Click a line or press the button. Finding the worst combination of k failures on a real grid, with AC physics and protection, is a hard combinatorial problem with certificate-style answers.",
  init(s) {
    const r = rng(41); s.r = r; s.N = []; for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) s.N.push({ x: 0.1 + i * 0.2 + (r() - 0.5) * 0.06, y: 0.15 + j * 0.23 + (r() - 0.5) * 0.06, p: 0 });
    [0, 7, 13, 19].forEach((i) => (s.N[i].p = 3)); [2, 5, 9, 10, 15, 17].forEach((i) => (s.N[i].p = -2));
    s.E = []; for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { const a = i * 4 + j; if (j < 3) s.E.push({ a, b: a + 1, on: true }); if (i < 4) s.E.push({ a, b: a + 4, on: true }); if (i < 4 && j < 3 && r() < 0.35) s.E.push({ a, b: a + 5, on: true }); }
    s.solve = () => {
      const n = s.N.length, on = s.E.filter((e) => e.on);
      const adj = Array.from({ length: n }, () => []); on.forEach((e) => { adj[e.a].push(e.b); adj[e.b].push(e.a); });
      const comp = new Array(n).fill(-1); let c = 0; for (let i = 0; i < n; i++) if (comp[i] < 0) { const st = [i]; comp[i] = c; while (st.length) { const u = st.pop(); adj[u].forEach((v) => { if (comp[v] < 0) { comp[v] = c; st.push(v); } }); } c++; }
      let shed = 0; const inj = s.N.map((x) => x.p);
      for (let k = 0; k < c; k++) { const idx = inj.map((_, i) => i).filter((i) => comp[i] === k); const gen = idx.filter((i) => inj[i] > 0).reduce((a, i) => a + inj[i], 0), load = -idx.filter((i) => inj[i] < 0).reduce((a, i) => a + inj[i], 0); if (gen === 0) { shed += load; idx.forEach((i) => (inj[i] = 0)); } else { const sc = Math.min(gen, load) / gen, ls = Math.min(1, gen / Math.max(load, 1e-9)); if (load < gen) idx.forEach((i) => { if (inj[i] > 0) inj[i] *= sc; }); else { shed += load - gen; idx.forEach((i) => { if (inj[i] < 0) inj[i] *= ls; }); } } }
      const th = new Array(n).fill(0);
      for (let it = 0; it < 400; it++) for (let i = 0; i < n; i++) { if (!adj[i].length) continue; const ref = s.N.findIndex((_, q) => comp[q] === comp[i]); if (i === ref) { th[i] = 0; continue; } th[i] = (inj[i] + adj[i].reduce((a, j) => a + th[j], 0)) / adj[i].length; }
      on.forEach((e) => (e.f = th[e.a] - th[e.b])); s.E.filter((e) => !e.on).forEach((e) => (e.f = 0)); s.shed = shed;
    };
    s.E.forEach((e) => (e.cap = 0)); s.solve(); s.E.forEach((e) => (e.cap = Math.max(1.2, Math.abs(e.f) * 1.35))); s.base = s.E.map((e) => e.cap); s.wait = 0; s.reset = 0;
  },
  onButton(s) { const on = s.E.filter((e) => e.on); if (on.length) { on[Math.floor(s.r() * on.length)].on = false; s.solve(); s.wait = 0.9; } },
  step(s, dt, g) {
    if (s.ptr.click) { const [px, py] = s.ptr.click; let best = null, bd = 14; s.E.forEach((e) => { if (!e.on) return; const A = s.N[e.a], B = s.N[e.b], ax = A.x * g.W, ay = A.y * g.H, bx = B.x * g.W, by = B.y * g.H; const t = clamp(((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2), 0, 1); const d = Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay))); if (d < bd) { bd = d; best = e; } }); if (best) { best.on = false; s.solve(); s.wait = 0.9; } }
    if (s.wait > 0) { s.wait -= dt; if (s.wait <= 0) { const over = s.E.filter((e) => e.on && Math.abs(e.f) > e.cap); if (over.length) { over.sort((a, b) => Math.abs(b.f) / b.cap - Math.abs(a.f) / a.cap)[0].on = false; s.solve(); s.wait = 0.9; } } }
    const off = s.E.filter((e) => !e.on).length; if (off > 7 || s.shed > 6) { s.reset += dt; if (s.reset > 4) { s.E.forEach((e) => (e.on = true)); s.solve(); s.reset = 0; } }
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    s.E.forEach((e) => { const A = s.N[e.a], B = s.N[e.b]; const x1 = A.x * W, y1 = A.y * H, x2 = B.x * W, y2 = B.y * H; if (!e.on) { g.line(x1, y1, x2, y2, col.warm, 1, [3, 4]); return; } const ld = Math.abs(e.f) / e.cap; g.line(x1, y1, x2, y2, ld > 1 ? col.warm : col.ink, 0.8 + Math.min(4, Math.abs(e.f) * 1.4)); const u = (g.t * 0.5 * Math.sign(e.f || 1) + 1) % 1; g.dot(lerp(x1, x2, (u + 1) % 1), lerp(y1, y2, (u + 1) % 1), 2, col.acc); });
    s.N.forEach((n) => { const x = n.x * W, y = n.y * H; if (n.p > 0) { g.dot(x, y, 8, col.bg); g.ring(x, y, 8, col.ink, 1.6); g.text("G", x, y, { align: "center", size: 10 }); } else if (n.p < 0) g.rect(x - 6, y - 6, 12, 12, col.ink); else g.dot(x, y, 3, col.mute); });
    const off = s.E.filter((e) => !e.on).length;
    g.text(`lines out ${off} · load shed ${(s.shed / 12 * 100).toFixed(0)}%`, W - 20, H - 16, { align: "right", weight: 600, color: s.shed > 0 ? col.warm : col.ink });
  },
});

/* ---------- 4.5 convex hull pricing ---------- */
defViz("4.5", {
  slider: { label: "Demand", min: 5, max: 195, step: 1, value: 60, fmt: (v) => v + " MW" },
  legend: [["line", "Least-cost total cost C(D)"], ["dash", "Convex hull of C(D)"], ["acc", "Operating point"]],
  caption: "Two generators: a cheap unit (20 $/MWh) with a $300 start-up cost and a 40 MW minimum, and a flexible peaker at 50 $/MWh. Least-cost total cost jumps where the cheap unit commits, so no single price supports the schedule. Marginal pricing (LMP) uses the committed units' marginal cost and needs side payments (uplift); convex hull pricing uses the slope of the convex envelope to minimise them. How to price flexible data-centre load in such markets is open.",
  init(s) {
    const cost = (D) => { let best = 50 * D, com = 0; for (let qa = 40; qa <= Math.min(100, D); qa += 0.5) { const qb = D - qa; if (qb < 0 || qb > 100) continue; const c = 300 + 20 * qa + 50 * qb; if (c < best) { best = c; com = 1; } } return [best, com]; };
    s.C = []; for (let D = 0; D <= 200; D += 1) s.C.push([D, ...cost(D)]);
    const P = s.C.map(([D, c]) => ({ x: D, e: c })), hull = [];
    P.forEach((p) => { while (hull.length >= 2) { const a = hull[hull.length - 2], b = hull[hull.length - 1]; if ((b.x - a.x) * (p.e - a.e) - (b.e - a.e) * (p.x - a.x) <= 0) hull.pop(); else break; } hull.push(p); });
    s.hull = hull;
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const b = { x: 70, y: H * 0.1, w: g.narrow ? W - 100 : W * 0.58, h: H * 0.74 };
    const ax = g.axes(b, [0, 200], [0, 8000], { xt: [0, 50, 100, 150, 200], yt: [0, 2000, 4000, 6000, 8000], yf: (v) => "$" + v / 1000 + "k", xl: "demand D (MW)", yl: "total cost per hour" });
    g.poly(s.C.map(([D, c]) => [ax.X(D), ax.Y(c)]), col.ink, 2);
    g.poly(s.hull.map((p) => [ax.X(p.x), ax.Y(p.e)]), col.acc, 1.6, { dash: [5, 4] });
    const D = s.val, row = s.C[Math.round(D)], com = row[2];
    const lmp = com && D >= 40 && D <= 100 ? 20 : com ? 50 : 50;
    let chp = 50; for (let i = 0; i < s.hull.length - 1; i++) if (D >= s.hull[i].x && D <= s.hull[i + 1].x) chp = (s.hull[i + 1].e - s.hull[i].e) / (s.hull[i + 1].x - s.hull[i].x);
    const qa = com ? Math.min(100, Math.max(40, D)) : 0, profitA = (p) => (com ? p * qa - (300 + 20 * qa) : 0);
    const upL = Math.max(0, -profitA(lmp)), upC = Math.max(0, -profitA(chp));
    g.dot(ax.X(D), ax.Y(row[1]), 6, col.acc);
    if (!g.narrow) {
      const x = W * 0.72; let y = H * 0.16;
      const line = (a, v, c) => { g.text(a, x, y, { color: col.mute }); g.text(v, W - 24, y, { align: "right", weight: 600, color: c || col.ink }); y += 26; };
      line("cheap unit committed", com ? "yes" : "no");
      line("marginal price (LMP)", "$" + lmp.toFixed(1) + "/MWh");
      line("uplift needed at LMP", "$" + upL.toFixed(0) + "/h", upL > 0 ? col.warm : col.ink);
      line("convex hull price", "$" + chp.toFixed(1) + "/MWh", col.acc);
      line("uplift at hull price", "$" + upC.toFixed(0) + "/h", upC > 0 ? col.warm : col.ink);
    }
  },
});

/* ---------- 4.6 flexible AI load ---------- */
defViz("4.6", {
  toggle: ["Inflexible campus", "Flexible scheduler"],
  legend: [["acc", "Inference (must serve)"], ["soft", "Training (checkpointable)"], ["grey", "Batch (deferrable)"], ["warm", "Grid stress window"]],
  caption: "Two days of an AI campus's power against a grid limit that tightens during two stress windows. A flexible scheduler throttles training to 60% and defers batch work during the windows, while inference keeps serving. Utilities will grant faster, flexible connections only if such behaviour is guaranteed, which needs provable scheduling rather than best effort. Synthetic profile.",
  init(s) {
    const T = 48 * 4; s.inf = [], s.tr = [], s.ba = [], s.lim = [];
    for (let k = 0; k < T; k++) { const h = (k / 4) % 24; s.inf.push(0.28 + 0.1 * Math.sin(((h - 10) / 24) * 6.283)); s.tr.push(0.5); s.ba.push(0.12); const stress = (k >= 17 * 4 && k < 20 * 4) || (k >= 41 * 4 && k < 44 * 4); s.lim.push(stress ? 0.75 : 1.0); }
    const flex = (k) => s.lim[k] < 1;
    s.F = { tr: s.tr.map((v, k) => (flex(k) ? v * 0.6 : v)), ba: [] }; let debt = 0;
    s.ba.forEach((v, k) => { if (flex(k)) { debt += v; s.F.ba.push(0); } else { const extra = Math.min(debt, 0.1); debt -= extra; s.F.ba.push(v + extra); } });
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const T = s.inf.length, b = { x: 56, y: H * 0.12, w: W - 80, h: H * 0.7 };
    const ax = g.axes(b, [0, T], [0, 1.15], { xt: [0, 48, 96, 144, 192], xf: (v) => v / 4 + " h", yt: [0, 0.5, 1], yf: (v) => (v * 100).toFixed(0) + "%", yl: "campus power (% of connection)" });
    for (let k = 0; k < T; k++) if (s.lim[k] < 1) g.rect(ax.X(k), b.y, ax.X(k + 1) - ax.X(k) + 0.5, b.h, col.warm, null, 0, 0.12);
    const tr = s.mix > 0.5 ? s.F.tr : s.tr, ba = s.mix > 0.5 ? s.F.ba : s.ba;
    const stack = (fn, c, a) => { const top = [], bot = []; for (let k = 0; k < T; k++) { const [lo, hi] = fn(k); top.push([ax.X(k + 0.5), ax.Y(hi)]); bot.push([ax.X(k + 0.5), ax.Y(lo)]); } g.poly(top.concat(bot.reverse()), null, 0, { close: true, fill: c, alpha: a }); };
    stack((k) => [0, s.inf[k]], col.acc, 0.8);
    stack((k) => [s.inf[k], s.inf[k] + tr[k]], col.acc, 0.25);
    stack((k) => [s.inf[k] + tr[k], s.inf[k] + tr[k] + ba[k]], col.mute, 0.5);
    g.poly(s.lim.map((v, k) => [ax.X(k), ax.Y(v)]), col.ink, 1.6);
    const over = s.lim.map((v, k) => s.inf[k] + tr[k] + ba[k] - v).filter((x) => x > 0.001).length;
    const lost = (s.tr.reduce((a, v) => a + v, 0) - tr.reduce((a, v) => a + v, 0)) / s.tr.reduce((a, v) => a + v, 0) * 100;
    g.text(s.mix > 0.5 ? `0 hours over limit · training throughput −${lost.toFixed(1)}% · inference 100%` : `${over / 4} hours over the grid limit`, W - 20, H * 0.05, { align: "right", weight: 600, color: s.mix > 0.5 ? col.acc : col.warm });
    g.text("grid limit", ax.X(T) - 4, ax.Y(1) - 10, { align: "right", color: col.mute });
  },
});

/* ---------- 5.1 Landauer ---------- */
defViz("5.1", {
  slider: { label: "Erasure duration τ", min: 0.2, max: 10, step: 0.1, value: 2, fmt: (v) => v.toFixed(1) + " (units of relaxation time)" },
  legend: [["line", "Double-well potential (one bit)"], ["acc", "Particle (bit state)"], ["accline", "Work W(τ)"], ["dash", "Landauer limit kT ln 2"]],
  caption: "Erasing a bit means forcing a particle in a double well into a known state: lower the barrier, tilt, restore. Done infinitely slowly it costs kT ln 2 (about 2.9 zJ at 300 K). Done in finite time τ it costs more, by roughly B/τ. Real chips use many orders of magnitude more per operation; bounds for whole computations, including error correction and communication, are open. Toy model W = kT ln2 (1 + 1.6/τ).",
  init(s) { s.r = rng(8); s.x = -1; },
  step(s, dt) {
    const T = s.val, ph = (s.t % (T + 1.5)) / T;
    const bar = ph < 0.35 ? 1 - ph / 0.35 : ph < 0.7 ? 0 : ph < 1 ? (ph - 0.7) / 0.3 : 1, tilt = ph > 0.2 && ph < 1 ? 1.2 : 0;
    s.bar = bar; s.tilt = tilt; s.ph = ph;
    const F = (x) => -(4 * bar * x * (x * x - 1) * 1.0 + 0.6 * x * x * x * (1 - bar) * 0) - tilt * 0.0 + -tilt;
    for (let k = 0; k < 8; k++) { const h = 0.005; const grad = 4 * bar * x3(s.x) + (1 - bar) * 0.6 * s.x + tilt; s.x += -grad * h + Math.sqrt(2 * 0.25 * h) * (s.r() - 0.5) * 3.4; s.x = clamp(s.x, -1.8, 1.8); }
    function x3(x) { return x * (x * x - 1); }
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const bar = s.bar == null ? 1 : s.bar, tilt = s.tilt || 0;
    const U = (x) => bar * (x * x - 1) ** 2 + (1 - bar) * 0.3 * x * x + tilt * x;
    const b = { x: 40, y: H * 0.14, w: g.narrow ? W - 70 : W * 0.46, h: H * 0.6 }, X = (x) => b.x + ((x + 1.8) / 3.6) * b.w, Y = (u) => b.y + b.h - ((u + 2) / 4) * b.h;
    const P = []; for (let x = -1.8; x <= 1.8; x += 0.02) P.push([X(x), Y(U(x))]); g.poly(P, col.ink, 2);
    g.dot(X(s.x), Y(U(s.x)) - 7, 7, col.acc);
    g.text(["lower barrier", "tilt", "restore barrier", "reset"][s.ph < 0.35 ? 0 : s.ph < 0.7 ? 1 : s.ph < 1 ? 2 : 3], b.x, b.y - 10, { weight: 600 });
    g.text("0", X(-1), b.y + b.h + 14, { align: "center", color: col.mute }); g.text("1", X(1), b.y + b.h + 14, { align: "center", color: col.mute });
    if (!g.narrow) {
      const c = { x: W * 0.62, y: H * 0.14, w: W * 0.33, h: H * 0.6 };
      const ax = g.axes(c, [0.2, 10], [0, 6], { xt: [1, 5, 10], yt: [0, 1, 3, 5], yf: (v) => v + "×", xl: "τ", yl: "work / (kT ln 2)" });
      const Q = []; for (let t = 0.2; t <= 10; t += 0.05) Q.push([ax.X(t), ax.Y(Math.min(6, 1 + 1.6 / t))]); g.poly(Q, col.acc, 2);
      g.line(c.x, ax.Y(1), c.x + c.w, ax.Y(1), col.acc, 1, [4, 3]);
      g.dot(ax.X(s.val), ax.Y(Math.min(6, 1 + 1.6 / s.val)), 6, col.ink);
      g.text(`W ≈ ${(1 + 1.6 / s.val).toFixed(2)} kT ln 2 = ${((1 + 1.6 / s.val) * 2.87).toFixed(1)} zJ`, c.x + c.w, c.y - 12, { align: "right", weight: 600 });
    }
  },
});

/* ---------- 5.2 attention IO ---------- */
defViz("5.2", {
  toggle: ["Standard attention", "Tiled · IO-aware (FlashAttention)"],
  slider: { label: "Sequence length N", min: 9, max: 17, step: 0.5, value: 13, fmt: (v) => Math.round(2 ** v).toLocaleString() + " tokens" },
  legend: [["warm", "Writes N×N scores to HBM"], ["acc", "Tile held in SRAM"], ["accline", "HBM traffic"]],
  caption: "Standard attention writes the N×N score matrix to slow memory, so traffic grows as N². Tiling keeps blocks of Q, K and V in fast on-chip SRAM of size M and never materialises the matrix: traffic Θ(N²d²/M). Saha and Ye (2024) proved this is optimal when M ≥ d². Lower bounds for whole models across many chips are open. d = 128, M = 100k elements, constants set to 1.",
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const N = 2 ** s.val, d = 128, M = 1e5;
    const std = (n) => n * d * 4 + n * n * 2, fl = (n) => n * d * 4 + (n * n * d * d) / M;
    const gx = 40, gs = Math.min(H * 0.6, W * (g.narrow ? 0.8 : 0.4)), gy = H * 0.16, nb = 8, cs = gs / nb;
    for (let i = 0; i < nb; i++) for (let j = 0; j < nb; j++) g.rect(gx + i * cs, gy + j * cs, cs - 2, cs - 2, col.faint);
    const k = Math.floor(g.t * 3) % (nb * nb), bi = k % nb, bj = Math.floor(k / nb);
    if (s.mix < 0.5) { for (let q = 0; q <= k; q++) g.rect(gx + (q % nb) * cs, gy + Math.floor(q / nb) * cs, cs - 2, cs - 2, col.warm, null, 0, 0.45); g.text("S = QKᵀ materialised in HBM", gx, gy - 12, { color: col.warm }); }
    else { g.rect(gx + bi * cs, gy + bj * cs, cs - 2, cs - 2, col.acc, null, 0, 0.7); g.rect(gx + bi * cs - 3, gy + bj * cs - 3, cs + 4, cs + 4, null, col.acc, 1.5); g.text("one tile at a time in SRAM", gx, gy - 12, { color: col.acc }); }
    g.text("N × N attention scores", gx + gs / 2, gy + gs + 16, { align: "center", color: col.mute });
    if (!g.narrow) {
      const b = { x: W * 0.58, y: H * 0.14, w: W * 0.36, h: H * 0.64 };
      const ax = g.axes(b, [512, 131072], [1e5, 1e11], { xlog: true, ylog: true, xt: [1e3, 1e4, 1e5], xf: (v) => (v >= 1e3 ? v / 1e3 + "k" : v), yt: [1e6, 1e8, 1e10], yf: (v) => "1e" + Math.log10(v), xl: "N", yl: "HBM accesses" });
      const P1 = [], P2 = []; for (let e = 9; e <= 17; e += 0.1) { const n = 2 ** e; P1.push([ax.X(n), ax.Y(std(n))]); P2.push([ax.X(n), ax.Y(fl(n))]); }
      g.poly(P1, s.mix < 0.5 ? col.warm : col.mute, s.mix < 0.5 ? 2 : 1); g.poly(P2, s.mix > 0.5 ? col.acc : col.mute, s.mix > 0.5 ? 2 : 1);
      g.dot(ax.X(N), ax.Y(s.mix < 0.5 ? std(N) : fl(N)), 6, col.ink);
      g.text(`tiled uses ${(std(N) / fl(N)).toFixed(1)}× less HBM traffic`, b.x + b.w, b.y - 14, { align: "right", weight: 600 });
    }
  },
});

/* ---------- 5.3 3D placement ---------- */
defViz("5.3", {
  button: "Run / pause optimiser",
  legend: [["warm", "Hot spot (power density)"], ["acc", "Block on top die"], ["dot", "Block on bottom die"], ["line", "Net"]],
  caption: "Blocks are placed on two stacked dies. Wire length favours putting connected blocks close or directly above each other, but stacking two high-power blocks creates a hot spot that heat cannot escape. Simulated annealing here trades wirelength against peak temperature live; doing this at full-chip scale with provable quality is open. Toy thermal model: blurred power density summed over both dies.",
  init(s) {
    const r = rng(33); s.r = r; s.G = 8; s.B = Array.from({ length: 22 }, (_, i) => ({ x: Math.floor(r() * 8), y: Math.floor(r() * 8), z: i % 2, p: r() < 0.3 ? 3 : 0.6 + r() * 0.8 }));
    s.nets = Array.from({ length: 34 }, () => [Math.floor(r() * 22), Math.floor(r() * 22)]).filter(([a, b]) => a !== b);
    s.run = true; s.T = 2; s.hist = [];
    s.cost = () => { let wl = 0; s.nets.forEach(([a, b]) => { const A = s.B[a], B = s.B[b]; wl += Math.abs(A.x - B.x) + Math.abs(A.y - B.y) + (A.z !== B.z ? 0.5 : 0); }); const P = Array.from({ length: 8 }, () => new Array(8).fill(0)); s.B.forEach((b) => (P[b.x][b.y] += b.p)); let pk = 0; const Tm = []; for (let i = 0; i < 8; i++) { Tm.push([]); for (let j = 0; j < 8; j++) { let t = 0; for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) { const ii = i + a, jj = j + c; if (ii >= 0 && ii < 8 && jj >= 0 && jj < 8) t += P[ii][jj] * (a || c ? 0.35 : 1); } Tm[i].push(t); pk = Math.max(pk, t); } } s.Tm = Tm; return { wl, pk, c: wl + 6 * pk }; };
    s.cur = s.cost();
  },
  onButton(s) { s.run = !s.run; },
  step(s) {
    if (!s.run) return;
    for (let k = 0; k < 30; k++) { const b = s.B[Math.floor(s.r() * s.B.length)], old = [b.x, b.y, b.z]; b.x = clamp(b.x + Math.floor(s.r() * 3) - 1, 0, 7); b.y = clamp(b.y + Math.floor(s.r() * 3) - 1, 0, 7); if (s.r() < 0.2) b.z = 1 - b.z; const nc = s.cost(); if (nc.c < s.cur.c || s.r() < Math.exp((s.cur.c - nc.c) / s.T)) s.cur = nc; else { [b.x, b.y, b.z] = old; s.cur = s.cost(); } }
    s.T = Math.max(0.05, s.T * 0.995); s.hist.push([s.cur.wl, s.cur.pk]); if (s.hist.length > 300) s.hist.shift();
    if (s.T <= 0.05 && s.hist.length > 290) { s.T = 2; s.B.forEach((b) => { b.x = Math.floor(s.r() * 8); b.y = Math.floor(s.r() * 8); }); s.cur = s.cost(); s.hist = []; }
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const cs = Math.min((g.narrow ? W - 60 : W * 0.5) / 8, H * 0.7 / 8), gx = 40, gy = H * 0.14;
    const mx = Math.max(...s.Tm.flat());
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.rect(gx + i * cs, gy + j * cs, cs - 1, cs - 1, col.warm, null, 0, (s.Tm[i][j] / Math.max(mx, 4)) * 0.7); g.rect(gx + i * cs, gy + j * cs, cs - 1, cs - 1, null, col.faint, 0.6); }
    s.nets.forEach(([a, b]) => { const A = s.B[a], B = s.B[b]; g.line(gx + (A.x + 0.5) * cs + (A.z ? 4 : -4), gy + (A.y + 0.5) * cs, gx + (B.x + 0.5) * cs + (B.z ? 4 : -4), gy + (B.y + 0.5) * cs, col.mute, 0.6); });
    s.B.forEach((b) => { const x = gx + (b.x + 0.5) * cs + (b.z ? 4 : -4), y = gy + (b.y + 0.5) * cs, r = 3 + b.p * 1.6; if (b.z) g.dot(x, y, r, col.acc); else g.ring(x, y, r, col.ink, 1.4); });
    g.text("two stacked dies, top view", gx, gy - 12, { color: col.mute });
    if (!g.narrow) {
      const bx = { x: W * 0.64, y: H * 0.16, w: W * 0.31, h: H * 0.26 }, by = { x: W * 0.64, y: H * 0.56, w: W * 0.31, h: H * 0.26 };
      const h = s.hist, n = Math.max(2, h.length);
      const wlR = [Math.min(...h.map((x) => x[0]), 999), Math.max(...h.map((x) => x[0]), 1)], pkR = [Math.min(...h.map((x) => x[1]), 999), Math.max(...h.map((x) => x[1]), 1)];
      const a1 = g.axes(bx, [0, 300], [wlR[0] * 0.95, wlR[1] * 1.05 + 1], { xt: [], yt: [], yl: "wirelength" }); g.poly(h.map((x, i) => [a1.X(i), a1.Y(x[0])]), col.acc, 1.6);
      const a2 = g.axes(by, [0, 300], [pkR[0] * 0.95, pkR[1] * 1.05 + 0.1], { xt: [], yt: [], yl: "peak temperature (model)" }); g.poly(h.map((x, i) => [a2.X(i), a2.Y(x[1])]), col.warm, 1.6);
      g.text(`WL ${s.cur.wl.toFixed(0)} · peak ${s.cur.pk.toFixed(1)} · ${s.run ? "optimising" : "paused"}`, W - 20, H * 0.07, { align: "right", weight: 600 });
    }
  },
});

/* ---------- 5.4 quantum vs classical ---------- */
defViz("5.4", {
  toggle: ["Weakly correlated molecule", "Strongly correlated (e.g. FeMoco)"],
  legend: [["line", "Exact classical (full CI)"], ["dash", "Classical heuristic (DMRG, AFQMC)"], ["accline", "Fault-tolerant quantum (phase estimation)"], ["soft", "Where advantage is debated"]],
  caption: "Exact classical methods scale exponentially with active orbitals. Quantum phase estimation scales polynomially but with a large constant overhead. Whether that ever wins depends on how good classical heuristics are for the hard cases; a 2023 study found no evidence yet of exponential advantage across chemical space. FeMoco resource estimates have fallen from millions of qubits over days (2021) to about 4.5 million physical qubits for 8.6 hours (2025). Curves schematic.",
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const b = { x: 70, y: H * 0.1, w: W - 100, h: H * 0.72 };
    const ax = g.axes(b, [10, 160], [1e-2, 1e12], { ylog: true, xt: [20, 40, 60, 80, 100, 120, 140, 160], yt: [1e-2, 1e2, 1e6, 1e10], yf: (v) => "10^" + Math.log10(v), xl: "active orbitals", yl: "time to solution (arbitrary units)" });
    const fci = (n) => 10 ** (-3 + 0.18 * n), heur = (n) => (s.mix < 0.5 ? 1e-1 * (n / 10) ** 3 : 10 ** (-1.5 + 0.07 * n)), qpe = (n) => 1e3 * (n / 10) ** 2.5;
    const curve = (f, c, lw, dash) => { const P = []; for (let n = 10; n <= 160; n += 1) { const v = f(n); if (v < 1e12) P.push([ax.X(n), ax.Y(Math.max(1e-2, v))]); } g.poly(P, c, lw, { dash }); };
    if (s.mix > 0.5) g.rect(ax.X(60), b.y, ax.X(130) - ax.X(60), b.h, col.acc, null, 0, 0.08);
    curve(fci, col.ink, 2); curve(heur, col.ink, 1.6, [5, 4]); curve(qpe, col.acc, 2);
    g.text("FeMoco active spaces ≈ 54-76 orbitals", ax.X(76), b.y + 10, { align: "center", color: col.mute });
    g.line(ax.X(54), b.y + 20, ax.X(54), b.y + b.h, col.mute, 0.8, [2, 3]); g.line(ax.X(76), b.y + 20, ax.X(76), b.y + b.h, col.mute, 0.8, [2, 3]);
    g.text(s.mix < 0.5 ? "heuristics stay polynomial: no advantage" : "if heuristics fail: possible crossover", b.x + b.w, b.y - 12, { align: "right", weight: 600, color: s.mix < 0.5 ? col.ink : col.acc });
  },
});
}
