"use client";

import { useEffect, useRef } from "react";
import { VIZ, mountFigure } from "@/lib/challenges/viz";

/* Legend glyphs, verbatim from the atlas. */
const LEG: Record<string, string> = {
  line: '<svg width="22" height="10"><line x1="1" y1="5" x2="21" y2="5" stroke="var(--fig-ink)" stroke-width="1.6"/></svg>',
  dash: '<svg width="22" height="10"><line x1="1" y1="5" x2="21" y2="5" stroke="var(--fig-ink)" stroke-width="1.4" stroke-dasharray="4 3"/></svg>',
  accline: '<svg width="22" height="10"><line x1="1" y1="5" x2="21" y2="5" stroke="var(--fig-acc)" stroke-width="2.2"/></svg>',
  warmline: '<svg width="22" height="10"><line x1="1" y1="5" x2="21" y2="5" stroke="var(--fig-warm)" stroke-width="2.2"/></svg>',
  dot: '<svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="var(--fig-ink)"/></svg>',
  acc: '<svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="var(--fig-acc)"/></svg>',
  warm: '<svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="var(--fig-warm)"/></svg>',
  grey: '<svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="var(--fig-mute)"/></svg>',
  hole: '<svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="none" stroke="var(--fig-acc)" stroke-width="1.6"/></svg>',
  ring: '<svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="none" stroke="var(--fig-ink)" stroke-width="1.2"/></svg>',
  soft: '<svg width="16" height="12"><rect x="1" y="2" width="14" height="8" rx="2" fill="var(--fig-soft)" stroke="var(--fig-acc)" stroke-dasharray="2 2"/></svg>',
  sq: '<svg width="12" height="12"><rect x="2" y="2" width="8" height="8" fill="var(--fig-ink)"/></svg>',
  spin: '<svg width="12" height="14"><path d="M6 12V3M3 6l3-3 3 3" fill="none" stroke="var(--fig-ink)" stroke-width="1.4"/></svg>',
};

const fontsReady = () => (typeof document !== "undefined" && document.fonts ? document.fonts.ready : Promise.resolve());

/* Full interactive figure for a problem page. */
export function AtlasFigure({ id, slug }: { id: string; slug: string }) {
  const ref = useRef<HTMLElement>(null);
  const spec = VIZ[id] || { caption: "" };

  useEffect(() => {
    let m: { destroy(): void } | null = null, cancelled = false;
    fontsReady().then(() => { if (!cancelled && ref.current) m = mountFigure(ref.current, id, {}); });
    return () => { cancelled = true; m?.destroy(); };
  }, [id]);

  const sl = spec.slider;
  return (
    <figure className="fig big" id={`fig-${slug}`} ref={ref}>
      {(spec.toggle || sl || spec.button) && (
        <div className="ctr">
          {spec.toggle && (
            <div className="seg" role="group" aria-label="Model">
              {spec.toggle.map((t, i) => (
                <button key={i} type="button" data-mode={i} aria-pressed={i === 0}>{t}</button>
              ))}
            </div>
          )}
          {sl && (
            <label className="slide">
              <span>{sl.label}</span>
              <input type="range" min={sl.min} max={sl.max} step={sl.step} defaultValue={sl.value} />
              <output className="sval">{sl.fmt ? sl.fmt(sl.value) : sl.value}</output>
            </label>
          )}
          {spec.button && <button type="button" className="act" data-act>{spec.button}</button>}
        </div>
      )}
      <div className="plate" />
      <div className="legend">
        {(spec.legend || []).map(([k, l], i) => (
          <span key={i}><span className="lg" dangerouslySetInnerHTML={{ __html: LEG[k] || "" }} />{l}</span>
        ))}
      </div>
      <figcaption>{spec.caption || ""}</figcaption>
    </figure>
  );
}

/* Still thumbnail for an index card; mounts when scrolled near. */
export function AtlasThumb({ id }: { id: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let m: { destroy(): void } | null = null, cancelled = false;
    const io = new IntersectionObserver((ents) => {
      if (ents.some((e) => e.isIntersecting)) {
        io.disconnect();
        fontsReady().then(() => { if (!cancelled) m = mountFigure(el, id, { still: true, warm: 120 }); });
      }
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => { cancelled = true; io.disconnect(); m?.destroy(); };
  }, [id]);

  return <div className="thumb" ref={ref}><div className="plate" /></div>;
}
