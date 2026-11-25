import { defViz, rng, clamp, lerp, ease } from "./engine";
/* Figures for core problems A1-C4 */
{
/* ---------- A1 fusion plasma ---------- */
defViz("A1", {
  toggle: ["Tokamak · axisymmetric", "Stellarator · 3D shaped"],
  legend: [["line", "Flux surface"], ["dash", "Separatrix"], ["soft", "Turbulent eddy (ITG/TEM)"], ["warmline", "Heat flux"]],
  caption: "Heat leaks across nested magnetic surfaces through small-scale turbulence. Predicting that transport from first principles sets the size, field and cost of a power plant. In a stellarator the surfaces are shaped in 3D and rotate as you move around the torus. Schematic.",
  init(s) { const r = rng(11); s.ed = Array.from({ length: 34 }, () => ({ th: (r() - 0.5) * 2.6, rho: 0.5 + r() * 0.42, ph: r() * 6.28, sp: 0.15 + r() * 0.2, sz: 0.6 + r() * 0.7 })); },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const side = !g.narrow;
    const cx = side ? W * 0.36 : W * 0.5, cy = H * 0.5, a = Math.min(side ? W * 0.24 : W * 0.38, H * 0.33);
    const m = s.mix, ph = g.t * 0.35;
    const P = (rho, th) => {
      const tok = [cx + a * rho * Math.cos(th + 0.38 * rho * Math.sin(th)), cy - 1.55 * a * rho * Math.sin(th)];
      const e = 0.32 * rho;
      const st = [cx + a * rho * (Math.cos(th) + e * Math.cos(2 * th - ph) * 0.9), cy - a * rho * (1.35 * Math.sin(th) - e * Math.sin(2 * th - ph))];
      return [lerp(tok[0], st[0], m), lerp(tok[1], st[1], m)];
    };
    for (let i = 1; i <= 9; i++) {
      const rho = i / 9, pts = [];
      for (let k = 0; k <= 120; k++) pts.push(P(rho, (k / 120) * 6.2832));
      if (i === 9) g.poly(pts, col.ink, 1.4, { dash: [5, 4] }); else g.poly(pts, i % 3 === 0 ? col.ink : col.mute, i % 3 === 0 ? 1.1 : 0.7);
    }
    if (m < 0.5) { // divertor legs
      const xp = P(1, -Math.PI / 2); const al = 1 - m * 2;
      g.c.globalAlpha = al; g.line(xp[0], xp[1], xp[0] - a * 0.35, xp[1] + a * 0.32, col.ink, 1.2, [5, 4]); g.line(xp[0], xp[1], xp[0] + a * 0.3, xp[1] + a * 0.34, col.ink, 1.2, [5, 4]);
      g.line(xp[0] - a * 0.5, xp[1] + a * 0.36, xp[0] + a * 0.45, xp[1] + a * 0.36, col.ink, 2.2); g.c.globalAlpha = 1;
      g.text("divertor", xp[0] + a * 0.5, xp[1] + a * 0.36, { color: col.mute });
    }
    s.ed.forEach((e) => {
      const th = e.th + g.t * e.sp * 0.4, amp = 0.5 + 0.5 * Math.sin(g.t * 1.3 + e.ph);
      const p = P(e.rho, th), q = P(e.rho + 0.05, th), ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
      g.c.save(); g.c.translate(p[0], p[1]); g.c.rotate(ang);
      g.c.beginPath(); g.c.ellipse(0, 0, a * 0.09 * e.sz * (0.6 + amp), a * 0.035 * e.sz, 0, 0, 6.2832);
      g.c.fillStyle = col.soft; g.c.globalAlpha = 0.55 + 0.35 * amp; g.c.fill(); g.c.globalAlpha = 1;
      g.c.strokeStyle = col.acc; g.c.lineWidth = 0.9; g.c.setLineDash([3, 3]); g.c.stroke(); g.c.setLineDash([]); g.c.restore();
    });
    for (let k = 0; k < 5; k++) { const th = -0.9 + k * 0.45; const p = P(0.86, th), q = P(1.12, th); g.arrow(p[0], p[1], q[0], q[1], col.warm, 1.4, 6); }
    g.dot(cx + (m ? 0 : a * 0.05), cy, 3, col.ink);
    const lab = (txt, rho, th, dx, dy) => { const p = P(rho, th); g.line(p[0], p[1], p[0] + dx, p[1] + dy, col.mute, 0.8); g.text(txt, p[0] + dx + (dx > 0 ? 4 : -4), p[1] + dy, { align: dx > 0 ? "left" : "right", color: col.ink }); };
    if (side) {
      lab("magnetic axis", 0.02, 0, -a * 0.55, -a * 0.75);
      lab("flux surface", 0.66, 2.4, -a * 0.35, -a * 0.25);
      lab("eddy · outboard, bad curvature", 0.92, 0.25, a * 0.25, -a * 0.75);
    }
    g.corner(side ? (m < 0.5 ? "poloidal cross-section · nested flux surfaces" : "stellarator cross-section · rotates with toroidal angle") : (m < 0.5 ? "tokamak cross-section" : "stellarator cross-section"), "tl");
    if (side) {
      const b = { x: W * 0.72, y: H * 0.36, w: W * 0.24, h: H * 0.42 };
      const ax = g.axes(b, [0, 1], [0, 1.1], { xt: [0, 0.5, 1], yt: [], xl: "normalised radius ρ" });
      const pts = []; for (let i = 0; i <= 60; i++) { const r = i / 60; const T = 0.25 * (r < 0.9 ? 1 : Math.max(0, (1 - r) / 0.1)) + 0.72 * Math.pow(Math.max(0, 1 - r * r), 1.4); pts.push([ax.X(r), ax.Y(T)]); }
      g.poly(pts, col.acc, 2);
      g.text("pedestal", ax.X(0.9), ax.Y(0.33), { align: "right", color: col.mute });
      g.text("temperature T(ρ) · stiff core", b.x, b.y - 14, { color: col.mute, size: 10.5 });
    }
  },
});

