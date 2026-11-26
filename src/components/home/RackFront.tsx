/* Front elevation of one Matrix compute rack, drawn like a product render:
   powder-coated frame and punched rails, a management switch, two fabric switches,
   six 4U liquid-cooled GPU servers with perforated bezels, two NVMe shelves and the DC power shelf.
   Copper supply and brass return manifolds run down the sides with a quick-connect pair per server. */

const U = 18;
const X0 = 76, W = 288; // equipment opening
const SLOTS: { kind: "mgmt" | "fabric" | "blank" | "gpu" | "nvme" | "cable" | "power"; u: number }[] = [
  { kind: "mgmt", u: 1 }, { kind: "fabric", u: 1 }, { kind: "fabric", u: 1 }, { kind: "blank", u: 1 },
  ...Array.from({ length: 6 }, () => ({ kind: "gpu" as const, u: 4 })),
  { kind: "nvme", u: 2 }, { kind: "nvme", u: 2 }, { kind: "cable", u: 1 }, { kind: "power", u: 2 },
];

function Ears({ y, h, label }: { y: number; h: number; label?: string }) {
  return (
    <g>
      <rect x={X0} y={y} width="16" height={h} fill="url(#rk-ear)" />
      <rect x={X0 + W - 16} y={y} width="16" height={h} fill="url(#rk-ear)" />
      <circle cx={X0 + 8} cy={y + 5} r="2.2" fill="#15130f" stroke="#6a645b" strokeWidth=".6" />
      <circle cx={X0 + W - 8} cy={y + 5} r="2.2" fill="#15130f" stroke="#6a645b" strokeWidth=".6" />
      {h > 30 && (
        <>
          <rect x={X0 + 4} y={y + h / 2 - 12} width="8" height="24" rx="3" fill="none" stroke="#8d867b" strokeWidth="1.6" />
          <rect x={X0 + W - 12} y={y + h / 2 - 12} width="8" height="24" rx="3" fill="none" stroke="#8d867b" strokeWidth="1.6" />
        </>
      )}
      {label && <text x={X0 + 22} y={y + 10} fontFamily="var(--font-geist-mono)" fontSize="6.5" letterSpacing=".8" fill="#9a9184">{label}</text>}
    </g>
  );
}

