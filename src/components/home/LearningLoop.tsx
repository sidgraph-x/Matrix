"use client";

import { useEffect, useRef, useState } from "react";

const A = "#FF6B2C";
const STAGES = [
  { label: "Interact", body: "Every conversation, document and action becomes a learning signal." },
  { label: "Remember", body: "Signals land in a personal memory that lives on your Node." },
  { label: "Consolidate", body: "Memory is distilled into durable knowledge during surplus-energy windows." },
  { label: "Adapt", body: "Small adapters update the model. The weights never leave the Node." },
];
const ARCS = ["M139.8 139.8A170 170 0 0 1 380.2 139.8", "M380.2 139.8A170 170 0 0 1 380.2 380.2", "M380.2 380.2A170 170 0 0 1 139.8 380.2", "M139.8 380.2A170 170 0 0 1 139.8 139.8"];
const DOTS: [number, number][] = [[260, 90], [430, 260], [260, 430], [90, 260]];
const fr = (v: number) => v - Math.floor(v);

/* The continual-learning cycle. It advances on its own until someone picks a stage. */
export default function LearningLoop() {
  const [st, setSt] = useState(0);
  const iv = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    iv.current = setInterval(() => setSt((s) => (s + 1) % 4), 2800);
    return () => { if (iv.current) clearInterval(iv.current); };
  }, []);
  const pick = (i: number) => { if (iv.current) clearInterval(iv.current); setSt(i); };

  return (
    <figure className="m-0 flex flex-col gap-4 rounded-[8px] border border-[#d3cabc] bg-clay p-6 text-ink">
      <div className="label flex justify-between gap-3 !text-[10px] text-[#5e554b]">
        <span>Continual learning loop</span>
        <span className="text-ember-deep">Stage {st + 1} of 4</span>
      </div>
      <svg viewBox="0 0 520 520" className="block h-auto w-full" role="img" aria-label="Continual learning loop with four stages, interact, remember, consolidate and adapt, circling a personal model whose weights stay on the Node.">
        <circle cx="260" cy="260" r="232" fill="none" stroke="#c9bfaf" strokeWidth="10" strokeDasharray="1 11.14" />
        <circle cx="260" cy="260" r="204" fill="none" stroke="#1a1714" strokeOpacity=".25" strokeDasharray="40 14" className="ef-ring" style={{ animationDuration: "40s" }} />
        <circle cx="260" cy="260" r="170" fill="none" stroke="#1a1714" strokeOpacity=".5" />
        <g fill="none" stroke={A} strokeWidth="5" strokeLinecap="round">
          {ARCS.map((d, i) => <path key={i} d={d} style={{ opacity: i === st ? 1 : 0, transition: "opacity .7s ease" }} />)}
        </g>
        <g stroke="#e6dfd3" strokeWidth="3">
          {DOTS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="9" fill={i === st ? A : "#1a1714"} style={{ transition: "fill .5s" }} />)}
        </g>
        <g fontFamily="var(--font-geist-mono)" fontSize="11" letterSpacing="1.6" fill="#1a1714">
          <text x="260" y="66" textAnchor="middle">01 INTERACT</text>
          <text x="452" y="264">02</text><text x="452" y="280" fontSize="9" fill="#5e554b">REMEMBER</text>
          <text x="260" y="462" textAnchor="middle">03 CONSOLIDATE</text>
          <text x="68" y="264" textAnchor="end">04</text><text x="68" y="280" textAnchor="end" fontSize="9" fill="#5e554b">ADAPT</text>
        </g>
        <circle cx="260" cy="260" r="96" fill="#1a1714" />
        <circle cx="260" cy="260" r="110" fill="none" stroke={A} strokeOpacity=".5" strokeDasharray="2 5" />
        <g transform="translate(211 211)">
          {Array.from({ length: 64 }, (_, i) => {
            const o = Math.round((0.12 + 0.88 * fr(Math.sin(i * 12.9898 + st * 78.233) * 43758.5453)) * 100) / 100;
            return <rect key={i} x={(i % 8) * 13} y={Math.floor(i / 8) * 13} width="6" height="6" fill={o > 0.82 ? A : "#ede6da"} style={{ opacity: o, transition: "opacity .7s ease" }} />;
          })}
        </g>
        <text x="260" y="342" textAnchor="middle" fontFamily="var(--font-geist-mono)" fontSize="9" letterSpacing="1.6" fill="#d9a55b">WEIGHTS ON NODE</text>
      </svg>
      <div className="flex min-h-[72px] flex-col gap-1.5" aria-live="polite">
        <span className="text-[22px] tracking-[-0.02em]">{STAGES[st].label}</span>
        <span className="text-[14px] leading-[1.55] text-[#5e554b]">{STAGES[st].body}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Loop stages">
        {STAGES.map((s, i) => (
          <button key={s.label} type="button" aria-pressed={i === st} onClick={() => pick(i)}
            className={`label min-h-[44px] rounded-[4px] border !text-[10px] transition-colors ${i === st ? "border-ink bg-ink text-night-ink" : "border-[#c9bfaf] text-[#3a332c] hover:border-ink"}`}>
            {s.label}
          </button>
        ))}
      </div>
    </figure>
  );
}