/* ---------- A2 fusion materials ---------- */
defViz("A2", {
  toggle: ["14 MeV fusion neutrons", "Fission neutrons (~2 MeV)"],
  legend: [["dot", "W / Fe lattice atom"], ["hole", "Vacancy"], ["acc", "Self-interstitial"], ["warm", "Helium (transmutation)"], ["dash", "He bubble"]],
  caption: "Each neutron knocks a primary atom out of place and sets off a displacement cascade. Most atoms fall back, a few vacancy-interstitial pairs survive. Fusion neutrons also make far more helium per displacement (order 10 appm He per dpa in steels versus well under 1 in fission spectra), which clusters into bubbles. No facility yet reproduces this combination. Schematic.",
  init(s, g) { s.r = rng(7); s.ev = null; s.vac = []; s.sia = []; s.he = []; s.next = 0.4; s.n = 0; },
  step(s, dt, g) {
    const d = Math.max(22, Math.min(30, g.W / 34));
    s.d = d; s.next -= dt;
    if (s.next <= 0 && !s.ev) {
      const cx = g.W * (0.25 + s.r() * 0.55), cy = g.H * (0.25 + s.r() * 0.55);
      const atoms = [];
      for (let x = d; x < g.W; x += d) for (let y = d; y < g.H; y += d) {
        const dist = Math.hypot(x - cx, y - cy);
        if (dist < d * (s.mode ? 2.6 : 4.2) * (0.7 + s.r() * 0.5)) atoms.push({ x, y, a: Math.atan2(y - cy, x - cx) + (s.r() - 0.5), v: 20 + s.r() * 60, keep: s.r() < 0.12 });
      }
      s.ev = { cx, cy, t: 0, atoms }; s.n++;
    }
    if (s.ev) {
      s.ev.t += dt;
      if (s.ev.t > 1.6) {
        s.ev.atoms.filter((a) => a.keep).forEach((a) => { s.vac.push({ x: a.x, y: a.y, life: 14 }); s.sia.push({ x: a.x + Math.cos(a.a) * a.v * 0.6, y: a.y + Math.sin(a.a) * a.v * 0.6, life: 14 }); });
        const nHe = s.mode ? 0 : 3;
        for (let i = 0; i < nHe; i++) s.he.push({ x: s.ev.cx + (s.r() - 0.5) * d * 3, y: s.ev.cy + (s.r() - 0.5) * d * 3 });
        s.ev = null; s.next = 1.2;
      }
    }
    s.vac.forEach((v) => (v.life -= dt)); s.sia.forEach((v) => (v.life -= dt));
    s.vac = s.vac.filter((v) => v.life > 0).slice(-40); s.sia = s.sia.filter((v) => v.life > 0).slice(-40);
    s.he.forEach((h) => { h.x += (s.r() - 0.5) * 18 * dt; h.y += (s.r() - 0.5) * 18 * dt; });
    for (let i = 0; i < s.he.length; i++) for (let j = i + 1; j < s.he.length; j++) {
      const a = s.he[i], b = s.he[j], dd = Math.hypot(a.x - b.x, a.y - b.y);
      if (dd < d * 1.6) { const k = 0.6 * dt; b.x += (a.x - b.x) * k; b.y += (a.y - b.y) * k; }
    }
    if (s.he.length > 90) s.he.splice(0, s.he.length - 90);
    if (s.mode && s.he.length) s.he.splice(0, 1);
  },
  draw(g, s) {
    const { W, H, col } = g, d = s.d || 26; g.clear();
    const disp = new Set();
    if (s.ev) s.ev.atoms.forEach((a) => disp.add(a.x + "," + a.y));
    for (let x = d; x < W; x += d) for (let y = d; y < H; y += d) {
      g.line(x, y, x + d, y, col.faint, 0.6); g.line(x, y, x, y + d, col.faint, 0.6);
      if (!disp.has(x + "," + y)) g.dot(x, y, 2.6, col.ink);
      if (x + d < W && y + d < H) g.dot(x + d / 2, y + d / 2, 1.8, col.mute);
    }
    s.vac.forEach((v) => g.hole(v.x, v.y, 3.6, col.acc));
    s.sia.forEach((v) => g.dot(v.x, v.y, 3.2, col.acc));
    if (s.ev) {
      const e = s.ev, t = e.t;
      if (t < 0.25) { const fx = lerp(-20, e.cx, t / 0.25); g.line(-20, e.cy - 30 + 30 * (t / 0.25), fx, e.cy, col.warm, 1.2, [4, 3]); g.dot(fx, e.cy, 3.5, col.warm); }
      e.atoms.forEach((a) => {
        const out = t < 0.6 ? ease(t / 0.6) : a.keep ? 1 : Math.max(0, 1 - (t - 0.6) / 0.8);
        const x = a.x + Math.cos(a.a) * a.v * 0.6 * out, y = a.y + Math.sin(a.a) * a.v * 0.6 * out;
        g.line(a.x, a.y, x, y, col.soft, 0.8); g.dot(x, y, 2.6, a.keep ? col.acc : col.ink);
      });
      g.ring(e.cx, e.cy, 8 + t * 40, col.warm, 1, [3, 3]);
      g.text("PKA · displacement cascade", e.cx + 14, e.cy - 52, { color: col.ink });
    }
    const groups = [];
    s.he.forEach((h) => { g.dot(h.x, h.y, 2.3, col.warm); let gr = groups.find((q) => Math.hypot(q.x - h.x, q.y - h.y) < d * 1.4); if (gr) { gr.n++; gr.x = (gr.x * (gr.n - 1) + h.x) / gr.n; gr.y = (gr.y * (gr.n - 1) + h.y) / gr.n; } else groups.push({ x: h.x, y: h.y, n: 1 }); });
    groups.filter((q) => q.n >= 3).forEach((q) => g.ring(q.x, q.y, 5 + Math.sqrt(q.n) * 4, col.warm, 1.1, [3, 3]));
    g.corner(s.mode ? "fission spectrum · fewer displacements, little helium" : "bcc metal · 14 MeV neutron · cascade + He transmutation", "tl");
    g.corner(`events ${s.n} · surviving Frenkel pairs ${s.vac.length} · He atoms ${s.he.length}`, "bl");
  },
});

/* ---------- A3 TRISO ---------- */
defViz("A3", {
  toggle: ["Normal operation · ~900 °C", "Accident heat-up · ~1600 °C"],
  legend: [["acc", "Fission product (e.g. Ag, Cs)"], ["warm", "Released past SiC"], ["line", "Coating layer"]],
  caption: "A TRISO particle is under a millimetre across: a uranium kernel wrapped in porous carbon, pyrocarbon and silicon carbide. The SiC shell is the main barrier. Qualifying how well it holds fission products over years of irradiation and at accident temperatures is what makes new fuels take about a decade. Layer thicknesses to scale; particles schematic.",
  init(s) { s.r = rng(3); s.fp = []; s.rel = 0; s.tot = 0; },
  step(s, dt, g) {
    const R = Math.min(g.W * (g.narrow ? 0.42 : 0.3), g.H * 0.42), sc = R / 427, cx = g.narrow ? g.W * 0.5 : g.W * 0.36, cy = g.H * 0.5;
    s.geo = { R, sc, cx, cy };
    if (s.fp.length < 160 && s.r() < 0.9) { const a = s.r() * 6.28, rr = Math.sqrt(s.r()) * 205 * sc; s.fp.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr, out: false }); s.tot++; }
    const hot = s.mode ? 1 : 0;
    s.fp.forEach((p) => {
      const r = Math.hypot(p.x - cx, p.y - cy) / sc;
      let D = r < 212 ? 26 : r < 312 ? 60 : r < 352 ? 22 : r < 387 ? (hot ? 9 : 0.6) : r < 427 ? 22 : 40;
      if (r >= 352 && r < 387 && !hot) { const a = Math.atan2(p.y - cy, p.x - cx); p.x = cx + Math.cos(a) * 351 * sc; p.y = cy + Math.sin(a) * 351 * sc; }
      p.x += (s.r() - 0.5) * D * dt * 3; p.y += (s.r() - 0.5) * D * dt * 3;
      if (r > 427 && !p.out) { p.out = true; s.rel++; }
      if (p.out) { const a = Math.atan2(p.y - cy, p.x - cx); p.x += Math.cos(a) * 18 * dt; p.y += Math.sin(a) * 18 * dt; }
    });
    s.fp = s.fp.filter((p) => Math.hypot(p.x - cx, p.y - cy) < s.geo.R * 1.55);
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear(); if (!s.geo) return;
    const { R, sc, cx, cy } = s.geo;
    const layers = [[427, "outer pyrocarbon (OPyC) · 40 µm", col.bg], [387, "silicon carbide (SiC) · 35 µm", col.faint], [352, "inner pyrocarbon (IPyC) · 40 µm", col.bg], [312, "porous carbon buffer · 100 µm", col.bg], [212, "UCO kernel · 425 µm dia.", col.faint]];
    layers.forEach(([r, , f], i) => { g.c.beginPath(); g.c.arc(cx, cy, r * sc, 0, 6.2832); g.c.fillStyle = f; g.c.fill(); g.ring(cx, cy, r * sc, i === 1 ? col.ink : col.mute, i === 1 ? 2.2 : 1, i === 3 ? [2, 3] : []); });
    if (s.mode) g.ring(cx, cy, 370 * sc, col.warm, 1, [2, 4]);
    s.fp.forEach((p) => g.dot(p.x, p.y, 2.2, p.out ? col.warm : col.acc));
    if (!g.narrow) layers.forEach(([r, name], i) => {
      const ang = -0.95 + i * 0.36, x0 = cx + Math.cos(ang) * (r - 12) * sc, y0 = cy + Math.sin(ang) * (r - 12) * sc;
      const x1 = cx + R + 40, y1 = cy - R * 0.85 + i * (R * 0.4);
      g.line(x0, y0, x1, y1, col.mute, 0.8); g.dot(x0, y0, 2, col.ink); g.text(name, x1 + 6, y1, { color: col.ink });
    });
    g.line(cx - 50 * sc, cy + R + 24, cx + 50 * sc, cy + R + 24, col.ink, 1.5); g.text("100 µm", cx, cy + R + 36, { align: "center", color: col.mute });
    g.corner("TRISO coated fuel particle · ~0.85 mm diameter", "tl");
    g.corner(`released past SiC: ${s.rel} of ${s.tot} tracked atoms`, "bl");
  },
});

