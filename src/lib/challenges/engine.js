/* Figure engine: canvas plates with mono annotations, toggles, sliders, buttons.
   Ported from the Illustrated Atlas (engine.js) as an ES module. Changes from the original:
   - helpers are exports instead of window globals;
   - fonts are read from CSS variables (next/font hashes family names);
   - destroy() also removes control and window listeners. */
export const VIZ = {};
export function defViz(id, spec) { VIZ[id] = spec; }

export function rng(seed) {
  let s = (seed * 9301 + 49297) % 233280 || 1;
  return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => t * t * (3 - 2 * t);

function readCols(el) {
  const pr = document.createElement("span"); pr.style.display = "none"; el.appendChild(pr);
  const v = (n) => { pr.style.color = `var(${n})`; return getComputedStyle(pr).color; };
  const f = (n, fb) => { pr.style.fontFamily = `var(${n}), ${fb}`; return getComputedStyle(pr).fontFamily; };
  try {
    return { bg: v("--fig-bg"), ink: v("--fig-ink"), mute: v("--fig-mute"), grid: v("--fig-grid"),
      acc: v("--fig-acc"), warm: v("--fig-warm"), soft: v("--fig-soft"), faint: v("--fig-faint"),
      mono: f("--atlas-mono", "ui-monospace, Menlo, monospace"), sans: f("--atlas-sans", "system-ui, sans-serif") };
  } finally { pr.remove(); }
}

function makeG(ctx, W, H, col) {
  const MONO = col.mono || '"IBM Plex Mono", ui-monospace, Menlo, monospace';
  const SANS = col.sans || "Inter, system-ui, sans-serif";
  const g = { c: ctx, W, H, col, narrow: W < 560, t: 0 };
  g.clear = () => { ctx.fillStyle = col.bg; ctx.fillRect(0, 0, W, H); };
  g.dot = (x, y, r, c) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fillStyle = c || col.ink; ctx.fill(); };
  g.ring = (x, y, r, c, lw, dash) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.setLineDash(dash || []);
    ctx.strokeStyle = c || col.ink; ctx.lineWidth = lw || 1.2; ctx.stroke(); ctx.setLineDash([]);
  };
  g.hole = (x, y, r, c) => { g.dot(x, y, r, col.bg); g.ring(x, y, r, c || col.acc, 1.6); };
  g.line = (x1, y1, x2, y2, c, lw, dash) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.setLineDash(dash || []);
    ctx.strokeStyle = c || col.grid; ctx.lineWidth = lw || 1; ctx.stroke(); ctx.setLineDash([]);
  };
  g.poly = (pts, c, lw, o) => {
    o = o || {}; if (!pts.length) return;
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (o.close) ctx.closePath();
    if (o.fill) { ctx.fillStyle = o.fill; ctx.globalAlpha = o.alpha == null ? 1 : o.alpha; ctx.fill(); ctx.globalAlpha = 1; }
    if (c) { ctx.setLineDash(o.dash || []); ctx.strokeStyle = c; ctx.lineWidth = lw || 1; ctx.stroke(); ctx.setLineDash([]); }
  };
  g.rect = (x, y, w, h, fill, stroke, lw, alpha) => {
    if (fill) { ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1; }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.strokeRect(x, y, w, h); }
  };
  g.text = (s, x, y, o) => {
    o = o || {};
    ctx.font = `${o.weight || 400} ${o.size || 11.5}px ${o.sans ? SANS : MONO}`;
    ctx.textAlign = o.align || "left"; ctx.textBaseline = o.base || "middle";
    if (o.halo !== false) { ctx.lineWidth = 4; ctx.strokeStyle = col.bg; ctx.lineJoin = "round"; ctx.strokeText(s, x, y); }
    ctx.fillStyle = o.color || col.ink; ctx.fillText(s, x, y);
  };
  g.tw = (s, size) => { ctx.font = `400 ${size || 11.5}px ${MONO}`; return ctx.measureText(s).width; };
  g.arrow = (x1, y1, x2, y2, c, lw, head) => {
    g.line(x1, y1, x2, y2, c, lw);
    const a = Math.atan2(y2 - y1, x2 - x1), h = head || 6;
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45));
    ctx.lineTo(x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45));
    ctx.closePath(); ctx.fillStyle = c || col.ink; ctx.fill();
  };
  g.spin = (x, y, up, len, c) => {
    const l = len || 8, d = up ? -1 : 1;
    g.arrow(x, y - d * l, x, y + d * l, c || col.ink, 1.4, 4);
  };
  g.axes = (b, xr, yr, o) => {
    o = o || {};
    const lx = (v) => (o.xlog ? Math.log10(v) : v), ly = (v) => (o.ylog ? Math.log10(v) : v);
    const X = (v) => b.x + ((lx(v) - lx(xr[0])) / (lx(xr[1]) - lx(xr[0]))) * b.w;
    const Y = (v) => b.y + b.h - ((ly(v) - ly(yr[0])) / (ly(yr[1]) - ly(yr[0]))) * b.h;
    g.line(b.x, b.y + b.h, b.x + b.w, b.y + b.h, col.mute, 1);
    g.line(b.x, b.y, b.x, b.y + b.h, col.mute, 1);
    (o.xt || []).forEach((v) => {
      g.line(X(v), b.y + b.h, X(v), b.y + b.h + 4, col.mute);
      if (o.xgrid) g.line(X(v), b.y, X(v), b.y + b.h, col.faint);
      g.text(o.xf ? o.xf(v) : String(v), X(v), b.y + b.h + 14, { align: "center", color: col.mute, size: 10.5 });
    });
    (o.yt || []).forEach((v) => {
      g.line(b.x - 4, Y(v), b.x, Y(v), col.mute);
      if (o.ygrid) g.line(b.x, Y(v), b.x + b.w, Y(v), col.faint);
      g.text(o.yf ? o.yf(v) : String(v), b.x - 7, Y(v), { align: "right", color: col.mute, size: 10.5 });
    });
    if (o.xl) g.text(o.xl, b.x + b.w, b.y + b.h + 30, { align: "right", color: col.mute, size: 10.5 });
    if (o.yl) g.text(o.yl, b.x, b.y - 12, { align: "left", color: col.mute, size: 10.5 });
    return { X, Y };
  };
  g.corner = (s, pos) => {
    const p = pos || "tl", m = 18;
    const x = p[1] === "l" ? m : W - m, y = p[0] === "t" ? m + 4 : H - m;
    g.text(s, x, y, { align: p[1] === "l" ? "left" : "right", color: col.ink, size: 11.5 });
  };
  return g;
}

