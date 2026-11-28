"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { defaults, FORMS } from "./forms";
import type { Params } from "./types";

/*
 * The home headline, drawn by a live simulation. The real <h1> stays in the DOM and sets the
 * layout (and is what screen readers, search engines and text selection see); a canvas over it
 * runs one of four forms. Each form draws itself, holds, then fades into the next; the rotation
 * pauses while the pointer is on the title, while the panel is open and while the title is
 * off screen. A panel explains the model, cites it, and lets the visitor change its parameters.
 */

const STORE = "matrix-title-form";
const DWELL = 9000; // ms each form stays before the next one starts
const FADE = 700; // ms of the hand-off between forms
const GHOST = "rgba(25,23,20,0.1)";

export default function TitleArt({ text, className }: { text: string; className?: string }) {
  const h1 = useRef<HTMLHeadingElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  const [formIx, setFormIx] = useState<number | null>(null);
  const [params, setParams] = useState<Record<string, Params>>(() => Object.fromEntries(FORMS.map((f) => [f.id, defaults(f)])));
  const [draft, setDraft] = useState<Params>({});
  const [seed, setSeed] = useState(1);
  const [gen, setGen] = useState(0);
  const [ready, setReady] = useState(false);
  const [env, setEnv] = useState({ reduce: false, low: false, fine: false });
  const [pinned, setPinned] = useState(false); // ?form=<id> shows one form only
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [panel, setPanel] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const noGL = useRef(false);

  const form = formIx === null ? null : FORMS[formIx];
  const formParams = form ? params[form.id] : null;

  // pick this visit's form: ?form=<id> wins, otherwise rotate through them across visits
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("form");
    let ix = FORMS.findIndex((f) => f.id === q);
    /* eslint-disable react-hooks/set-state-in-effect -- one-time read of browser-only facts after mount */
    if (ix >= 0) setPinned(true);
    else {
      let last = -1;
      try { last = Number(localStorage.getItem(STORE) ?? -1); } catch {}
      ix = (Number.isFinite(last) ? last + 1 : 0) % FORMS.length;
      try { localStorage.setItem(STORE, String(ix)); } catch {}
    }
    setEnv({
      reduce: matchMedia("(prefers-reduced-motion: reduce)").matches,
      low: innerWidth < 760,
      fine: matchMedia("(pointer: fine)").matches,
    });
    setSeed(1 + Math.floor(Math.random() * 1e6));
    setFormIx(ix);
    /* eslint-enable react-hooks/set-state-in-effect */
    let dead = false;
    document.fonts.ready.then(() => { if (!dead) setReady(true); });
    return () => { dead = true; };
  }, []);

  // rebuild when the title reflows to a new width
  useEffect(() => {
    const el = h1.current;
    if (!el) return;
    let w = el.offsetWidth, t = 0;
    const ro = new ResizeObserver(() => {
      if (el.offsetWidth === w) return;
      w = el.offsetWidth;
      clearTimeout(t);
      t = window.setTimeout(() => setGen((g) => g + 1), 160);
    });
    ro.observe(el);
    return () => { ro.disconnect(); clearTimeout(t); };
  }, []);

  // pause the rotation while the title is scrolled away
  useEffect(() => {
    const el = h1.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // rotation: after DWELL, fade the current form out, then start the next one
  const rotating = ready && form !== null && !pinned && !env.reduce && !paused && !hover && !panel && onScreen;
  useEffect(() => {
    if (!rotating) return;
    const t = window.setTimeout(() => setLeaving(true), DWELL);
    return () => clearTimeout(t);
  }, [rotating, formIx, seed, gen]);
  useEffect(() => {
    if (!leaving) return;
    const el = h1.current;
    // a faint copy of the words bridges the gap between forms
    if (el) { el.style.transition = `color ${FADE}ms ease`; el.style.color = GHOST; }
    const t = window.setTimeout(() => {
      setFormIx((i) => {
        const cur = i ?? 0;
        for (let k = 1; k <= FORMS.length; k++) {
          const j = (cur + k) % FORMS.length;
          if (!(noGL.current && FORMS[j].needsGL)) return j;
        }
        return cur;
      });
      setSeed((s) => s + 1);
      setLeaving(false);
    }, FADE);
    return () => clearTimeout(t);
  }, [leaving]);

  // run the form
  useEffect(() => {
    const el = h1.current, canvas = cv.current;
    if (!ready || !form || !formParams || !el || !canvas) return;
    const eng = form.create({ canvas, h1: el, params: formParams, reduce: env.reduce, low: env.low, seed });
    if (!eng) {
      // no WebGL2 float targets: fall back to the print, which only needs a 2D canvas
      const print = FORMS.findIndex((f) => f.id === "print");
      noGL.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- capability fallback discovered while starting the engine
      if (formIx !== print) setFormIx(print);
      return;
    }
    el.style.color = "transparent";
    let raf = 0, inside = false;
    const frame = (now: number) => {
      raf = 0;
      if (eng.tick(now)) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    kick();

    const onMove = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      const x = e.clientX - b.left, y = e.clientY - b.top;
      const near = x > -24 && y > -24 && x < b.width + 24 && y < b.height + 24;
      if (near) { if (!inside) setHover(true); inside = true; eng.pointer({ x, y }); kick(); }
      else if (inside) { inside = false; setHover(false); eng.pointer(null); kick(); }
    };
    if (env.fine && !env.reduce) window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      if (inside) setHover(false);
      eng.dispose();
      el.style.color = "";
    };
  }, [ready, form, formParams, seed, gen, env, formIx]);

  const open = () => {
    if (!form || !formParams) return;
    setDraft(formParams);
    setPanel(true);
    dlg.current?.showModal();
  };
  const choose = (ix: number) => {
    setFormIx(ix);
    setDraft(params[FORMS[ix].id]);
    setSeed((s) => s + 1);
  };
  const apply = () => {
    if (!form) return;
    setParams((p) => ({ ...p, [form.id]: draft }));
    setSeed((s) => s + 1);
    dlg.current?.close();
  };
  const reset = () => form && setDraft(defaults(form));

  const canvasKey = useMemo(() => `${form?.id}-${seed}-${gen}`, [form, seed, gen]);

  return (
    <div className="relative">
      <h1 ref={h1} className={className}>{text}</h1>
      {form && <canvas key={canvasKey} ref={cv} aria-hidden="true" className={`pointer-events-none absolute select-none transition-opacity ease-out ${leaving ? "opacity-0" : "opacity-100"}`} style={{ transitionDuration: `${FADE}ms` }} />}

      <div className={`mt-[clamp(14px,1.4vw,22px)] flex flex-wrap items-center gap-x-5 transition-opacity ${form ? "" : "opacity-0"}`}>
        <button
          type="button"
          onClick={open}
          disabled={!form}
          className="group inline-flex min-h-11 items-center gap-2.5 text-[14px] text-mute transition-colors hover:text-ink"
        >
          {/* one square per form; the ember one is drawing now */}
          <span aria-hidden="true" className="inline-flex gap-1">
            {FORMS.map((f, i) => (
              <span key={f.id} className={`inline-block h-2 w-2 transition-colors duration-500 ${i === formIx ? "bg-ember-deep" : "bg-rule"}`} />
            ))}
          </span>
          <span aria-live="polite">
            Drawn live by {form ? form.name.toLowerCase() : "a simulation"}.{" "}
            <span className="text-ink underline decoration-rule underline-offset-4 group-hover:decoration-ink">How it works</span>
          </span>
        </button>
        {form && !pinned && !env.reduce && (
          <button
            type="button"
            aria-pressed={paused}
            onClick={() => setPaused((p) => !p)}
            className="min-h-11 text-[14px] text-mute underline decoration-rule underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
          >
            {paused ? "Resume rotation" : "Pause rotation"}
          </button>
        )}
      </div>

      <dialog
        ref={dlg}
        aria-labelledby="title-art-h"
        className="m-auto w-[min(680px,calc(100vw-32px))] max-h-[calc(100dvh-32px)] rounded-[10px] bg-surface p-0 text-ink shadow-[0_30px_80px_-30px_rgba(25,23,20,.45)] backdrop:bg-[#191714]/35"
        onClick={(e) => { if (e.target === dlg.current) dlg.current?.close(); }}
        onClose={() => setPanel(false)}
      >
        {form && (
          <div className="flex flex-col gap-6 p-[clamp(22px,3.2vw,40px)]">
            <div role="tablist" aria-label="Title forms" className="flex flex-wrap gap-1.5">
              {FORMS.map((f, i) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={i === formIx}
                  onClick={() => choose(i)}
                  className={`min-h-9 rounded-full px-3.5 text-[13px] transition-colors ${i === formIx ? "bg-ink text-paper" : "border border-rule text-ink-3 hover:border-ink hover:text-ink"}`}
                >
                  {f.name}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <h2 id="title-art-h" className="serif m-0 text-[clamp(28px,3vw,36px)] leading-[1.1]">{form.title}</h2>
              <p className="m-0 text-[15px] leading-[1.65] text-ink-3">{form.body}</p>
              <p className="m-0 text-[14px] leading-[1.6] text-mute">{form.hint} In the Node’s stack, this is {form.about.toLowerCase()}.</p>
            </div>

            <div className="flex flex-col gap-1 border-t border-rule pt-5">
              {form.params.map((p) => {
                const v = draft[p.key] ?? p.value;
                const id = `ta-${form.id}-${p.key}`;
                return (
                  <div key={p.key} className="grid grid-cols-[minmax(0,1fr)_minmax(120px,200px)_64px] items-center gap-4 py-1.5">
                    <label htmlFor={id} className="text-[14px] text-ink-2">{p.label}</label>
                    <input
                      id={id}
                      type="range"
                      min={p.min}
                      max={p.max}
                      step={p.step}
                      value={v}
                      onChange={(e) => setDraft((d) => ({ ...d, [p.key]: Number(e.target.value) }))}
                      className="w-full accent-[#191714]"
                    />
                    <output htmlFor={id} className="text-right font-mono text-[13px] tabular-nums text-ink">
                      {v.toFixed(p.digits ?? 2)}{p.unit ?? ""}
                    </output>
                  </div>
                );
              })}
            </div>

            <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[12.5px] leading-[1.5] text-mute">
              {form.refs.map((r) => (
                <li key={r.text}>
                  {r.href ? <a href={r.href} target="_blank" rel="noreferrer" className="underline decoration-rule underline-offset-2 hover:text-ink">{r.text}</a> : r.text}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-5">
              <button type="button" onClick={apply} className="btn btn-ink">Apply and rerun</button>
              <button type="button" onClick={reset} className="btn btn-line">Restore defaults</button>
              <button type="button" onClick={() => dlg.current?.close()} className="ml-auto min-h-11 px-2 text-[14px] text-ink-3 hover:text-ink">Close</button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