/* ---------- A4 enhanced geothermal ---------- */
defViz("A4", {
  toggle: ["Distributed flow", "Short-circuit · thermal breakthrough"],
  legend: [["accline", "Injector · cold water"], ["warmline", "Producer · hot water"], ["line", "Stimulated fracture"], ["dash", "Microseismic event"]],
  caption: "Cold water pumped into hot rock at several kilometres depth sweeps heat through fractures opened by stimulation, then returns hot. If flow finds one dominant path, that path cools and output temperature falls years early. The fracture network cannot be seen directly, only inferred from microseismicity and flow tests. Depths and temperatures approximate.",
  init(s) { const r = rng(5); s.r = r; s.fr = Array.from({ length: 11 }, (_, i) => ({ u: 0.08 + i * 0.084 + (r() - 0.5) * 0.03, k: 0.4 + r() * 0.6, jx: (r() - 0.5) * 0.04 })); s.p = []; s.q = []; s.T = 1; },
  step(s, dt) {
    const dom = 5;
    const w = s.fr.map((f, i) => (s.mode ? (i === dom ? 8 : 0.25) : f.k));
    const sum = w.reduce((a, b) => a + b, 0);
    for (let n = 0; n < 3; n++) { let x = s.r() * sum, i = 0; while (x > w[i]) { x -= w[i]; i++; } s.p.push({ i, u: 0, sp: 0.18 + s.r() * 0.12 }); }
    s.p.forEach((p) => (p.u += p.sp * dt)); s.p = s.p.filter((p) => p.u < 1).slice(-420);
    if (s.r() < 0.06) s.q.push({ i: Math.floor(s.r() * s.fr.length), u: 0.15 + s.r() * 0.7, life: 1 });
    s.q.forEach((q) => (q.life -= dt * 0.7)); s.q = s.q.filter((q) => q.life > 0);
    s.T += ((s.mode ? 0.55 : 0.97) - s.T) * dt * 0.6;
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const top = H * 0.12, bot = H * 0.94;
    for (let i = 0; i < 18; i++) { const y = lerp(top, bot, i / 18); g.rect(0, y, W, (bot - top) / 18 + 1, col.warm, null, 0, 0.012 + 0.012 * i); }
    g.line(0, top, W, top, col.ink, 1.2);
    for (let i = 1; i <= 2; i++) { const y = lerp(top, bot, i / 2.3); g.text(`${i * 2} km`, 10, y, { color: col.mute, size: 10.5 }); g.line(36, y, 46, y, col.mute); }
    const xi = W * 0.16, xp = W * 0.24, yi = H * 0.8, yp = H * 0.56, x0 = W * 0.3, x1 = W * (g.narrow ? 0.96 : 0.86);
    g.line(xi, top, xi, yi, col.acc, 3); g.line(xi, yi, x1, yi, col.acc, 3);
    g.line(xp, top, xp, yp, col.warm, 3); g.line(xp, yp, x1, yp, col.warm, 3);
    s.fr.forEach((f, i) => { const x = lerp(x0, x1, f.u); const wv = s.mode ? (i === 5 ? 3 : 0.7) : 0.6 + f.k; g.line(x, yi + 14, x + f.jx * W, yp - 14, col.ink, wv); });
    s.p.forEach((p) => { const f = s.fr[p.i], x = lerp(x0, x1, f.u) + f.jx * W * p.u, y = lerp(yi, yp, p.u); g.dot(x, y, 1.8, p.u < 0.5 ? col.acc : col.warm); });
    s.q.forEach((q) => { const f = s.fr[q.i], x = lerp(x0, x1, f.u) + f.jx * W * q.u, y = lerp(yi, yp, q.u); g.ring(x, y, 4 + (1 - q.life) * 16, col.ink, 1, [2, 2]); });
    g.text("injector", xi - 6, top + 14, { align: "right" }); g.text("producer", xp + 6, top + 14);
    g.text("hot crystalline rock · ~200 °C", x1, bot - 12, { align: "right", color: col.ink });
    g.text("stimulated fractures", lerp(x0, x1, 0.5), (yi + yp) / 2 - (yi - yp) * 0.62, { align: "center" });
    if (!g.narrow) {
      const b = { x: W * 0.62, y: H * 0.18, w: W * 0.3, h: H * 0.2 };
      const ax = g.axes(b, [0, 30], [0.4, 1.05], { xt: [0, 10, 20, 30], yt: [], xl: "years", yl: "production temperature" });
      const pts = []; for (let y = 0; y <= 30; y++) pts.push([ax.X(y), ax.Y(s.mode ? 0.45 + 0.55 * Math.exp(-y / 6) : 1 - 0.003 * y)]);
      g.poly(pts, s.mode ? col.warm : col.acc, 2);
    }
    g.corner("enhanced geothermal doublet · vertical section", "tl");
  },
});

/* ---------- A5 perovskite ---------- */
defViz("A5", {
  toggle: ["Dark · no bias", "Light + bias · operating"],
  legend: [["dot", "Pb²⁺ (B site)"], ["grey", "I⁻ (X site)"], ["ring", "A⁺ cation (FA, MA, Cs)"], ["hole", "Iodide vacancy"]],
  caption: "Corner-sharing PbI₆ octahedra form the perovskite lattice. Iodide vacancies hop between neighbouring X sites with a low barrier. Under light and bias they drift and pile up at the contacts, screening the field and degrading the cell. Lab tests run hours to months; the warranty is 25 years. Schematic projection.",
  init(s) { const r = rng(21); s.r = r; s.v = Array.from({ length: 26 }, () => ({ i: Math.floor(r() * 30), j: Math.floor(r() * 16), h: r() < 0.5, t: r() })); s.eff = 1; },
  step(s, dt) {
    s.v.forEach((v) => {
      v.t -= dt * (s.mode ? 2.2 : 0.8);
      if (v.t < 0) {
        v.t = 0.6 + s.r() * 0.8;
        const bias = s.mode ? 0.82 : 0.5;
        if (s.r() < bias) v.i++; else v.i--;
        if (s.r() < 0.3) v.j += s.r() < 0.5 ? 1 : -1;
        v.i = clamp(v.i, 0, 29); v.j = clamp(v.j, 0, 15);
      }
    });
    const atEdge = s.v.filter((v) => v.i >= 26).length / s.v.length;
    s.eff += ((s.mode ? 1 - 0.5 * atEdge : 1) - s.eff) * dt * 0.8;
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const d = Math.max(30, Math.min(44, W / 22)), nx = Math.ceil(W / d) + 1, ny = Math.ceil(H / d) + 1;
    const oy = 14;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const x = i * d, y = j * d + oy, r = d * 0.5;
      g.poly([[x, y - r], [x + r, y], [x, y + r], [x - r, y]], col.mute, 0.8, { close: true });
      g.dot(x, y, 3.2, col.ink);
      g.dot(x + r, y, 2.4, col.mute); g.dot(x, y + r, 2.4, col.mute);
      g.ring(x + r, y + r, 4.5, col.ink, 1);
    }
    s.v.forEach((v) => { const x = v.i * d + (v.h ? d / 2 : 0), y = v.j * d + oy + (v.h ? 0 : d / 2); g.hole(x, y, 4.6, col.acc); });
    if (s.mode) {
      for (let k = 0; k < 8; k++) { const x = (k + 0.5) * W / 8 + Math.sin(g.t * 2 + k) * 4; g.arrow(x, 0, x - 10, 22, col.warm, 1.2, 5); }
      g.rect(W - 26, 0, 26, H, col.acc, null, 0, 0.12);
      g.text("vacancies pile up at contact", W - 32, H * 0.5, { align: "right", color: col.acc });
    }
    g.corner(`ABX₃ perovskite · relative output ${(s.eff * 100).toFixed(0)}%`, "bl");
  },
});