/* Mount a figure into a container that holds a .plate (and optionally its controls). Returns {destroy}. */
export function mountFigure(el, id, opts) {
  opts = opts || {};
  const spec = VIZ[id];
  if (!spec) return { destroy() {} };
  const ac = new AbortController(), sig = { signal: ac.signal };
  const cv = document.createElement("canvas");
  el.querySelector(".plate").appendChild(cv);
  const ctx = cv.getContext("2d");
  const s = { mode: 0, mix: 0, val: spec.slider ? spec.slider.value : 0, btn: 0, ptr: { x: -1, y: -1, down: false, click: null }, t: 0 };
  let W = 0, H = 0, raf = 0, last = 0, alive = true, inited = false, COL = readCols(el);
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function size() {
    COL = readCols(el);
    const r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(200, r.width); H = Math.max(160, r.height);
    cv.width = Math.round(W * d); cv.height = Math.round(H * d); ctx.setTransform(d, 0, 0, d, 0, 0);
    if (!inited && spec.init) { spec.init(s, makeG(ctx, W, H, COL)); inited = true; }
    if (spec.resize) spec.resize(s, makeG(ctx, W, H, COL));
  }
  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
    s.t += dt;
    s.mix += ((s.mode ? 1 : 0) - s.mix) * Math.min(1, dt * 3.2);
    const g = makeG(ctx, W, H, COL); g.t = s.t; g.dt = dt;
    try {
      if (spec.step) spec.step(s, dt, g);
      spec.draw(g, s);
    } catch (e) { console.error(id, e); alive = false; }
    s.ptr.click = null;
    if (!opts.still && !reduce) raf = requestAnimationFrame(frame);
  }
  const ro = new ResizeObserver(() => { if (!alive) return; size(); if (opts.still || reduce) frame(performance.now()); });
  ro.observe(cv);
  size();
  if (opts.still) {
    for (let i = 0; i < (opts.warm || 90); i++) { s.t += 1 / 30; s.mix += ((s.mode ? 1 : 0) - s.mix) * 0.1; if (spec.step) { const g = makeG(ctx, W, H, COL); g.t = s.t; g.dt = 1 / 30; spec.step(s, 1 / 30, g); } }
    frame(performance.now());
  } else raf = requestAnimationFrame(frame);
  // pointer
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener("pointermove", (e) => { const [x, y] = pos(e); s.ptr.x = x; s.ptr.y = y; }, sig);
  cv.addEventListener("pointerdown", (e) => { const [x, y] = pos(e); s.ptr.x = x; s.ptr.y = y; s.ptr.down = true; s.ptr.click = [x, y]; if (reduce) frame(performance.now()); }, sig);
  window.addEventListener("pointerup", () => { s.ptr.down = false; }, sig);
  cv.addEventListener("pointerleave", () => { s.ptr.x = -1; }, sig);
  // controls
  const redraw = () => { if (reduce) { s.mix = s.mode ? 1 : 0; frame(performance.now()); } };
  el.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
    s.mode = +b.dataset.mode;
    el.querySelectorAll("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    redraw();
  }, sig));
  const sl = el.querySelector("input[type=range]");
  if (sl) sl.addEventListener("input", () => { s.val = +sl.value; const o = el.querySelector(".sval"); if (o) o.textContent = spec.slider.fmt ? spec.slider.fmt(s.val) : s.val; redraw(); }, sig);
  const bt = el.querySelector("[data-act]");
  if (bt) bt.addEventListener("click", () => { s.btn++; if (spec.onButton) spec.onButton(s); redraw(); }, sig);
  return { destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); ac.abort(); cv.remove(); } };
}
