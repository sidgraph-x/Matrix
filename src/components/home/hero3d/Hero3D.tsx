"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { CHAPTER_SECONDS } from "./clock";
import Readout from "./Readout";
import { CHAPTERS } from "./story";

const Stage = dynamic(() => import("./Stage"), { ssr: false });

const STILLS = ["/hero/ch1.webp", "/hero/ch2.webp", "/hero/ch3.webp", "/hero/ch4.webp", "/hero/ch5.webp"];

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function Hero3D() {
  const [ch, setCh] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [env, setEnv] = useState<{ gl: boolean; reduce: boolean; low: boolean; pin?: number } | null>(null);
  const [visible, setVisible] = useState(true);
  const plate = useRef<HTMLDivElement>(null);

  // client facts: WebGL, reduced motion, small screen; ?ch=N&hold=1 opens a chapter paused (used for review stills)
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = new URLSearchParams(location.search);
    const start = Number(q.get("ch"));
    /* eslint-disable react-hooks/set-state-in-effect -- one-time read of browser-only facts after mount */
    const pinned = q.get("t"); // ?t=seconds pins the chapter clock (review stills only)
    setEnv({ gl: hasWebGL(), reduce, low: innerWidth < 760, pin: pinned !== null && pinned !== "" && Number.isFinite(+pinned) ? +pinned : undefined });
    if (start >= 1 && start <= 5) setCh(start - 1);
    if (reduce || q.get("hold") === "1") setPlaying(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // stop drawing when the plate is offscreen or the tab is hidden
  useEffect(() => {
    const el = plate.current;
    if (!el) return;
    let seen = true, shown = !document.hidden;
    const sync = () => setVisible(seen && shown);
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); });
    io.observe(el);
    const vis = () => { shown = !document.hidden; sync(); };
    document.addEventListener("visibilitychange", vis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", vis); };
  }, []);

  useEffect(() => {
    if (!playing || !visible) return;
    const t = setTimeout(() => setCh((c) => (c + 1) % 5), CHAPTER_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [ch, playing, visible]);

  const c = CHAPTERS[ch];
  const live = env?.gl;

  return (
    <div className="flex flex-col text-night-ink">
      <div
        ref={plate}
        className="relative h-[clamp(360px,38vw,680px)] overflow-hidden"
        role="img"
        aria-label="A 3D sequence in five chapters, following one joule of energy: solar, geothermal, storage and fusion systems; an accelerator package coming apart to its processing array; Earth with a satellite constellation passing encrypted updates between Nodes; a tower of transformer layers with personal adapters; and a person's edits pulling a model's outputs toward their own style."
      >
        {live ? (
          <Stage ch={ch} reduce={env.reduce} low={env.low} running={visible} pin={env.pin} />
        ) : (
          env && (
            // eslint-disable-next-line @next/next/no-img-element -- static stills, sized by the plate
            <img src={STILLS[ch]} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          )
        )}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#171512_0%,transparent_10%,transparent_90%,#171512_100%)]" />
        <div className="absolute right-[clamp(16px,2.4vw,40px)] top-[clamp(16px,2.4vw,40px)] hidden md:block">
          <Readout key={c.id} r={c.readout} />
        </div>
      </div>

      <div className="grid gap-x-16 gap-y-6 border-t border-night-rule px-[clamp(20px,3vw,48px)] pt-7 pb-[clamp(24px,3vw,40px)] lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:items-end">
        <div className="grid" aria-live="polite">
          {CHAPTERS.map((k, i) => (
            <div
              key={k.id}
              aria-hidden={i !== ch}
              className="pointer-events-none flex max-w-[620px] flex-col gap-2 [grid-area:1/1]"
              style={{ opacity: i === ch ? 1 : 0, transform: `translateY(${i === ch ? 0 : 12}px)`, transition: "opacity .8s ease, transform .8s ease" }}
            >
              <span className="font-mono text-[11px] tracking-[.14em] text-ember">0{i + 1} / 05 · {k.name}</span>
              <span className="serif text-[clamp(26px,2.6vw,38px)] leading-[1.08]">{k.claim}</span>
              <span className="text-[15px] leading-[1.55] text-night-mute">{k.line}</span>
              <span className="font-mono text-[11px] text-night-ink md:hidden">{k.stat}</span>
            </div>
          ))}
        </div>

        <div className="flex items-stretch gap-3">
          <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"} className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-[#3a352f] text-night-ink hover:border-night-ink">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              {playing ? <><rect x="2" y="1" width="3.5" height="12" fill="currentColor" /><rect x="8.5" y="1" width="3.5" height="12" fill="currentColor" /></> : <path d="M3 1L13 7L3 13Z" fill="currentColor" />}
            </svg>
          </button>
          <div className="grid flex-1 grid-cols-5 gap-3" role="group" aria-label="Chapters">
            {CHAPTERS.map((k, i) => (
              <button key={k.id} type="button" onClick={() => setCh(i)} aria-current={i === ch ? "step" : undefined} className={`flex min-h-11 flex-col justify-center gap-2.5 text-left ${i === ch ? "text-night-ink" : "text-[#8a8070] hover:text-night-ink"}`}>
                <span className="relative block h-0.5 overflow-hidden bg-[#3a352f]">
                  <span className="absolute inset-0 origin-left bg-[#8a8070]" style={{ transform: `scaleX(${i < ch ? 1 : 0})` }} />
                  {i === ch && <span key={`${ch}-${playing}-${visible}`} className="hm-bar absolute inset-0 origin-left bg-ember" style={{ animationDuration: `${CHAPTER_SECONDS}s`, animationPlayState: playing && visible ? "running" : "paused" }} />}
                </span>
                <span className="hidden text-[13px] sm:block">{k.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