/* ---------- B1 solid-state battery ---------- */
defViz("B1", {
  toggle: ["Below critical current", "Above critical current"],
  legend: [["dot", "Li metal anode"], ["line", "Solid-electrolyte grain boundary"], ["acc", "Li⁺ ion"], ["warmline", "Li filament (dendrite)"]],
  caption: "On charging, lithium ions cross the ceramic electrolyte and plate onto the lithium-metal anode. Above a critical current density, lithium grows as filaments along grain boundaries and voids, and can short the cell. Interfaces, pressure and defects decide where that threshold sits, and testing it takes months of cycling. Schematic.",
  init(s) { const r = rng(9); s.r = r; s.ions = Array.from({ length: 60 }, () => ({ u: r(), v: r(), sp: 0.05 + r() * 0.08 })); s.den = []; s.dt = 0; s.short = 0; },
  resize(s, g) { const r = rng(4), nx = 9, ny = 6; s.grid = []; for (let i = 0; i <= nx; i++) { s.grid.push([]); for (let j = 0; j <= ny; j++) s.grid[i].push([i / nx + (i && i < nx ? (r() - 0.5) * 0.06 : 0), j / ny + (j && j < ny ? (r() - 0.5) * 0.1 : 0)]); } s.den = []; },
  step(s, dt) {
    s.ions.forEach((p) => { p.u -= p.sp * dt * (s.mode ? 2.2 : 1); if (p.u < 0) { p.u = 1; p.v = s.r(); } });
    if (s.mode && !s.short) {
      s.dt += dt;
      if (s.dt > 0.35) {
        s.dt = 0;
        if (!s.den.length) s.den.push([0, 2 + Math.floor(s.r() * 3)]);
        const [i, j] = s.den[s.den.length - 1];
        const ni = i + 1, nj = clamp(j + (s.r() < 0.5 ? -1 : s.r() < 0.5 ? 1 : 0), 0, 6);
        if (ni > 9) { s.short = 2.5; } else s.den.push([ni, nj]);
      }
    }
    if (!s.mode) s.den = [];
    if (s.short) { s.short -= dt; if (s.short <= 0) { s.short = 0; s.den = []; } }
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const x0 = W * 0.14, x1 = W * 0.8, y0 = H * 0.16, y1 = H * 0.86, P = ([u, v]) => [lerp(x0, x1, u), lerp(y0, y1, v)];
    g.rect(W * 0.04, y0, x0 - W * 0.04, y1 - y0, col.ink, null, 0, 0.85);
    for (let k = 0; k < 7; k++) g.ring(x1 + W * 0.08, lerp(y0 + 20, y1 - 20, k / 6), Math.min(22, W * 0.03), col.mute, 1.2);
    if (s.grid) for (let i = 0; i < s.grid.length; i++) for (let j = 0; j < s.grid[i].length; j++) {
      const p = P(s.grid[i][j]);
      if (i + 1 < s.grid.length) { const q = P(s.grid[i + 1][j]); g.line(p[0], p[1], q[0], q[1], col.mute, 1); }
      if (j + 1 < s.grid[i].length) { const q = P(s.grid[i][j + 1]); g.line(p[0], p[1], q[0], q[1], col.mute, 1); }
    }
    s.ions.forEach((p) => { const [x, y] = P([p.u, p.v]); g.dot(x, y, 2.6, col.acc); });
    if (s.den.length && s.grid) {
      const pts = [[x0, P(s.grid[0][s.den[0][1]])[1]]].concat(s.den.map(([i, j]) => P(s.grid[i][j])));
      g.poly(pts, col.warm, 3);
      if (s.short) g.text("short circuit", x1 - 8, y0 - 14, { align: "right", color: col.warm, weight: 600 });
    }
    g.text("Li metal", (W * 0.04 + x0) / 2, y1 + 16, { align: "center" });
    g.text("ceramic electrolyte (polycrystalline)", (x0 + x1) / 2, y1 + 16, { align: "center" });
    if (!g.narrow) g.text("cathode", x1 + W * 0.08, y1 + 16, { align: "center" });
    g.arrow(x1 - 10, y0 - 12, x0 + 60, y0 - 12, col.acc, 1.2);
    g.text("Li⁺ on charge", x0 + 66, y0 - 26, { color: col.acc });
    g.corner(s.mode ? "high current · filament grows along boundaries" : "uniform plating", "tl");
  },
});

/* ---------- B2 long-duration storage ---------- */
defViz("B2", {
  toggle: ["4-hour battery", "100-hour storage"],
  legend: [["line", "Flat data-centre load"], ["accline", "Wind + solar supply"], ["warm", "Unserved energy"], ["dash", "Stored energy"]],
  caption: "Five days of normalised wind and solar against a flat load, with a two-day wind lull. A 4-hour battery (round-trip ~88%) covers nights but not the lull. A 100-hour system covers it despite lower round-trip efficiency (~45%, approximate for iron-air). Synthetic profile; storage sized at 1× load power.",
  init(s) {
    const r = rng(8), N = 120; s.sup = [];
    for (let h = 0; h < N; h++) { const day = Math.floor(h / 24), sol = Math.max(0, Math.sin(((h % 24) - 6) / 12 * Math.PI)) * 1.5; const lull = day === 2 || day === 3 ? 0.15 : 1; const wind = (0.55 + 0.35 * Math.sin(h / 9) + (r() - 0.5) * 0.2) * lull; s.sup.push(Math.max(0, sol + wind)); }
    const sim = (E, eff) => { let soc = E * 0.5; const st = [], un = []; s.sup.forEach((p) => { let d = p - 1; if (d > 0) { const c = Math.min(d, 1, (E - soc) / Math.sqrt(eff)); soc += c * Math.sqrt(eff); un.push(0); } else { const need = -d, give = Math.min(need, 1, soc * Math.sqrt(eff)); soc -= give / Math.sqrt(eff); un.push(need - give); } st.push(soc / E); }); return { st, un, tot: un.reduce((a, b) => a + b, 0) }; };
    s.sim = [sim(4, 0.88), sim(100, 0.45)];
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const sm = s.sim[s.mode], N = s.sup.length, cur = Math.floor((g.t * 6) % N);
    const b1 = { x: 54, y: H * 0.12, w: W - 80, h: H * 0.44 };
    const a1 = g.axes(b1, [0, N], [0, 2.5], { xt: [0, 24, 48, 72, 96, 120], yt: [0, 1, 2], xl: "hours", yl: "power (× load)", ygrid: true });
    for (let h = 0; h < N; h++) if (sm.un[h] > 0) g.rect(a1.X(h), a1.Y(1), a1.X(h + 1) - a1.X(h) + 0.5, a1.Y(1 - sm.un[h]) - a1.Y(1), col.warm, null, 0, 0.55);
    g.poly(s.sup.map((p, h) => [a1.X(h + 0.5), a1.Y(p)]), col.acc, 1.8);
    g.line(a1.X(0), a1.Y(1), a1.X(N), a1.Y(1), col.ink, 1.4);
    g.text("wind lull", a1.X(60), a1.Y(2.2), { align: "center", color: col.mute });
    const b2 = { x: 54, y: H * 0.7, w: W - 80, h: H * 0.16 };
    const a2 = g.axes(b2, [0, N], [0, 1], { xt: [], yt: [0, 1], yf: (v) => (v ? "full" : "empty"), yl: "state of charge" });
    g.poly(sm.st.map((v, h) => [a2.X(h + 0.5), a2.Y(v)]), col.acc, 1.4, { dash: [5, 3] });
    g.line(a1.X(cur), b1.y, a1.X(cur), b2.y + b2.h, col.mute, 0.8, [2, 3]);
    const pct = (sm.tot / N) * 100;
    g.text(`unserved: ${pct.toFixed(1)}% of load`, W - 26, H * 0.08, { align: "right", color: pct > 1 ? col.warm : col.ink, weight: 600 });
  },
});

