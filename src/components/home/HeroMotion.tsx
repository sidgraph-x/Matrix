"use client";

/* Hero: "sunlight to taste" in five chapters, after the redesign's NodeMotion board.
   A camera pans along one ember thread: sunlight charges batteries, power lights a GPU,
   data leaves by dish and satellite, a model learns on a glass layer, and keep / revise / reject
   marks shape a taste profile. Geometry follows the board; every object is drawn as hardware.
   A far layer pans at a third of the camera's speed, so each chapter change has depth. */
import { useEffect, useMemo, useRef, useState } from "react";

const A = "#FF6B2C";
const DUR = 6;
const CHAPTERS = [
  { title: "Energy", line: "Sunlight, captured on the roof and banked in the skid." },
  { title: "Compute", line: "Power flows straight into silicon, beside the batteries." },
  { title: "Link", line: "Fiber where it exists. Satellite where it doesn’t." },
  { title: "Intelligence", line: "A model that keeps learning, on the machine itself." },
  { title: "Taste", line: "What you keep, change and reject becomes its judgment." },
];
const THREAD =
  "M262 152L450 372V440C450 462 462 470 484 470H640M808 470H1000C1100 470 1120 380 1200 380H1500C1600 380 1650 500 1750 500H2120M2120 500H2700C2800 500 2850 340 2960 340H3340C3450 340 3500 330 3600 330H3700M3860 330C3950 330 3990 320 4060 320";
const REACH = [0.15, 0.34, 0.55, 0.85, 1];
const mono = { fontFamily: "var(--font-geist-mono)", fontSize: 11, letterSpacing: 1.6, fill: "#9A907F" } as const;

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/* point on a quad given as four corners (top-left, top-right, bottom-right, bottom-left) */
function quadPt(q: number[][], u: number, v: number) {
  const top = [lerp(q[0][0], q[1][0], u), lerp(q[0][1], q[1][1], u)];
  const bot = [lerp(q[3][0], q[2][0], u), lerp(q[3][1], q[2][1], u)];
  return [lerp(top[0], bot[0], v), lerp(top[1], bot[1], v)];
}

/* a small containerised Node in isometric, used for "your Node" and its peers */
function MiniNode({ x, y, s = 1, lit = false }: { x: number; y: number; s?: number; lit?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="30" rx="70" ry="12" fill="#000" opacity=".55" filter="url(#hm-blur6)" />
      <path d="M-60 -6L0 -36L60 -6L0 24Z" fill="url(#hm-top)" />
      <path d="M-60 -6L0 24V54L-60 24Z" fill="url(#hm-left)" />
      <path d="M0 24L60 -6V24L0 54Z" fill="url(#hm-right)" />
      <path d="M-60 -6L0 24L60 -6" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth=".8" />
      <path d="M-52 2L-8 24V28L-52 6Z" fill={A} opacity=".85" />
      <path d="M-44 14L-30 21V40L-44 33Z" fill="#2f2b27" />
      <path d="M10 26L48 7V20L10 39Z" fill="url(#hm-louv)" />
      <circle cx="-12" cy="34" r="1.6" fill={lit ? A : "#D9A55B"} className="blink" />
    </g>
  );
}