function Unit({ kind, y, h, i }: { kind: (typeof SLOTS)[number]["kind"]; y: number; h: number; i: number }) {
  const face = <rect x={X0} y={y + 0.5} width={W} height={h - 1} fill="url(#rk-face)" />;
  const edge = <path d={`M${X0} ${y + 0.8}H${X0 + W}`} stroke="#8b847a" strokeOpacity=".55" strokeWidth=".8" />;
  switch (kind) {
    case "mgmt":
      return (
        <g>{face}{edge}<Ears y={y} h={h} />
          {Array.from({ length: 24 }, (_, k) => {
            const col = k % 12, row = Math.floor(k / 12);
            const px = X0 + 30 + col * 15 + (col > 5 ? 8 : 0), py = y + 3.5 + row * 6.2;
            return <g key={k}><rect x={px} y={py} width="10" height="5" fill="#0b0a09" stroke="#55504a" strokeWidth=".4" /><rect x={px + 1} y={py + 0.6} width="2" height="1.2" fill={k % 5 === 0 ? "#d9a55b" : "#3b8f5a"} className="blink" style={{ animationDelay: `${(k * 0.37) % 2.4}s` }} /></g>;
          })}
          <circle cx={X0 + W - 26} cy={y + h / 2} r="1.6" fill="#ede6da" />
        </g>
      );
    case "fabric":
      return (
        <g>{face}{edge}<Ears y={y} h={h} />
          {Array.from({ length: 32 }, (_, k) => {
            const col = k % 16, row = Math.floor(k / 16);
            const px = X0 + 22 + col * 15.4, py = y + 3 + row * 6.4;
            return <g key={k}><rect x={px} y={py} width="12" height="5" rx=".6" fill="url(#rk-cage)" /><rect x={px + 2} y={py + 1.4} width="8" height="2.2" fill="#0d0c0b" /></g>;
          })}
          {Array.from({ length: 16 }, (_, k) => <circle key={k} cx={X0 + 28 + k * 15.4} cy={y + h - 1.6} r=".9" fill={k % 3 ? "#d9a55b" : "#ff6b2c"} className="blink" style={{ animationDelay: `${(k * 0.53 + i) % 2.4}s` }} />)}
        </g>
      );
    case "blank":
      return <g><rect x={X0} y={y + 0.5} width={W} height={h - 1} fill="url(#rk-mesh)" />{edge}<Ears y={y} h={h} /></g>;
    case "gpu": {
      const n = i - 4;
      return (
        <g>
          {face}{edge}
          <rect x={X0 + 20} y={y + 5} width={W - 40} height={h - 18} fill="url(#rk-mesh)" />
          <rect x={X0 + 20} y={y + 5} width={W - 40} height={h - 18} fill="url(#rk-meshshade)" />
          <rect x={X0 + 20} y={y + 5} width={W - 40} height={h - 18} fill="none" stroke="#141210" strokeWidth="1.2" />
          <path d={`M${X0 + 20} ${y + 5.6}H${X0 + W - 20}`} stroke="#a59d91" strokeOpacity=".5" strokeWidth=".7" />
          {/* status strip: power, health, then a live load bar */}
          <rect x={X0 + 20} y={y + h - 11} width={W - 40} height="8" fill="#141210" />
          <circle cx={X0 + 26} cy={y + h - 7} r="1.6" fill="#ede6da" filter="url(#rk-glow)" />
          <circle cx={X0 + 32} cy={y + h - 7} r="1.6" fill="#ff6b2c" filter="url(#rk-glow)" className="blink" style={{ animationDelay: `${n * 0.4}s` }} />
          <rect x={X0 + 40} y={y + h - 8.4} width={W - 110} height="2.8" fill="#2a2622" />
          <rect x={X0 + 40} y={y + h - 8.4} width={W - 110} height="2.8" fill="#ff6b2c" className="rk-load" style={{ animationDuration: `${3.2 + n * 0.7}s`, animationDelay: `${-n * 0.9}s` }} filter="url(#rk-glow)" />
          <text x={X0 + W - 64} y={y + h - 5} fontFamily="var(--font-geist-mono)" fontSize="6" letterSpacing=".8" fill="#9a9184">GPU-0{n}</text>
          <Ears y={y} h={h} />
          {/* quick-connects on the right ear */}
          <circle cx={X0 + W - 8} cy={y + h - 14} r="3" fill="url(#rk-cu)" stroke="#3a2a1c" strokeWidth=".6" />
          <circle cx={X0 + W - 8} cy={y + h - 6} r="3" fill="url(#rk-brass)" stroke="#3a2f1c" strokeWidth=".6" />
        </g>
      );
    }
    case "nvme":
      return (
        <g>{face}{edge}<Ears y={y} h={h} />
          {Array.from({ length: 12 }, (_, k) => {
            const px = X0 + 21 + k * 20.5;
            return (
              <g key={k}>
                <rect x={px} y={y + 3} width="18" height={h - 6} rx="1" fill="url(#rk-sled)" stroke="#16140f" strokeWidth=".6" />
                <rect x={px + 2} y={y + 5} width="14" height={h - 16} fill="url(#rk-mesh)" opacity=".9" />
                <rect x={px + 2} y={y + h - 9} width="9" height="3" rx="1" fill="#1a1815" />
                <circle cx={px + 14} cy={y + h - 7.5} r="1" fill={k % 4 === 1 ? "#ff6b2c" : "#d9a55b"} className="blink" style={{ animationDelay: `${(k * 0.29 + i * 0.5) % 2.4}s` }} />
              </g>
            );
          })}
        </g>
      );
    case "cable":
      return (
        <g>
          <rect x={X0} y={y + 0.5} width={W} height={h - 1} fill="#141210" />
          <rect x={X0 + 18} y={y + h / 2 - 2} width={W - 36} height="4" fill="#0a0908" />
          {Array.from({ length: 40 }, (_, k) => <path key={k} d={`M${X0 + 20 + k * 6.2} ${y + h / 2 - 2}v4`} stroke="#2d2924" strokeWidth="1.4" />)}
          <Ears y={y} h={h} />
        </g>
      );
    case "power":
      return (
        <g>{face}{edge}<Ears y={y} h={h} />
          <rect x={X0 + 22} y={y + 7} width={W - 92} height="10" rx="1.5" fill="url(#rk-bus)" />
          <path d={`M${X0 + 22} ${y + 8}H${X0 + W - 70}`} stroke="#ffd9b3" strokeOpacity=".6" strokeWidth=".8" />
          {Array.from({ length: 9 }, (_, k) => <circle key={k} cx={X0 + 34 + k * 22} cy={y + 12} r="1.8" fill="#5a3a22" stroke="#e8b78c" strokeWidth=".5" />)}
          <rect x={X0 + W - 62} y={y + 6} width="40" height="13" fill="#0d0c0b" stroke="#55504a" strokeWidth=".5" />
          <text x={X0 + W - 58} y={y + 15} fontFamily="var(--font-geist-mono)" fontSize="7" fill="#ff6b2c">48V DC</text>
          <rect x={X0 + 22} y={y + 22} width={W - 44} height="8" fill="url(#rk-mesh)" />
        </g>
      );
  }
}