/* ---------- B3 HTS tape ---------- */
defViz("B3", {
  toggle: ["Superconducting · 77 K", "Local defect → quench"],
  legend: [["acc", "Supercurrent"], ["warm", "Normal (resistive) zone"], ["line", "Layer boundary"]],
  caption: "REBCO coated conductor carries current in a ceramic layer about a micrometre thick on a metal tape. A single defect can start a normal zone. In REBCO that zone spreads slowly (order cm/s), so it is hard to detect before the hot spot burns the tape. Yield of defect-free kilometres sets the cost of fusion magnets and lossless cables. Thicknesses approximate, not to scale.",
  init(s) { s.r = rng(2); s.e = Array.from({ length: 50 }, () => ({ u: s.r(), v: s.r() })); s.nz = 0; },
  step(s, dt) { s.e.forEach((p) => { p.u += dt * (s.mode && Math.abs(p.u - 0.55) < s.nz ? 0.02 : 0.12); if (p.u > 1) p.u = 0; }); s.nz = s.mode ? Math.min(0.42, s.nz + dt * 0.03) : 0; },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const L = [["copper stabiliser · ~20 µm", 0.26, col.faint], ["silver cap · ~2 µm", 0.06, col.bg], ["REBCO superconductor · ~1-2 µm", 0.08, col.soft], ["oxide buffer stack · ~0.2 µm", 0.05, col.bg], ["Hastelloy substrate · ~50 µm", 0.3, col.faint], ["copper stabiliser · ~20 µm", 0.25, col.faint]];
    const sx = 30, sw = g.narrow ? W * 0.4 : W * 0.22, sy = H * 0.16, sh = H * 0.68;
    let y = sy;
    L.forEach(([name, f, c], i) => { const h = f * sh; g.rect(sx, y, sw, h, c, col.mute, 0.8); g.text(name, sx + sw + 10, y + h / 2, { color: i === 2 ? col.acc : col.ink, size: 10.5 }); y += h; });
    g.text("cross-section", sx, sy - 14, { color: col.mute });
    if (g.narrow) return;
    const tx = W * 0.58, tw = W * 0.38, ty = H * 0.3, th = H * 0.16;
    g.rect(tx, ty, tw, th, col.faint, col.ink, 1);
    if (s.mode) { const c = tx + tw * 0.55, w = tw * s.nz; g.rect(c - w, ty, 2 * w, th, col.warm, null, 0, 0.5); g.dot(c, ty + th / 2, 4, col.warm); g.text("defect", c, ty - 10, { align: "center", color: col.warm }); }
    s.e.forEach((p) => g.dot(tx + p.u * tw, ty + 6 + p.v * (th - 12), 1.8, col.acc));
    g.text("tape top view · current →", tx, ty - 26, { color: col.mute });
    const b = { x: tx, y: H * 0.6, w: tw, h: H * 0.24 };
    const ax = g.axes(b, [0, 1], [0, 1], { xt: [], yt: [], xl: "position along tape", yl: "temperature" });
    const pts = []; for (let i = 0; i <= 80; i++) { const u = i / 80, d = Math.abs(u - 0.55); pts.push([ax.X(u), ax.Y(s.mode ? 0.1 + 0.85 * Math.exp(-(d * d) / (2 * (0.02 + s.nz * 0.4) ** 2)) * Math.min(1, s.nz * 6) : 0.1)]); }
    g.poly(pts, s.mode ? col.warm : col.acc, 2);
  },
});

/* ---------- B4 Tc history ---------- */
const TC = [
  [1911, 4.2, "Hg", 0], [1913, 7.2, "Pb", 0], [1930, 9.2, "Nb", 0], [1954, 18, "Nb₃Sn", 0], [1973, 23, "Nb₃Ge", 0],
  [1986, 35, "La-Ba-Cu-O", 1], [1987, 93, "YBCO", 1], [1988, 110, "Bi-2223", 1], [1988, 125, "Tl-2223", 1], [1993, 133, "Hg-1223", 1],
  [1994, 164, "Hg-1223 (pressure)", 3], [2001, 39, "MgB₂", 0], [2008, 55, "SmFeAsO", 2], [2015, 203, "H₃S (~150 GPa)", 3], [2019, 250, "LaH₁₀ (~170 GPa)", 3], [2023, 80, "La₃Ni₂O₇ (pressure)", 3]];
defViz("B4", {
  toggle: ["Ambient pressure", "Include high pressure"],
  legend: [["dot", "Conventional"], ["acc", "Cuprate"], ["grey", "Iron-based"], ["hole", "Under high pressure"]],
  caption: "Record critical temperatures since 1911. Cuprates passed liquid-nitrogen temperature in 1987; hydrides came close to room temperature only at megabar pressures. A 2025 large-scale study concluded room-temperature conventional superconductivity at ambient pressure is extremely unlikely. No theory yet predicts cuprate Tc. Values approximate.",
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const b = { x: 60, y: H * 0.1, w: W - 90, h: H * 0.76 };
    const ax = g.axes(b, [1905, 2030], [0, 310], { xt: g.narrow ? [1920, 1970, 2020] : [1910, 1930, 1950, 1970, 1990, 2010, 2030], yt: [0, 77, 150, 293], yf: (v) => v + " K", xl: "year", yl: "critical temperature Tc" });
    g.line(b.x, ax.Y(77), b.x + b.w, ax.Y(77), col.acc, 1, [5, 4]); g.text("liquid nitrogen 77 K", b.x + 8, ax.Y(77) - 10, { color: col.acc });
    g.line(b.x, ax.Y(293), b.x + b.w, ax.Y(293), col.warm, 1, [5, 4]); g.text("room temperature 293 K", b.x + 8, ax.Y(293) - 10, { color: col.warm });
    let best = null, bd = 1e9;
    TC.forEach(([yr, tc, n, k]) => {
      const x = ax.X(yr), y = ax.Y(tc), a = k === 3 ? s.mix : 1;
      if (a < 0.02) return;
      g.c.globalAlpha = a;
      if (k === 0) g.dot(x, y, 4, col.ink); else if (k === 1) g.dot(x, y, 4.5, col.acc); else if (k === 2) g.dot(x, y, 4.5, col.mute); else g.hole(x, y, 5, col.warm);
      if (!g.narrow && (["YBCO", "Hg-1223", "MgB₂", "Nb₃Ge", "Hg", "SmFeAsO"].includes(n) || (k === 3 && n !== "Hg-1223 (pressure)"))) g.text(n, x + 8, y - 8, { color: col.ink, size: 10.5 });
      g.c.globalAlpha = 1;
      const dd = Math.hypot(s.ptr.x - x, s.ptr.y - y); if (dd < bd && dd < 24 && a > 0.5) { bd = dd; best = [x, y, `${n} · ${yr} · ${tc} K`]; }
    });
    if (best) { g.ring(best[0], best[1], 9, col.ink, 1); g.text(best[2], best[0] + 12, best[1] + 16, { weight: 600 }); }
  },
});