function Satellite({ x, y, s = 1, r = -18 }: { x: number; y: number; s?: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M-34 0H-52M34 0H52" stroke="#b7bcc2" strokeWidth="2.4" />
      {[-1, 1].map((d) => (
        <g key={d} transform={`translate(${d < 0 ? -200 : 52} -22)`}>
          <rect width="148" height="44" fill="url(#hm-cell)" />
          <rect width="148" height="44" fill="url(#hm-grid)" />
          <rect width="148" height="44" fill="url(#hm-wingsheen)" />
          <path d="M49.3 0V44M98.6 0V44" stroke="#aab3bd" strokeWidth="1.4" />
          <rect width="148" height="44" fill="none" stroke="#c3c9cf" strokeWidth="1.4" />
        </g>
      ))}
      <path d="M-34 -28L-22 -38H40L28 -28Z" fill="url(#hm-foiltop)" />
      <path d="M28 -28L40 -38V20L28 30Z" fill="#6a4f20" />
      <rect x="-34" y="-28" width="62" height="58" fill="url(#hm-foil)" />
      <path d="M-30 -20L-12 -6L4 -18L22 -2M-28 8L-8 16L8 4L24 20" fill="none" stroke="#fff2cc" strokeOpacity=".35" strokeWidth=".8" />
      <rect x="-20" y="-16" width="16" height="10" fill="#1b1d22" stroke="#9aa0a6" strokeWidth=".6" />
      <path d="M-3 30V40" stroke="#b7bcc2" strokeWidth="2" />
      <ellipse cx="-3" cy="45" rx="16" ry="5" fill="url(#hm-dish)" />
    </g>
  );
}

