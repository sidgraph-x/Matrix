"use client";

import { useEffect, useState } from "react";

/* A simulated live readout from one Node. Values are generated, and the panel says so. */
const f = (i: number) => 40 + 6 * Math.sin(i / 3) + 3 * Math.sin(i / 1.7);

export default function Telemetry({ className = "" }: { className?: string }) {
  const [t, setT] = useState(40);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const iv = setInterval(() => setT((v) => v + 1), 1200);
    return () => clearInterval(iv);
  }, []);

  const pts = Array.from({ length: 30 }, (_, k) => [k * (300 / 29), 56 - ((f(t - 29 + k) - 28) / 24) * 56]);
  const line = pts.map((p, k) => `${k ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("");
  const draw = f(t);
  const soc = Math.round(64 + 22 * Math.sin(t / 14));
  const lit = Math.round((soc / 100) * 24);
  const sec = Math.floor(t * 1.2);
  const clock = [Math.floor(sec / 3600), Math.floor(sec / 60) % 60, sec % 60].map((n) => String(n).padStart(2, "0")).join(":");
  const cells: [string, string][] = [
    ["Solar in", `${Math.max(0, 62 + 18 * Math.sin(t / 9)).toFixed(1)} kW`],
    ["GPU load", `${Math.round(78 + 9 * Math.sin(t / 4))} %`],
    ["Uplink", `LEO · ${Math.round(180 + 40 * Math.sin(t / 5))} Mb/s`],
    ["Coolant", `${(31 + 1.5 * Math.sin(t / 6)).toFixed(1)} °C`],
  ];

  return (
    <figure className={`m-0 flex flex-col rounded-[6px] border border-night-rule bg-[#1a1714] text-night-ink shadow-[0_30px_60px_-30px_rgba(0,0,0,.6)] ${className}`}>
      <div className="label flex items-center justify-between border-b border-night-rule px-5 py-4 !text-[10px] text-[#a39888]">
        <span className="flex items-center gap-2"><span className="blink h-1.5 w-1.5 rounded-full bg-ember" />MX-01 telemetry</span>
        <span className="flex items-center gap-2.5 tabular-nums"><span>T+{clock}</span><span className="border border-[#3d352e] px-1.5 py-0.5 text-brass">Simulated</span></span>
      </div>
      <div className="flex flex-col gap-[18px] p-5">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="label !text-[10px] text-[#8c8173]">Compute draw</span>
            <span className="text-[44px] font-light leading-none tracking-[-0.04em] tabular-nums">{draw.toFixed(1)}<span className="text-[16px] text-[#8c8173]"> kW</span></span>
          </div>
          <span className="label !text-[10px] text-ember">{draw > f(t - 1) ? "Rising" : "Easing"}</span>
        </div>
        <svg viewBox="0 0 300 56" preserveAspectRatio="none" className="block h-14 w-full" aria-hidden="true">
          <path d="M0 28H300" stroke="#2e2924" strokeDasharray="2 4" />
          <path d={`${line}L300 56L0 56Z`} fill="#ff6b2c" fillOpacity=".12" />
          <path d={line} fill="none" stroke="#ff6b2c" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="flex flex-col gap-1.5">
          <div className="label flex justify-between !text-[10px] text-[#8c8173]"><span>Battery</span><span className="text-night-ink tabular-nums">{soc}%</span></div>
          <div className="flex gap-[3px]" aria-hidden="true">
            {Array.from({ length: 24 }, (_, i) => <span key={i} className="h-3.5 flex-1" style={{ background: i < lit ? (i < 5 ? "#ff6b2c" : "#d9a55b") : "#2e2924" }} />)}
          </div>
        </div>
        <dl className="m-0 grid grid-cols-2 gap-px border border-night-rule bg-night-rule">
          {cells.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1.5 bg-[#1a1714] p-3">
              <dt className="label !text-[10px] text-[#8c8173]">{k}</dt>
              <dd className="m-0 font-mono text-[13px] tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="label flex justify-between border-t border-night-rule pt-3 !text-[10px] text-[#8c8173]">
          <span>Adapter r.{1000 + Math.floor(t / 5)}</span><span className="text-brass">Weights on node</span>
        </div>
      </div>
    </figure>
  );
}