/* ---------- B5 drift layer ---------- */
defViz("B5", {
  toggle: ["Silicon", "4H-SiC"],
  slider: { label: "Blocking voltage", min: 600, max: 3300, step: 100, value: 1200, fmt: (v) => v + " V" },
  legend: [["line", "Device layers"], ["accline", "Electric field E(x)"], ["soft", "Depletion region"]],
  caption: "To block a voltage V, a power transistor needs a drift layer of thickness W = 2V/Ec at doping N = εEc²/2qV. Silicon carbide's critical field is about 8× silicon's, so the layer is ~8× thinner and far more heavily doped: ideal drift resistance drops by more than 100×. Unipolar one-dimensional limit; Ec(Si) 0.3 MV/cm, Ec(SiC) 2.5 MV/cm, typical mobilities.",
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const M = [{ n: "Si", Ec: 3e5, eps: 11.7, mu: 1350 }, { n: "4H-SiC", Ec: 2.5e6, eps: 9.7, mu: 900 }];
    const V = s.val, f = (m) => ({ W: (2 * V) / m.Ec, N: (m.eps * 8.854e-14 * m.Ec * m.Ec) / (2 * 1.602e-19 * V), R: (4 * V * V) / (m.eps * 8.854e-14 * m.mu * m.Ec ** 3) });
    const r0 = f(M[0]), r1 = f(M[1]), Wmax = (2 * 3300) / 3e5;
    const Wd = lerp(r0.W, r1.W, s.mix);
    const x0 = W * (g.narrow ? 0.3 : 0.12), dw = Math.min(W * (g.narrow ? 0.36 : 0.3), 260), top = H * 0.12, full = H * 0.7;
    const hd = Math.max(6, (Wd / Wmax) * full);
    g.rect(x0, top, dw, 18, col.faint, col.ink); g.text("source · p-body", x0 + dw / 2, top + 9, { align: "center", size: 10.5 });
    g.rect(x0, top + 18, dw, hd, col.soft, col.ink, 1, 0.55); g.text("n⁻ drift layer", x0 + dw / 2, top + 18 + hd / 2, { align: "center" });
    g.rect(x0, top + 18 + hd, dw, 24, col.faint, col.ink); g.text("n⁺ substrate · drain", x0 + dw / 2, top + 30 + hd, { align: "center", size: 10.5 });
    g.line(x0 - 12, top + 18, x0 - 12, top + 18 + hd, col.ink, 1); g.text(`W = ${(Wd * 1e4).toFixed(Wd * 1e4 < 20 ? 1 : 0)} µm`, x0 - 16, top + 18 + hd / 2, { align: "right" });
    const fx = x0 + dw + 40, fw = Math.min(W * 0.18, 170);
    g.line(fx, top + 18, fx, top + 18 + hd, col.mute); g.text("E(x)", fx, top + 6, { color: col.mute });
    g.poly([[fx, top + 18], [fx + fw, top + 18], [fx, top + 18 + hd]], col.acc, 2, { close: true, fill: col.acc, alpha: 0.12 });
    g.text("Ec", fx + fw + 6, top + 18, { color: col.acc });
    const tx = g.narrow ? x0 : Math.max(fx + fw + 60, W * 0.62), ty = g.narrow ? top + full + 70 : top + 20;
    const rows = [["", "Si", "4H-SiC"], ["drift thickness", (r0.W * 1e4).toFixed(0) + " µm", (r1.W * 1e4).toFixed(1) + " µm"], ["doping", r0.N.toExponential(1) + " cm⁻³", r1.N.toExponential(1) + " cm⁻³"], ["ideal R·A", (r0.R * 1000).toFixed(0) + " mΩ·cm²", (r1.R * 1000).toFixed(2) + " mΩ·cm²"], ["ratio", "", Math.round(r0.R / r1.R) + "× lower"]];
    if (!g.narrow) rows.forEach((r, i) => { g.text(r[0], tx, ty + i * 24, { color: col.mute }); g.text(r[1], tx + 130, ty + i * 24, { weight: s.mode === 0 && i ? 600 : 400 }); g.text(r[2], tx + 260, ty + i * 24, { weight: s.mode === 1 && i ? 600 : 400, color: i ? col.acc : col.ink }); });
    g.corner(`${M[s.mode].n} vertical MOSFET · ${V} V class`, "bl");
  },
});

/* ---------- B6 OER free-energy diagram ---------- */
defViz("B6", {
  toggle: ["Ideal catalyst", "Scaling-limited catalyst"],
  slider: { label: "Electrode potential U", min: 0, max: 2, step: 0.01, value: 1.23, fmt: (v) => v.toFixed(2) + " V" },
  legend: [["accline", "ΔG at potential U"], ["dash", "ΔG at U = 0"], ["warm", "Potential-limiting step"]],
  caption: "Water oxidation takes four proton-electron steps through *OH, *O and *OOH. An ideal catalyst would make each step 1.23 eV. On real surfaces *OOH binds about 3.2 eV above *OH, so the best possible split leaves one step at 1.6 eV: a minimum overpotential of about 0.37 V. Breaking that scaling relation is the open problem.",
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const ideal = [0, 1.23, 2.46, 3.69, 4.92], real = [0, 0.86, 2.46, 4.06, 4.92];
    const G0 = ideal.map((v, i) => lerp(v, real[i], s.mix)), U = s.val;
    const GU = G0.map((v, i) => v - i * U);
    const b = { x: 64, y: H * 0.1, w: W - 100, h: H * 0.74 };
    const ax = g.axes(b, [-0.2, 5.2], [-3.5, 5.5], { xt: [], yt: [-2, 0, 2, 4], xl: "", yl: "free energy ΔG (eV)", ygrid: true });
    const names = ["H₂O", "*OH", "*O", "*OOH", "O₂"], wd = 0.6;
    const steps = G0.slice(1).map((v, i) => v - G0[i]), lim = Math.max(...steps), li = steps.indexOf(lim);
    for (let i = 0; i < 5; i++) {
      const x1 = ax.X(i + 0.1 - wd / 2 + 0.2), x2 = ax.X(i + 0.1 + wd / 2 + 0.2);
      g.line(x1, ax.Y(G0[i]), x2, ax.Y(G0[i]), col.mute, 1.4, [5, 3]);
      g.line(x1, ax.Y(GU[i]), x2, ax.Y(GU[i]), col.acc, 3);
      g.text(names[i], (x1 + x2) / 2, b.y + b.h + 16, { align: "center" });
      if (i < 4) {
        const nx = ax.X(i + 1 + 0.1 - wd / 2 + 0.2);
        g.line(x2, ax.Y(GU[i]), nx, ax.Y(GU[i + 1]), i === li ? col.warm : col.acc, i === li ? 2 : 1, [3, 3]);
        g.text(steps[i].toFixed(2), (x2 + nx) / 2, ax.Y((G0[i] + G0[i + 1]) / 2) - 10, { align: "center", color: i === li ? col.warm : col.mute, size: 10.5 });
      }
    }
    const eta = lim - 1.23, ok = steps.every((st) => st - U <= 1e-9);
    g.text(`limiting potential ${lim.toFixed(2)} V · overpotential η = ${eta.toFixed(2)} V`, W - 24, H * 0.06, { align: "right", weight: 600, color: s.mode ? col.warm : col.ink });
    g.text(ok ? "all steps downhill at this potential" : "uphill step remains", W - 24, H * 0.06 + 18, { align: "right", color: col.mute });
  },
});