export default function HeroMotion() {
  const [ch, setCh] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reduce, setReduce] = useState(false);
  const tm = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const r = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduce(r);
    if (r) setPlaying(false);
  }, []);
  useEffect(() => {
    if (!playing) return;
    tm.current = setTimeout(() => setCh((c) => (c + 1) % 5), DUR * 1000);
    return () => { if (tm.current) clearTimeout(tm.current); };
  }, [ch, playing]);

  const art = useMemo(() => {
    const cores: { x: number; y: number; d: string; f: string }[] = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) cores.push({ x: 1262 + c * 23.5, y: 252 + r * 23.5, d: ((r + c) * 0.12).toFixed(2), f: (r * 3 + c) % 7 === 0 ? "#D9A55B" : A });
    const xs = [2960, 3080, 3220, 3340], ns = [5, 6, 6, 3];
    const cols = xs.map((x, ci) => Array.from({ length: ns[ci] }, (_, k) => ({ x, y: 340 + (k - (ns[ci] - 1) / 2) * 56, t: (ci * 0.35 + k * 0.05).toFixed(2) })));
    const edges: { d: string; t: string }[] = [];
    for (let ci = 0; ci < 3; ci++) cols[ci].forEach((a, ai) => cols[ci + 1].forEach((b, bi) => edges.push({ d: `M${a.x} ${a.y}L${b.x} ${b.y}`, t: (ci * 0.35 + ((ai + bi) % 5) * 0.07).toFixed(2) })));
    const pv = [[330, 362], [560, 330], [612, 402], [382, 434]];
    const cells: string[] = [];
    for (let i = 1; i < 10; i++) { const a = quadPt(pv, i / 10, 0), b = quadPt(pv, i / 10, 1); cells.push(`M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`); }
    for (let j = 1; j < 6; j++) { const a = quadPt(pv, 0, j / 6), b = quadPt(pv, 1, j / 6); cells.push(`M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`); }
    const r = rng(17);
    const stars = Array.from({ length: 140 }, () => [Math.round(r() * 2600 - 300), Math.round(r() * 300 + 10), +(r() * 0.9 + 0.3).toFixed(2), +(r() * 0.5 + 0.1).toFixed(2)]);
    const caps = Array.from({ length: 22 }, (_, i) => ({ x: 1176 + (i % 11) * 32, y: i < 11 ? 176 : 498 }));
    return { cores, nodes: cols.flat(), edges, pv, cells: cells.join(""), stars, caps };
  }, []);

  const camX = 150 - ch * 900;
  const dash = Math.round(1000 * (1 - REACH[ch]));
  const op = (i: number) => (i === ch ? 1 : 0.28);
  const pick = (i: number) => setCh(i);
  const ease = reduce ? "none" : "transform 1.9s cubic-bezier(.65,0,.35,1)";

  return (
    <div className="flex flex-col gap-5 text-night-ink">
      <div className="relative overflow-hidden rounded-[3px]">
        <svg viewBox="0 0 1200 600" className="block h-auto w-full" role="img" aria-label="Motion graphic in five chapters. Sunlight falls on a solar module and charges a bank of batteries; power flows into a GPU whose cores light up; data leaves by dish and satellite to other Nodes; a neural network forms on a glass layer and pulses; finally keep, revise and reject marks shape a personal taste profile. One ember thread connects every stage.">
          <defs>
            <radialGradient id="hm-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fff1d0" stopOpacity=".9" /><stop offset=".18" stopColor="#ffb36b" stopOpacity=".55" /><stop offset=".55" stopColor={A} stopOpacity=".14" /><stop offset="1" stopColor={A} stopOpacity="0" /></radialGradient>
            <radialGradient id="hm-suncore" cx=".4" cy=".4" r=".6"><stop offset="0" stopColor="#fffaf0" /><stop offset=".6" stopColor="#ffd59c" /><stop offset="1" stopColor="#ff9a57" /></radialGradient>
            <linearGradient id="hm-pv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3b4a60" /><stop offset=".45" stopColor="#1c2533" /><stop offset="1" stopColor="#0f141c" /></linearGradient>
            <linearGradient id="hm-pvsheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffd2a8" stopOpacity=".35" /><stop offset=".3" stopColor="#fff" stopOpacity="0" /><stop offset=".62" stopColor="#fff" stopOpacity=".07" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
            <linearGradient id="hm-alu" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6f6a63" /><stop offset=".5" stopColor="#d9d3c8" /><stop offset="1" stopColor="#6f6a63" /></linearGradient>
            <linearGradient id="hm-case" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2a2622" /><stop offset=".18" stopColor="#4a453e" /><stop offset=".5" stopColor="#34302b" /><stop offset="1" stopColor="#1d1a17" /></linearGradient>
            <linearGradient id="hm-charge" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={A} /><stop offset="1" stopColor="#ffb27a" /></linearGradient>
            <linearGradient id="hm-charge2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#b8862f" /><stop offset="1" stopColor="#f0c77e" /></linearGradient>
            <linearGradient id="hm-glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity=".16" /><stop offset=".35" stopColor="#fff" stopOpacity=".02" /><stop offset="1" stopColor="#fff" stopOpacity=".08" /></linearGradient>
            <radialGradient id="hm-cu" cx=".35" cy=".35" r=".7"><stop offset="0" stopColor="#ffd2ad" /><stop offset="1" stopColor="#a4582a" /></radialGradient>
            <linearGradient id="hm-pcb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2a2520" /><stop offset="1" stopColor="#15120f" /></linearGradient>
            <linearGradient id="hm-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6dc9c" /><stop offset="1" stopColor="#a67b2e" /></linearGradient>
            <linearGradient id="hm-hbm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c9c6c0" /><stop offset=".4" stopColor="#77736c" /><stop offset=".7" stopColor="#a9a59e" /><stop offset="1" stopColor="#56524c" /></linearGradient>
            <linearGradient id="hm-die" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2a2932" /><stop offset=".5" stopColor="#17161c" /><stop offset="1" stopColor="#221f26" /></linearGradient>
            <linearGradient id="hm-diesheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9fb4ff" stopOpacity=".12" /><stop offset=".3" stopColor="#ff9adf" stopOpacity=".05" /><stop offset=".5" stopColor="#fff" stopOpacity="0" /><stop offset=".8" stopColor="#ffe0a0" stopOpacity=".07" /></linearGradient>
            <pattern id="hm-trace" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M0 6H10L14 10V24M24 16H16L12 12" fill="none" stroke="#c77a45" strokeOpacity=".16" strokeWidth=".8" /></pattern>
            <linearGradient id="hm-top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6f2eb" /><stop offset="1" stopColor="#cfc7ba" /></linearGradient>
            <linearGradient id="hm-left" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d8d0c3" /><stop offset="1" stopColor="#aaa192" /></linearGradient>
            <linearGradient id="hm-right" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8f877a" /><stop offset="1" stopColor="#6a6357" /></linearGradient>
            <pattern id="hm-louv" width="6" height="4" patternUnits="userSpaceOnUse"><rect width="6" height="4" fill="#7d7568" /><path d="M0 .6H6" stroke="#a39a8c" /><path d="M0 3H6" stroke="#5c554b" /></pattern>
            <radialGradient id="hm-dish" cx=".35" cy=".3" r=".85"><stop offset="0" stopColor="#ffffff" /><stop offset=".7" stopColor="#cfcac2" /><stop offset="1" stopColor="#8d877d" /></radialGradient>
            <linearGradient id="hm-mast" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#5d574f" /><stop offset=".5" stopColor="#d6cfc2" /><stop offset="1" stopColor="#5d574f" /></linearGradient>
            <linearGradient id="hm-foil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6d5221" /><stop offset=".22" stopColor="#e9c97c" /><stop offset=".4" stopColor="#9c7735" /><stop offset=".62" stopColor="#f4dea2" /><stop offset=".8" stopColor="#8a6a2c" /><stop offset="1" stopColor="#5e451b" /></linearGradient>
            <linearGradient id="hm-foiltop" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f7e6b8" /><stop offset="1" stopColor="#b8913f" /></linearGradient>
            <linearGradient id="hm-cell" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2b4468" /><stop offset=".5" stopColor="#14233a" /><stop offset="1" stopColor="#0a1220" /></linearGradient>
            <linearGradient id="hm-wingsheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".55" stopColor="#ffd9b0" stopOpacity=".3" /><stop offset=".7" stopColor="#fff" stopOpacity="0" /></linearGradient>
            <pattern id="hm-grid" width="12.33" height="11" patternUnits="userSpaceOnUse"><path d="M12.33 0V11M0 11H12.33" stroke="#5f7da6" strokeOpacity=".55" strokeWidth=".7" /></pattern>
            <linearGradient id="hm-slab" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={A} stopOpacity=".12" /><stop offset=".5" stopColor={A} stopOpacity=".03" /><stop offset="1" stopColor={A} stopOpacity=".08" /></linearGradient>
            <linearGradient id="hm-paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f3efe7" /><stop offset="1" stopColor="#ddd6c9" /></linearGradient>
            <filter id="hm-blur6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
            <filter id="hm-blur14" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
            <filter id="hm-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <filter id="hm-drop" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#000" floodOpacity=".55" /></filter>
          </defs>

          {/* far plane: a star field panning at a third of the camera's speed */}
          <g style={{ transform: `translateX(${camX * 0.34}px)`, transition: ease }}>
            {art.stars.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} fill="#f3ecdf" opacity={o} />)}
          </g>

          <g style={{ transform: `translateX(${camX}px)`, transition: ease }}>
            <path d="M-400 520H4900" stroke="#EDE6DA" strokeOpacity=".12" />
            <path d={THREAD} fill="none" stroke={A} strokeOpacity=".18" strokeWidth="7" pathLength={1000} strokeDasharray="1000" style={{ strokeDashoffset: dash, transition: reduce ? "none" : "stroke-dashoffset 2.2s cubic-bezier(.65,0,.35,1)" }} />
            <path d={THREAD} fill="none" stroke={A} strokeWidth="2" pathLength={1000} strokeDasharray="1000" style={{ strokeDashoffset: dash, transition: reduce ? "none" : "stroke-dashoffset 2.2s cubic-bezier(.65,0,.35,1)" }} filter="url(#hm-glow)" />

            {/* 01 ENERGY — sun, framed PV module on its post, four battery modules */}
            <g style={{ opacity: op(0), transition: "opacity 1.2s ease" }}>
              <text x="90" y="70" {...mono} fontSize="12" letterSpacing="2">01 · ENERGY</text>
              <circle cx="262" cy="152" r="150" fill="url(#hm-sun)" />
              <circle cx="262" cy="152" r="68" fill="none" stroke={A} strokeOpacity=".5" strokeWidth="10" strokeDasharray="1.5 16" className="ef-ring" style={{ animationDuration: "40s" }} />
              <circle cx="262" cy="152" r="24" fill="url(#hm-suncore)" filter="url(#hm-glow)" />
              <g fill="none" stroke="#ffb27a" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="6 16" strokeOpacity=".85">
                <path className="flow" d="M300 196L392 334" /><path className="flow" d="M318 178L470 322" style={{ animationDelay: "-.4s" }} /><path className="flow" d="M278 206L346 344" style={{ animationDelay: "-.8s" }} /><path className="flow" d="M330 160L540 318" style={{ animationDelay: "-.2s" }} />
              </g>
              <ellipse cx="470" cy="520" rx="150" ry="10" fill="#000" opacity=".6" filter="url(#hm-blur6)" />
              <rect x="465" y="414" width="10" height="104" fill="url(#hm-mast)" />
              <path d="M440 520L470 506L500 520" fill="none" stroke="#8d867b" strokeWidth="3" />
              <path d="M420 424L470 414L520 404" stroke="#6f6a63" strokeWidth="4" />
              <polygon points="326,358 564,325 618,404 380,438" fill="#2b2824" />
              <polygon points={art.pv.map((p) => p.join(",")).join(" ")} fill="url(#hm-pv)" />
              <path d={art.cells} stroke="#6b7d96" strokeOpacity=".45" strokeWidth=".8" />
              <polygon points={art.pv.map((p) => p.join(",")).join(" ")} fill="url(#hm-pvsheen)" />
              <polygon points="326,358 564,325 618,404 380,438" fill="none" stroke="url(#hm-alu)" strokeWidth="3.4" />
              <text x="330" y="470" {...mono}>PV MODULE</text>
              <ellipse cx="726" cy="488" rx="100" ry="9" fill="#000" opacity=".6" filter="url(#hm-blur6)" />
              {[648, 690, 732, 774].map((x, i) => (
                <g key={x}>
                  <rect x={x} y="350" width="30" height="132" rx="3" fill="url(#hm-case)" />
                  <rect x={x + 4} y="343" width="9" height="8" rx="1.5" fill="url(#hm-cu)" />
                  <rect x={x + 17} y="343" width="9" height="8" rx="1.5" fill="#bcb5aa" />
                  <rect x={x + 5} y="360" width="20" height="104" rx="1.5" fill="#0f0d0b" />
                  <rect x={x + 6} y="361" width="18" height="102" fill={i < 2 ? "url(#hm-charge)" : "url(#hm-charge2)"} className="hm-chg" style={{ animationDelay: `${-i * 0.6}s` }} />
                  <rect x={x + 5} y="360" width="20" height="104" rx="1.5" fill="url(#hm-glass)" />
                  <rect x={x + 3} y="470" width="24" height="5" fill="#141210" />
                  <circle cx={x + 24} cy="472.5" r="1.3" fill={A} className="blink" style={{ animationDelay: `${i * 0.4}s` }} />
                  <path d={`M${x + 1} 352V480`} stroke="#fff" strokeOpacity=".14" />
                </g>
              ))}
              <text x="648" y="330" {...mono}>STORAGE</text>
            </g>

            {/* 02 COMPUTE — GPU package: substrate, contacts, two HBM stacks a side, die */}
            <g style={{ opacity: op(1), transition: "opacity 1.2s ease" }}>
              <text x="990" y="70" {...mono} fontSize="12" letterSpacing="2">02 · COMPUTE</text>
              <rect x="1150" y="176" width="400" height="336" rx="12" fill="#000" opacity=".6" filter="url(#hm-blur14)" />
              <rect x="1150" y="168" width="400" height="340" rx="10" fill="url(#hm-pcb)" />
              <rect x="1150" y="168" width="400" height="340" rx="10" fill="url(#hm-trace)" />
              <rect x="1150" y="168" width="400" height="340" rx="10" fill="none" stroke="#4a443c" />
              {Array.from({ length: 26 }, (_, i) => <rect key={i} x={1162 + i * 14.6} y="500" width="8" height="12" rx="1" fill="url(#hm-gold)" />)}
              {art.caps.map((c, i) => <rect key={i} x={c.x} y={c.y} width="10" height="5" rx="1" fill={i % 3 ? "#8b7a5d" : "#c9c1b2"} />)}
              <rect x="1172" y="226" width="356" height="232" rx="4" fill="#2c2823" stroke="#3f3933" />
              {[[1180, 236], [1180, 348], [1462, 236], [1462, 348]].map(([x, y], i) => (
                <g key={i}>
                  <rect x={x} y={y} width="58" height="100" rx="2" fill="url(#hm-hbm)" />
                  <path d={`M${x + 4} ${y + 6}H${x + 54}`} stroke="#fff" strokeOpacity=".4" />
                  <text x={x + 29} y={y + 54} textAnchor="middle" fontFamily="var(--font-geist-mono)" fontSize="8" letterSpacing="1" fill="#3a3631">HBM</text>
                </g>
              ))}
              <rect x="1250" y="240" width="200" height="200" rx="3" fill="url(#hm-die)" stroke="#55505a" strokeWidth=".8" />
              {art.cores.map((k, i) => (
                <g key={i}>
                  <rect x={k.x} y={k.y} width="17" height="17" rx="1.5" fill="#25222a" />
                  <rect x={k.x} y={k.y} width="17" height="17" rx="1.5" fill={k.f} className="hm-core" style={{ animationDelay: `${k.d}s` }} />
                </g>
              ))}
              <rect x="1250" y="240" width="200" height="200" rx="3" fill="url(#hm-diesheen)" />
              <text x="1150" y="540" {...mono}>GPU · TRAIN + SERVE</text>
            </g>

            {/* 03 LINK — your Node with its dish, a relay satellite, two peer Nodes on fiber */}
            <g style={{ opacity: op(2), transition: "opacity 1.2s ease" }}>
              <text x="1890" y="70" {...mono} fontSize="12" letterSpacing="2">03 · LINK</text>
              <path d="M1880 300Q2250 20 2680 250" fill="none" stroke="#EDE6DA" strokeOpacity=".22" strokeDasharray="2 7" />
              <MiniNode x={2112} y={466} s={0.9} lit />
              <rect x="2123" y="400" width="5" height="58" fill="url(#hm-mast)" />
              <g transform="translate(2130 398) rotate(-32)">
                <ellipse rx="34" ry="12" fill="url(#hm-dish)" stroke="#8d877d" strokeWidth=".8" />
                <ellipse rx="22" ry="7.5" fill="none" stroke="#bdb6ab" strokeWidth=".8" />
                <path d="M0 0L6 -30" stroke="#6f6a63" strokeWidth="1.6" />
                <circle cx="6" cy="-32" r="3.2" fill={A} />
              </g>
              <g fill="none" strokeLinecap="round" strokeDasharray="4 18">
                <path className="flow" d="M2140 366L2290 186" stroke={A} strokeWidth="3" />
                <path className="flow" d="M2318 186L2530 420" stroke="#D9A55B" strokeWidth="3" style={{ animationDelay: "-.5s" }} />
              </g>
              <Satellite x={2306} y={158} s={0.62} />
              <MiniNode x={2540} y={470} s={0.62} />
              <MiniNode x={2640} y={484} s={0.5} />
              <path d="M2190 512C2300 514 2420 510 2530 500L2620 506" fill="none" stroke="#3a342e" strokeWidth="5" strokeLinecap="round" />
              <path d="M2190 512C2300 514 2420 510 2530 500L2620 506" fill="none" stroke="#EDE6DA" strokeOpacity=".7" strokeWidth="1.4" strokeDasharray="1 7" className="flow" />
              <g {...mono}><text x="2350" y="118">LOW-ORBIT RELAY</text><text x="2050" y="560">YOUR NODE</text><text x="2510" y="560">OTHER NODES</text><text x="2360" y="534" fontSize="9">FIBER</text></g>
            </g>

            {/* 04 INTELLIGENCE — the network etched into a glass layer */}
            <g style={{ opacity: op(3), transition: "opacity 1.2s ease" }}>
              <text x="2790" y="70" {...mono} fontSize="12" letterSpacing="2">04 · INTELLIGENCE</text>
              <rect x="2900" y="166" width="500" height="352" rx="8" fill="#000" opacity=".5" filter="url(#hm-blur14)" />
              <rect x="2900" y="150" width="500" height="352" rx="8" fill="#1a1714" />
              <rect x="2900" y="150" width="500" height="352" rx="8" fill="url(#hm-slab)" stroke={A} strokeOpacity=".55" />
              <rect x="2912" y="162" width="476" height="328" rx="5" fill="none" stroke={A} strokeOpacity=".18" />
              <path d="M2900 160Q2900 150 2910 150H3200L2900 330Z" fill="#fff" opacity=".05" />
              <g stroke="#ffc59a" strokeWidth="1" filter="url(#hm-glow)">
                {art.edges.map((e, i) => <path key={i} d={e.d} className="hm-edge" style={{ animationDelay: `${e.t}s` }} />)}
              </g>
              {art.nodes.map((n, i) => (
                <g key={i}>
                  <circle cx={n.x} cy={n.y} r="9" fill="#171512" stroke="#EDE6DA" strokeOpacity=".8" />
                  <circle cx={n.x} cy={n.y} r="5" fill={A} className="hm-core" style={{ animationDelay: `${n.t}s` }} filter="url(#hm-glow)" />
                </g>
              ))}
              <text x="2960" y="540" {...mono}>CONTINUAL LEARNING · ON NODE</text>
            </g>

            {/* 05 TASTE — three drafts marked keep, revise, reject, shaping a taste profile */}
            <g style={{ opacity: op(4), transition: "opacity 1.2s ease" }}>
              <text x="3690" y="70" {...mono} fontSize="12" letterSpacing="2">05 · TASTE</text>
              {[[214, -1.2], [298, 0.6], [382, -0.4]].map(([y, rot], i) => (
                <g key={i} transform={`rotate(${rot} 3780 ${y + 32})`} filter="url(#hm-drop)">
                  <rect x="3700" y={y} width="160" height="64" rx="3" fill="url(#hm-paper)" />
                  <path d={`M3716 ${y + 20}H${3716 + 84 - i * 6}M3716 ${y + 34}H${3716 + 64 + i * 8}M3716 ${y + 48}H${3716 + 40 + i * 10}`} stroke="#4a443c" strokeOpacity=".45" strokeWidth="3" strokeLinecap="round" />
                </g>
              ))}
              <circle cx="4150" cy="320" r="150" fill="none" stroke="#EDE6DA" strokeOpacity=".12" />
              <circle cx="4150" cy="320" r="90" fill="none" stroke="#EDE6DA" strokeOpacity=".35" strokeDasharray="3 6" />
              <path d="M4150 170L4280 245L4280 395L4150 470L4020 395L4020 245Z" fill="none" stroke="#EDE6DA" strokeOpacity=".22" strokeDasharray="4 5" />
              <g stroke="#EDE6DA" strokeOpacity=".14"><path d="M4150 320V170M4150 320L4280 245M4150 320L4280 395M4150 320V470M4150 320L4020 395M4150 320L4020 245" /></g>
              <g {...mono} textAnchor="middle"><text x="4150" y="156">RIGOR</text><text x="4300" y="240">BREVITY</text><text x="4300" y="412">RISK</text><text x="4150" y="494">TONE</text><text x="4000" y="412">NOVELTY</text><text x="4000" y="240">DEPTH</text></g>
              <text x="4062" y="560" {...mono}>- - BASE MODEL     ━ YOURS</text>
              {ch === 4 && (
                <g key="taste-on">
                  <g className="hm-in" style={{ animationDelay: ".3s" }}><circle cx="3836" cy="246" r="14" fill="#D9A55B" /><path d="M3829 246L3834 251L3843 240" fill="none" stroke="#171512" strokeWidth="2.4" /></g>
                  <g className="hm-in" style={{ animationDelay: "1s" }}><circle cx="3836" cy="330" r="14" fill="#EDE6DA" /><path d="M3830 336L3832 330L3841 321L3845 325L3836 334Z" fill="#171512" /></g>
                  <g className="hm-in" style={{ animationDelay: "1.7s" }}><circle cx="3836" cy="414" r="14" fill={A} /><path d="M3830 408L3842 420M3842 408L3830 420" stroke="#171512" strokeWidth="2.4" /></g>
                  <g fill="none" stroke="#EDE6DA" strokeOpacity=".35">
                    <path className="hm-draw" pathLength={100} d="M3860 246C3940 246 3980 280 4040 300" style={{ animationDelay: ".6s" }} />
                    <path className="hm-draw" pathLength={100} d="M3860 330H4020" style={{ animationDelay: "1.3s" }} />
                    <path className="hm-draw" pathLength={100} d="M3860 414C3940 414 3980 370 4040 345" style={{ animationDelay: "2s" }} />
                  </g>
                  <path className="hm-draw" pathLength={100} d="M4150 190L4210.6 285L4253.9 380L4150 415L4028.8 390L4098 290Z" fill={A} fillOpacity=".14" stroke={A} strokeWidth="2.2" strokeLinejoin="round" style={{ animationDelay: "2.2s" }} filter="url(#hm-glow)" />
                  <g fill={A} className="hm-in" style={{ animationDelay: "3.6s" }}><circle cx="4150" cy="190" r="4" /><circle cx="4210.6" cy="285" r="4" /><circle cx="4253.9" cy="380" r="4" /><circle cx="4150" cy="415" r="4" /><circle cx="4028.8" cy="390" r="4" /><circle cx="4098" cy="290" r="4" /></g>
                </g>
              )}
            </g>
          </g>
        </svg>
      </div>

      {/* captions */}
      <div className="relative min-h-[124px]" aria-live="polite">
        {CHAPTERS.map((c, i) => (
          <div key={c.title} aria-hidden={i !== ch} className="pointer-events-none absolute left-0 top-0 flex max-w-[560px] flex-col gap-2" style={{ opacity: i === ch ? 1 : 0, transform: `translateY(${i === ch ? 0 : 12}px)`, transition: "opacity .8s ease, transform .8s ease" }}>
            <span className="font-mono text-[11px] tracking-[.14em] text-ember">0{i + 1} / 05</span>
            <span className="serif text-[clamp(28px,3vw,40px)] leading-[1.05]">{c.title}</span>
            <span className="text-[15px] leading-[1.5] text-night-mute">{c.line}</span>
          </div>
        ))}
      </div>

      {/* chapter bar */}
      <div className="flex items-stretch gap-3">
        <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"} className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-[#3a352f] text-night-ink hover:border-night-ink">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            {playing ? <><rect x="2" y="1" width="3.5" height="12" fill="currentColor" /><rect x="8.5" y="1" width="3.5" height="12" fill="currentColor" /></> : <path d="M3 1L13 7L3 13Z" fill="currentColor" />}
          </svg>
        </button>
        <div className="grid flex-1 grid-cols-5 gap-3" role="group" aria-label="Chapters">
          {CHAPTERS.map((c, i) => (
            <button key={c.title} type="button" onClick={() => pick(i)} aria-current={i === ch ? "step" : undefined} className={`flex min-h-11 flex-col justify-center gap-2.5 text-left ${i === ch ? "text-night-ink" : "text-[#8a8070] hover:text-night-ink"}`}>
              <span className="relative block h-0.5 overflow-hidden bg-[#3a352f]">
                <span className="absolute inset-0 origin-left bg-[#8a8070]" style={{ transform: `scaleX(${i < ch ? 1 : 0})` }} />
                {i === ch && <span key={`${ch}-${playing}`} className="hm-bar absolute inset-0 origin-left bg-ember" style={{ animationDuration: `${DUR}s`, animationPlayState: playing ? "running" : "paused" }} />}
              </span>
              <span className="hidden text-[13px] sm:block">{c.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
