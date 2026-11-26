"use client";

/* Three Nodes on the night side of the Earth, linked to a relay satellite in low orbit.
   Stars, the planet and the satellite sit on separate parallax planes. */
import { useMemo } from "react";
import { Layer, Scene } from "./parallax";

const VB = "0 0 1200 700";
const CX = 600, CY = 1700, R = 1320; // planet: the limb crests at y = 380
const limbY = (x: number) => CY - Math.sqrt(Math.max(0, R * R - (x - CX) ** 2));
const svgProps = { viewBox: VB, preserveAspectRatio: "xMidYMid slice", className: "absolute inset-0 h-full w-full", style: { overflow: "visible" as const }, "aria-hidden": true };

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}
const gauss = (r: () => number) => (r() + r() + r() - 1.5) / 1.5;

const NODES = [
  { id: "A", x: 330, d: 70, label: "Node A", sub: "Fiber and orbit" },
  { id: "B", x: 610, d: 34, label: "Node B", sub: "Fiber and orbit" },
  { id: "C", x: 930, d: 110, label: "Node C", sub: "Remote, orbit only" },
];
const SAT = { x: 760, y: 170 };

export default function OrbitView() {
  const { stars, cities } = useMemo(() => {
    const r = rng(42);
    const stars = Array.from({ length: 220 }, () => [r() * 1400 - 100, r() * 440 - 60, r() * 1 + 0.25, r() * 0.7 + 0.15] as const);
    const centers = Array.from({ length: 26 }, () => [r() * 1300 - 50, 8 + r() * 300, 10 + r() * 50] as const);
    const cities: [number, number, number, number][] = [];
    centers.forEach(([cx, depth, n]) => {
      for (let k = 0; k < n; k++) {
        const x = cx + gauss(r) * 40;
        const d = Math.max(3, depth + gauss(r) * 30 * (0.3 + depth / 300));
        cities.push([x, limbY(x) + d * (0.35 + d / 520), r() * 0.9 + 0.35, r() * 0.6 + 0.35]);
      }
    });
    NODES.forEach((n) => { for (let k = 0; k < 40; k++) { const x = n.x + gauss(r) * 26; cities.push([x, limbY(x) + n.d * (0.35 + n.d / 520) + gauss(r) * 6, r() * 0.9 + 0.3, r() * 0.5 + 0.3]); } });
    return { stars, cities };
  }, []);
  const node = (n: (typeof NODES)[number]) => ({ ...n, y: limbY(n.x) + n.d * (0.35 + n.d / 520) });

  return (
    <Scene className="relative aspect-[12/7] min-h-[380px] w-full overflow-hidden rounded-[6px] bg-[#05070b]">
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <radialGradient id="ov-planet" cx={CX} cy={CY - R * 0.92} r={R * 0.9} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#13263d" /><stop offset=".55" stopColor="#0a1626" /><stop offset="1" stopColor="#050b14" />
          </radialGradient>
          <radialGradient id="ov-dawn" cx="1120" cy={limbY(1120)} r="420" gradientUnits="userSpaceOnUse" gradientTransform={`translate(1120 ${limbY(1120)}) scale(1 .22) translate(-1120 ${-limbY(1120)})`}>
            <stop offset="0" stopColor="#fff0cf" stopOpacity=".95" /><stop offset=".18" stopColor="#ffb36b" stopOpacity=".7" /><stop offset=".55" stopColor="#d0643a" stopOpacity=".22" /><stop offset="1" stopColor="#d0643a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ov-foil" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6d5221" /><stop offset=".22" stopColor="#e9c97c" /><stop offset=".4" stopColor="#9c7735" /><stop offset=".62" stopColor="#f4dea2" /><stop offset=".8" stopColor="#8a6a2c" /><stop offset="1" stopColor="#5e451b" />
          </linearGradient>
          <linearGradient id="ov-foiltop" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f7e6b8" /><stop offset="1" stopColor="#b8913f" /></linearGradient>
          <linearGradient id="ov-cell" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2b4468" /><stop offset=".5" stopColor="#14233a" /><stop offset="1" stopColor="#0a1220" /></linearGradient>
          <linearGradient id="ov-sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".55" stopColor="#ffd9b0" stopOpacity=".28" /><stop offset=".7" stopColor="#fff" stopOpacity="0" /></linearGradient>
          <pattern id="ov-grid" width="12" height="11" patternUnits="userSpaceOnUse"><path d="M12 0V11M0 11H12" stroke="#5f7da6" strokeOpacity=".55" strokeWidth=".7" /></pattern>
          <radialGradient id="ov-dish" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#9aa0a6" /></radialGradient>
          <clipPath id="ov-clip"><circle cx={CX} cy={CY} r={R} /></clipPath>
          <filter id="ov-b1" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.6" /></filter>
          <filter id="ov-b2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="9" /></filter>
          <filter id="ov-b3" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="26" /></filter>
          <filter id="ov-lights" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
      </svg>

      <Layer depth={18} className="absolute inset-0">
        <svg {...svgProps}>
          {stars.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} fill="#eef2ff" opacity={o} />)}
        </svg>
      </Layer>

      <Layer depth={56} className="absolute inset-0">
        <svg {...svgProps}>
          {/* atmosphere, outermost first */}
          <circle cx={CX} cy={CY} r={R + 26} fill="none" stroke="#1f4f8a" strokeWidth="46" strokeOpacity=".22" filter="url(#ov-b3)" />
          <circle cx={CX} cy={CY} r={R + 8} fill="none" stroke="#3c8ad6" strokeWidth="14" strokeOpacity=".4" filter="url(#ov-b2)" />
          <circle cx={CX} cy={CY} r={R} fill="url(#ov-planet)" />
          <g clipPath="url(#ov-clip)">
            <ellipse cx="300" cy="520" rx="260" ry="40" fill="#2b3f58" opacity=".35" filter="url(#ov-b2)" />
            <ellipse cx="820" cy="470" rx="320" ry="28" fill="#2b3f58" opacity=".3" filter="url(#ov-b2)" />
            <ellipse cx="1000" cy="600" rx="220" ry="50" fill="#26384f" opacity=".3" filter="url(#ov-b2)" />
            <g filter="url(#ov-lights)">
              {cities.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} fill={i % 7 ? "#ffc27a" : "#ffe6bd"} opacity={o} />)}
            </g>
            <rect x="-200" y="200" width="1600" height="700" fill="url(#ov-dawn)" />
          </g>
          <circle cx={CX} cy={CY} r={R + 1.5} fill="none" stroke="#9fd3ff" strokeWidth="2.4" strokeOpacity=".7" filter="url(#ov-b1)" />
          <path d={`M880 ${limbY(880)} A ${R} ${R} 0 0 1 1300 ${limbY(1300)}`} fill="none" stroke="#ffd6a0" strokeWidth="2.6" strokeOpacity=".85" filter="url(#ov-b1)" />
          {/* fiber between A and B, along the surface */}
          <path d={`M${node(NODES[0]).x} ${node(NODES[0]).y} Q ${(node(NODES[0]).x + node(NODES[1]).x) / 2} ${Math.min(node(NODES[0]).y, node(NODES[1]).y) - 18} ${node(NODES[1]).x} ${node(NODES[1]).y}`} fill="none" stroke="#ede6da" strokeOpacity=".7" strokeWidth="1.4" strokeDasharray="1 5" className="flow" />
          {NODES.map((n0) => {
            const n = node(n0);
            return (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r="10" fill="none" stroke="#ff6b2c" strokeWidth="1.2" className="ping" style={{ animationDelay: `${n.d / 60}s` }} />
                <circle cx={n.x} cy={n.y} r="3.2" fill="#ff6b2c" />
                <circle cx={n.x} cy={n.y} r="7" fill="#ff6b2c" opacity=".25" filter="url(#ov-b1)" />
                <text x={n.x + 14} y={n.y + 22} fontFamily="var(--font-geist-mono)" fontSize="12" letterSpacing="1" fill="#ede6da">{n.label}</text>
                <text x={n.x + 14} y={n.y + 38} fontFamily="var(--font-geist-mono)" fontSize="11" letterSpacing=".6" fill="#8c95a3">{n.sub}</text>
              </g>
            );
          })}
        </svg>
      </Layer>

      <Layer depth={150} x={-30} className="absolute inset-0">
        <svg {...svgProps}>
          {NODES.map((n0) => {
            const n = node(n0);
            return <path key={n.id} d={`M${SAT.x} ${SAT.y + 30}L${n.x} ${n.y}`} stroke="#ff6b2c" strokeOpacity=".75" strokeWidth="1.2" strokeDasharray="3 11" className="beam" />;
          })}
          <g transform={`translate(${SAT.x} ${SAT.y}) rotate(-9)`}>
            {/* booms */}
            <path d="M-34 0H-56M34 0H56" stroke="#b7bcc2" strokeWidth="2.2" />
            {/* solar wings */}
            {[-1, 1].map((s) => (
              <g key={s} transform={`translate(${s === -1 ? -238 : 56} -27)`}>
                <rect width="182" height="54" fill="url(#ov-cell)" />
                <rect width="182" height="54" fill="url(#ov-grid)" />
                <rect width="182" height="54" fill="url(#ov-sheen)" />
                <path d="M60.7 0V54M121.3 0V54" stroke="#aab3bd" strokeWidth="1.6" />
                <rect width="182" height="54" fill="none" stroke="#c3c9cf" strokeWidth="1.6" />
              </g>
            ))}
            {/* bus wrapped in gold foil */}
            <path d="M-34 -30L-22 -40H40L28 -30Z" fill="url(#ov-foiltop)" />
            <path d="M28 -30L40 -40V22L28 32Z" fill="#6a4f20" />
            <rect x="-34" y="-30" width="62" height="62" fill="url(#ov-foil)" />
            <path d="M-30 -22L-12 -8L4 -20L22 -4M-28 6L-8 14L8 2L24 18M-20 26L0 18L18 28" fill="none" stroke="#fff2cc" strokeOpacity=".35" strokeWidth=".8" />
            <path d="M-26 -12L-6 0L12 -12M-30 18L-12 6L10 22" fill="none" stroke="#3d2c10" strokeOpacity=".4" strokeWidth=".8" />
            <rect x="-20" y="-18" width="16" height="10" fill="#1b1d22" stroke="#9aa0a6" strokeWidth=".6" />
            {/* nadir antenna facing the planet */}
            <path d="M-3 32V42" stroke="#b7bcc2" strokeWidth="2" />
            <ellipse cx="-3" cy="47" rx="18" ry="6" fill="url(#ov-dish)" />
            <circle cx="-3" cy="47" r="2" fill="#ff6b2c" className="blink" />
          </g>
          <g transform={`translate(${SAT.x + 70} ${SAT.y - 92})`}>
            <rect width="150" height="44" rx="3" fill="#0b0d12" fillOpacity=".85" stroke="#2a313d" />
            <text x="12" y="18" fontFamily="var(--font-geist-mono)" fontSize="11" letterSpacing="1.2" fill="#ff6b2c">RELAY-01</text>
            <text x="12" y="33" fontFamily="var(--font-geist-mono)" fontSize="11" letterSpacing=".6" fill="#a7afbb">Low orbit · 3 links</text>
          </g>
        </svg>
      </Layer>
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 100% at 50% 30%, transparent 60%, rgba(0,0,0,.45))" }} />
    </Scene>
  );
}