/* ---------- C1 cooling ---------- */
defViz("C1", {
  toggle: ["Single-phase liquid", "Two-phase boiling"],
  slider: { label: "Chip heat flux", min: 50, max: 450, step: 5, value: 180, fmt: (v) => v + " W/cm²" },
  legend: [["accline", "Coolant flow"], ["ring", "Vapour bubble"], ["warm", "Vapour blanket (dry-out)"], ["line", "Copper fins"]],
  caption: "Microchannels in a cold plate pull heat from the die. Single-phase coolant warms up as flux rises; boiling absorbs heat at nearly constant temperature, until the critical heat flux, where vapour blankets the wall and temperature jumps. Where that limit sits for dielectric fluids in real cold plates cannot yet be predicted from first principles. Numbers illustrative.",
  init(s) { s.r = rng(31); s.f = Array.from({ length: 140 }, () => ({ x: s.r(), c: s.r() })); s.b = []; },
  step(s, dt, g) {
    s.f.forEach((p) => { p.x += dt * 0.25; if (p.x > 1) p.x = 0; });
    const q = s.val, chf = 330;
    if (s.mode && q > 90 && q < chf) for (let k = 0; k < (q - 90) / 40; k++) if (s.r() < 0.5) s.b.push({ x: s.r(), c: Math.floor(s.r() * 7), r: 1, life: 1 });
    s.b.forEach((b) => { b.r += dt * 6; b.x += dt * 0.25; b.life -= dt * 0.9; }); s.b = s.b.filter((b) => b.life > 0 && b.x < 1);
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const q = s.val, chf = 330, dry = s.mode && q >= chf;
    const T = s.mode ? (dry ? 150 + (q - chf) * 0.6 : 62 + q * 0.03) : 35 + q * 0.19;
    const x0 = 30, x1 = g.narrow ? W - 30 : W * 0.62, top = H * 0.16, chH = H * 0.42, nC = 7, cw = (x1 - x0) / nC;
    g.rect(x0, top + chH, x1 - x0, H * 0.08, col.faint, col.ink); g.text("cold-plate base", x0 + 8, top + chH + H * 0.04, { size: 10.5 });
    g.rect(x0 + (x1 - x0) * 0.15, top + chH + H * 0.08, (x1 - x0) * 0.7, H * 0.08, dry ? col.warm : col.soft, col.ink, 1, dry ? 0.7 : 1);
    g.text(`die · ${T.toFixed(0)} °C`, (x0 + x1) / 2, top + chH + H * 0.12, { align: "center", weight: 600, color: dry ? col.bg : col.ink, halo: !dry });
    for (let c = 0; c <= nC; c++) g.rect(x0 + c * cw - 3, top, 6, chH, col.mute, null, 0, 0.8);
    s.f.forEach((p) => { const c = Math.floor(p.c * nC); g.dot(x0 + c * cw + 6 + (p.x * (cw - 12)) % (cw - 12), top + 8 + ((p.c * nC) % 1) * (chH - 16), 1.6, col.acc); });
    s.b.forEach((b) => { const cx = x0 + b.c * cw + 8 + (b.x * (cw - 16)); g.ring(Math.min(cx, x0 + (b.c + 1) * cw - 8), top + chH - 6 - (1 - b.life) * chH * 0.8, Math.min(b.r, cw * 0.25), col.ink, 1); });
    if (dry) for (let c = 0; c < nC; c++) g.rect(x0 + c * cw + 3, top + chH * 0.55, cw - 6, chH * 0.45, col.warm, null, 0, 0.45);
    g.text("coolant in →", x0, top - 12, { color: col.acc });
    if (!g.narrow) {
      const b = { x: W * 0.7, y: H * 0.16, w: W * 0.25, h: H * 0.56 };
      const ax = g.axes(b, [50, 450], [20, 230], { xt: [100, 300], yt: [50, 100, 150, 200], xl: "W/cm²", yl: "die temperature °C" });
      const sp = [], tp = []; for (let x = 50; x <= 450; x += 5) { sp.push([ax.X(x), ax.Y(35 + x * 0.19)]); tp.push([ax.X(x), ax.Y(x < chf ? 62 + x * 0.03 : 150 + (x - chf) * 0.6)]); }
      g.poly(sp, s.mode ? col.mute : col.acc, s.mode ? 1 : 2); g.poly(tp, s.mode ? col.acc : col.mute, s.mode ? 2 : 1);
      g.line(ax.X(chf), b.y, ax.X(chf), b.y + b.h, col.warm, 1, [4, 3]); g.text("CHF", ax.X(chf) + 4, b.y + 8, { color: col.warm });
      g.dot(ax.X(q), ax.Y(T), 5, col.ink);
    }
  },
});

/* ---------- C2 energy of data movement ---------- */
defViz("C2", {
  toggle: ["Fetch every operand from DRAM", "Tile and reuse on chip (×32)"],
  legend: [["acc", "Operand in flight"], ["line", "Energy per 32-bit operation"], ["warm", "DRAM access"]],
  caption: "Classic 45 nm figures: a 32-bit DRAM read costs about 640 pJ, an on-chip SRAM read about 5 pJ, a floating-point multiply 3.7 pJ. Moving data, not arithmetic, dominates. Reusing each fetched value 32 times cuts energy per operation from ~644 pJ to ~29 pJ, which is why IO-aware algorithms and memory near compute matter. Source: Horowitz, ISSCC 2014, as tabulated by Han et al.",
  init(s) { s.r = rng(4); s.p = []; s.E = 0; s.ops = 0; },
  step(s, dt) {
    if (s.r() < 0.5) s.p.push({ u: 0, from: s.mode && s.r() < 31 / 32 ? 1 : 0 });
    s.p.forEach((p) => (p.u += dt * (p.from ? 1.4 : 0.6)));
    s.p.filter((p) => p.u >= 1).forEach((p) => { s.ops++; s.E += 3.7 + (p.from ? 5 : 640 + 5); });
    s.p = s.p.filter((p) => p.u < 1);
    if (s.ops > 400) { s.ops = 0; s.E = 0; }
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const y = H * 0.32, xD = W * 0.1, xS = W * 0.5, xA = W * 0.86;
    const box = (x, label, sub, c) => { g.rect(x - 52, y - 30, 104, 60, col.bg, c || col.ink, 1.4); g.text(label, x, y - 8, { align: "center", weight: 600 }); g.text(sub, x, y + 12, { align: "center", color: col.mute, size: 10.5 }); };
    g.line(xD + 52, y, xS - 52, y, col.mute, 1, [4, 4]); g.line(xS + 52, y, xA - 52, y, col.mute, 1, [4, 4]);
    box(xD, "DRAM / HBM", "off-chip", col.warm); box(xS, "SRAM", "on-chip"); box(xA, "ALU", "multiply");
    s.p.forEach((p) => { const x = p.from ? lerp(xS + 52, xA - 52, p.u) : p.u < 0.6 ? lerp(xD + 52, xS - 52, p.u / 0.6) : lerp(xS + 52, xA - 52, (p.u - 0.6) / 0.4); g.dot(x, y + (p.from ? 6 : -6), 2.6, p.from ? col.acc : col.warm); });
    const b = { x: g.narrow ? 120 : 170, y: H * 0.6, w: W - (g.narrow ? 150 : 230), h: H * 0.26 };
    const ax = g.axes(b, [0.05, 1000], [0, 4], { xlog: true, xt: [0.1, 1, 10, 100, 1000], xf: (v) => v + " pJ", yt: [] });
    [["32-bit int add", 0.1], ["32-bit float add", 0.9], ["32-bit float multiply", 3.7], ["32-bit SRAM read", 5], ["32-bit DRAM read", 640]].forEach(([n, v], i) => {
      const yy = b.y + (i + 0.5) * (b.h / 5); g.rect(b.x, yy - 5, ax.X(v) - b.x, 10, i === 4 ? col.warm : col.acc, null, 0, 0.85); g.text(n, b.x - 8, yy, { align: "right", size: 10.5 }); g.text(v + " pJ", ax.X(v) + 6, yy, { size: 10.5, color: col.mute });
    });
    const avg = s.ops ? s.E / s.ops : (s.mode ? 28.7 : 648.7);
    g.text(`measured here: ${avg.toFixed(0)} pJ per multiply`, W - 24, H * 0.08, { align: "right", weight: 600, color: s.mode ? col.acc : col.warm });
  },
});