export default function RackFront({ className }: { className?: string }) {
  const tops = SLOTS.reduce<number[]>((acc, s, i) => [...acc, i ? acc[i - 1] + SLOTS[i - 1].u * U : 58], []);
  const units = SLOTS.map((s, i) => ({ el: <Unit key={i} kind={s.kind} y={tops[i]} h={s.u * U} i={i} />, y: tops[i], h: s.u * U, kind: s.kind }));
  const bottom = tops[tops.length - 1] + SLOTS[SLOTS.length - 1].u * U;
  const gpus = units.filter((u) => u.kind === "gpu");

  return (
    <svg viewBox="0 0 440 760" className={className} style={{ display: "block", width: "100%", height: "auto" }} role="img" aria-label="Front of a Matrix compute rack: a management switch, two fabric switches, six liquid-cooled GPU servers with live load bars, two NVMe storage shelves and a 48-volt DC power shelf, with copper supply and brass return coolant manifolds down either side.">
      <defs>
        <linearGradient id="rk-frame" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1a1815" /><stop offset=".06" stopColor="#3c3731" /><stop offset=".12" stopColor="#23201c" /><stop offset=".88" stopColor="#23201c" /><stop offset=".94" stopColor="#36312b" /><stop offset="1" stopColor="#161411" /></linearGradient>
        <linearGradient id="rk-face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4d4842" /><stop offset=".5" stopColor="#38342f" /><stop offset="1" stopColor="#2a2723" /></linearGradient>
        <linearGradient id="rk-ear" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#5a544c" /><stop offset=".5" stopColor="#3b3731" /><stop offset="1" stopColor="#2a2723" /></linearGradient>
        <linearGradient id="rk-cage" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d9d4cb" /><stop offset=".5" stopColor="#8e877c" /><stop offset="1" stopColor="#5d574f" /></linearGradient>
        <linearGradient id="rk-sled" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#4a4540" /><stop offset=".5" stopColor="#3a3631" /><stop offset="1" stopColor="#2b2824" /></linearGradient>
        <linearGradient id="rk-bus" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f0b182" /><stop offset=".45" stopColor="#c77a45" /><stop offset="1" stopColor="#7d4522" /></linearGradient>
        <linearGradient id="rk-meshshade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".35" /></linearGradient>
        <linearGradient id="rk-pipe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#5e2c12" /><stop offset=".35" stopColor="#e0814a" /><stop offset=".55" stopColor="#ffc59a" /><stop offset="1" stopColor="#6e3416" /></linearGradient>
        <linearGradient id="rk-pipe2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#4d3a1c" /><stop offset=".35" stopColor="#c99a52" /><stop offset=".55" stopColor="#f3d79e" /><stop offset="1" stopColor="#5a4320" /></linearGradient>
        <radialGradient id="rk-cu" cx=".35" cy=".35" r=".7"><stop offset="0" stopColor="#ffd2ad" /><stop offset="1" stopColor="#a4582a" /></radialGradient>
        <radialGradient id="rk-brass" cx=".35" cy=".35" r=".7"><stop offset="0" stopColor="#fbe7b8" /><stop offset="1" stopColor="#9c7a3a" /></radialGradient>
        <linearGradient id="rk-light" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".09" /><stop offset=".4" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".25" /></linearGradient>
        <pattern id="rk-mesh" width="5" height="4.33" patternUnits="userSpaceOnUse">
          <rect width="5" height="4.33" fill="#3d3934" />
          <circle cx="1.25" cy="1.08" r="1.05" fill="#0b0a09" /><circle cx="3.75" cy="3.25" r="1.05" fill="#0b0a09" />
        </pattern>
        <pattern id="rk-rail" width="14" height={U / 3} patternUnits="userSpaceOnUse" y="58">
          <rect width="14" height={U / 3} fill="#2c2924" />
          <rect x="4.5" y="1.3" width="4.4" height="3.4" fill="#0c0b0a" />
        </pattern>
        <filter id="rk-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="1.4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="rk-shadow" x="-30%" y="-50%" width="160%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>

      <ellipse cx="220" cy="742" rx="200" ry="16" fill="#000" opacity=".55" filter="url(#rk-shadow)" />
      {/* frame */}
      <rect x="44" y="26" width="352" height={bottom - 26 + 34} rx="5" fill="url(#rk-frame)" />
      <rect x="50" y="34" width="340" height="16" fill="#141210" />
      <rect x="50" y={bottom + 6} width="340" height="20" fill="#141210" />
      {[0, 1, 2, 3].map((k) => <rect key={k} x={96 + k * 66} y={bottom + 12} width="44" height="8" fill="url(#rk-mesh)" />)}
      <rect x="62" y="54" width="14" height={bottom - 50} fill="url(#rk-rail)" />
      <rect x="364" y="54" width="14" height={bottom - 50} fill="url(#rk-rail)" />
      <rect x={X0} y="58" width={W} height={bottom - 58} fill="#0c0b09" />
      {units.map((u) => u.el)}
      {/* coolant manifolds and a hose pair per server */}
      <rect x="22" y="40" width="11" height={bottom - 20} rx="5.5" fill="url(#rk-pipe)" />
      <rect x="407" y="40" width="11" height={bottom - 20} rx="5.5" fill="url(#rk-pipe2)" />
      {gpus.map((g, k) => (
        <g key={k} fill="none" strokeLinecap="round">
          <path d={`M33 ${g.y + 20} C 52 ${g.y + 20} 48 ${g.y + g.h - 14} ${X0 + 4} ${g.y + g.h - 14}`} stroke="#14110e" strokeWidth="4.6" />
          <path d={`M33 ${g.y + 20} C 52 ${g.y + 20} 48 ${g.y + g.h - 14} ${X0 + 4} ${g.y + g.h - 14}`} stroke="#d1743f" strokeWidth="2" strokeOpacity=".85" />
          <path d={`M407 ${g.y + 30} C 392 ${g.y + 30} 396 ${g.y + g.h - 6} ${X0 + W - 5} ${g.y + g.h - 6}`} stroke="#14110e" strokeWidth="4.6" />
          <path d={`M407 ${g.y + 30} C 392 ${g.y + 30} 396 ${g.y + g.h - 6} ${X0 + W - 5} ${g.y + g.h - 6}`} stroke="#c89c56" strokeWidth="2" strokeOpacity=".85" />
        </g>
      ))}
      {[...Array(6)].map((_, k) => <rect key={k} x="20" y={60 + k * 110} width="15" height="6" rx="1.5" fill="#2a2622" />)}
      {[...Array(6)].map((_, k) => <rect key={k} x="405" y={70 + k * 110} width="15" height="6" rx="1.5" fill="#2a2622" />)}
      <rect x="44" y="26" width="352" height={bottom + 8} rx="5" fill="url(#rk-light)" pointerEvents="none" />
    </svg>
  );
}