/* ---------- C3 HBM stack ---------- */
defViz("C3", {
  toggle: ["Nominal stack", "Warpage · exaggerated"],
  legend: [["line", "Die / interposer"], ["accline", "Through-silicon via"], ["warm", "Heat and failing bonds"], ["acc", "Signal"]],
  caption: "High-bandwidth memory stacks 12 or more thinned DRAM dies on a logic base die, joined by thousands of through-silicon vias and micro-bumps or hybrid bonds, beside the GPU on a silicon interposer. Thermal mismatch bends the stack; a little warpage opens bonds at the edges. Yield of these stacks is the tightest input to AI compute through about 2027. Not to scale.",
  init(s) { s.r = rng(6); s.sig = []; },
  step(s, dt) { if (s.r() < 0.6) s.sig.push({ c: Math.floor(s.r() * 8), u: 0 }); s.sig.forEach((p) => (p.u += dt * 0.7)); s.sig = s.sig.filter((p) => p.u < 1); },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const base = H * 0.84, ix = W * 0.06, iw = W * 0.88;
    g.rect(ix - 10, base, iw + 20, H * 0.07, col.faint, col.ink); g.text("package substrate", ix, base + H * 0.035, { size: 10.5 });
    g.rect(ix, base - H * 0.05, iw, H * 0.05, col.bg, col.ink); g.text("silicon interposer", ix + 8, base - H * 0.025, { size: 10.5 });
    const gx = ix + iw * 0.04, gw = iw * 0.4, gy = base - H * 0.05 - H * 0.16;
    g.rect(gx, gy, gw, H * 0.16, col.warm, col.ink, 1.2, 0.35); g.text("GPU die · ~1 kW", gx + gw / 2, gy + H * 0.08, { align: "center", weight: 600 });
    const sx = ix + iw * 0.55, sw = iw * 0.38, n = 12, dh = Math.min(16, H * 0.042), sb = base - H * 0.05;
    const warp = s.mix * 10;
    const yAt = (k, u) => sb - (k + 1) * (dh + 3) - Math.sin(u * Math.PI) * warp * (0.6 + k / n);
    for (let k = -1; k < n; k++) {
      const pts = []; for (let i = 0; i <= 20; i++) pts.push([sx + (i / 20) * sw, yAt(k, i / 20)]);
      const bot = pts.map(([x, y]) => [x, y + dh]).reverse();
      g.poly(pts.concat(bot), col.ink, 1, { close: true, fill: k < 0 ? col.faint : col.warm, alpha: k < 0 ? 1 : 0.04 + 0.03 * (n - k) / n });
    }
    g.text("logic base die", sx - 8, yAt(-1, 0) + dh / 2, { align: "right", size: 10.5 });
    g.text("12-high DRAM stack", sx + sw / 2, yAt(n - 1, 0.5) - 14 - warp, { align: "center", weight: 600 });
    for (let c = 0; c < 8; c++) { const u = (c + 0.5) / 8, x = sx + u * sw; g.line(x, yAt(n - 1, u), x, yAt(-1, u) + dh, col.acc, 1.2); }
    s.sig.forEach((p) => { const u = (p.c + 0.5) / 8, x = sx + u * sw; g.dot(x, lerp(yAt(-1, u) + dh, yAt(n - 1, u), p.u), 2.4, col.acc); });
    if (s.mix > 0.5) for (let k = 0; k < n; k += 3) { const x = sx + 4, y = yAt(k, 0) + dh + 1; g.line(x - 4, y - 4, x + 4, y + 4, col.warm, 1.5); g.line(x - 4, y + 4, x + 4, y - 4, col.warm, 1.5); }
    if (!g.narrow) { g.text("TSV", sx + sw + 10, yAt(5, 1) + 6, { color: col.acc }); g.text("micro-bump / hybrid bond", sx + sw + 10, yAt(2, 1) + 16, { color: col.mute, size: 10.5 }); }
    g.corner(s.mode ? "warpage exaggerated · edge bonds opening" : "2.5D package · GPU + HBM on interposer", "tl");
  },
});

/* ---------- C4 grid frequency ---------- */
defViz("C4", {
  toggle: ["High inertia · synchronous machines", "Low inertia · inverter-dominated"],
  legend: [["dot", "Generator (rotating phasor)"], ["warm", "AI campus load"], ["accline", "System frequency"], ["dash", "±0.2 Hz band"]],
  caption: "A gigawatt AI campus swings its power as training steps synchronise. The grid's spinning inertia resists the resulting frequency change; with less inertia (more inverters), the same swing moves frequency faster and further. Certifying that a large load stays inside safe bounds is today done case by case in slow simulation studies. Single-area swing model with droop; illustrative parameters.",
  init(s) { s.w = 0; s.pm = 0; s.hist = []; s.ph = 0; },
  step(s, dt) {
    const Hn = s.mode ? 1.5 : 6, D = 1, R = 0.05, Tg = 4;
    const cyc = s.t % 6, ai = 0.06 * (cyc < 3 ? 1 : 0) + (cyc > 5.4 ? -0.05 : 0);
    s.load = ai;
    const sub = 10; for (let i = 0; i < sub; i++) { const h = dt / sub; s.w += ((s.pm - ai - D * s.w) / (2 * Hn)) * h; s.pm += ((-s.pm - s.w / R) / Tg) * h; }
    s.ph += s.w * 60 * dt * 8;
    s.hist.push(s.w * 60); if (s.hist.length > 600) s.hist.shift();
  },
  draw(g, s) {
    const { W, H, col } = g; g.clear();
    const N = [[0.1, 0.2], [0.28, 0.12], [0.45, 0.24], [0.62, 0.14], [0.8, 0.22], [0.18, 0.42], [0.38, 0.45], [0.58, 0.4], [0.86, 0.44]];
    const E = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 2], [6, 7], [7, 3], [7, 8], [4, 8], [1, 6]];
    const P = (i) => [N[i][0] * W, N[i][1] * H];
    E.forEach(([a, b]) => { const p = P(a), q = P(b); g.line(p[0], p[1], q[0], q[1], col.mute, 1.2, [6, 4]); });
    const gens = [0, 3, 5, 8];
    N.forEach((_, i) => {
      const [x, y] = P(i);
      if (gens.includes(i)) { const inv = s.mode && (i === 3 || i === 5); g.ring(x, y, 13, col.ink, 1.3); if (inv) g.text("~", x, y, { align: "center", size: 14 }); else { const a = s.ph + i; g.line(x, y, x + Math.cos(a) * 11, y + Math.sin(a) * 11, col.ink, 1.6); } }
      else if (i === 7) { const sw = 1 + s.load * 4; g.rect(x - 12 * sw, y - 12 * sw, 24 * sw, 24 * sw, col.warm, col.ink, 1, 0.5); }
      else g.dot(x, y, 4, col.ink);
    });
    g.text("AI campus", P(7)[0], P(7)[1] + 30, { align: "center", color: col.warm });
    g.text(s.mode ? "inverter-based plant" : "synchronous generator", P(3)[0], P(3)[1] - 24, { align: "center", color: col.mute });
    const b = { x: 66, y: H * 0.62, w: W - 96, h: H * 0.26 };
    const ax = g.axes(b, [0, 600], [-0.5, 0.5], { xt: [], yt: [-0.4, -0.2, 0, 0.2, 0.4], yf: (v) => (v > 0 ? "+" : "") + v.toFixed(1), yl: "frequency deviation (Hz)" });
    g.line(b.x, ax.Y(0.2), b.x + b.w, ax.Y(0.2), col.acc, 1, [4, 4]); g.line(b.x, ax.Y(-0.2), b.x + b.w, ax.Y(-0.2), col.acc, 1, [4, 4]);
    g.poly(s.hist.map((v, i) => [ax.X(i + 600 - s.hist.length), ax.Y(clamp(v, -0.5, 0.5))]), col.acc, 2);
    const mn = Math.min(...s.hist.slice(-300)); g.text(`nadir ${mn.toFixed(2)} Hz`, b.x + b.w, b.y - 12, { align: "right", weight: 600, color: mn < -0.2 ? col.warm : col.ink });
  },
});
}
