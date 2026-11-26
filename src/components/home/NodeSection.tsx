"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import NodeIso, { type NodeLayer } from "./NodeIso";

const STAGES: { id: NodeLayer; name: string; spec: string }[] = [
  { id: "all", name: "The whole Node", spec: "A battery and power skid at the base, a liquid-cooled GPU hall above it, a roof carrying solar, cooling and a satellite dish, and a personal model running across all of it." },
  { id: "energy", name: "Energy", spec: "Solar on the roof, batteries in the skid, and a DC bus straight to the racks. The Node can run islanded or alongside a grid." },
  { id: "compute", name: "Compute", spec: "GPUs for training and serving, local storage for memory and checkpoints, and a Linux-native control plane, cooled by dry coolers on the roof." },
  { id: "link", name: "Link", spec: "A satellite dish for remote sites, fiber where it exists, and encrypted links that let Nodes learn together without pooling private data." },
  { id: "intelligence", name: "Intelligence", spec: "A model that learns continually from its user, with memory and weights that stay on the machine." },
];

/* scroll progress → which stage is showing. The first stretch is spent taking the Node apart. */
const BANDS = [0.3, 0.44, 0.58, 0.72, 0.86];
const stageAt = (p: number) => (p < BANDS[0] || p >= BANDS[4] ? 0 : BANDS.findIndex((b, i) => p >= b && p < BANDS[i + 1]) + 1);

export default function NodeSection() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [pinned, setPinned] = useState(false);
  const [stage, setStage] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const scrolled = useTransform(scrollYProgress, [0.04, 0.28], [0, 1]);
  const still = useMotionValue(1);

  useEffect(() => {
    const mq = matchMedia("(min-width: 900px)");
    const set = () => setPinned(mq.matches && !reduce);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, [reduce]);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (pinned) setStage(stageAt(p));
  });

  const pick = (i: number) => {
    const el = ref.current;
    if (!pinned || !el) return setStage(i);
    const span = el.offsetHeight - window.innerHeight;
    const frac = i === 0 ? 0.2 : (BANDS[i - 1] + BANDS[i]) / 2;
    window.scrollTo({ top: el.offsetTop + span * frac, behavior: "smooth" });
  };

  const s = STAGES[stage];

  return (
    <section id="node" ref={ref} aria-labelledby="node-h" className="relative bg-night text-night-ink" style={{ height: pinned ? "340vh" : undefined }}>
      <div className={pinned ? "sticky top-[72px] flex h-[calc(100vh-72px)] items-center overflow-hidden" : "py-[clamp(80px,12vw,140px)]"}>
        <div className="wrap grid w-full items-center gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <span className="label text-[#9A907F]">The Node</span>
              <h2 id="node-h" className="serif m-0 text-[clamp(36px,4.2vw,58px)] leading-[1.05]">Everything a personal intelligence needs, in one machine.</h2>
            </div>
            <div role="tablist" aria-label="Node layers" className="flex flex-col border-t border-night-rule">
              {STAGES.map((st, i) => {
                const on = i === stage;
                return (
                  <button
                    key={st.id}
                    role="tab"
                    type="button"
                    aria-selected={on}
                    aria-controls="node-spec"
                    onClick={() => pick(i)}
                    className={`group flex min-h-[48px] items-baseline gap-4 border-b border-night-rule py-3 text-left transition-colors ${on ? "text-night-ink" : "text-[#8A8070] hover:text-night-ink"}`}
                  >
                    <span className={`font-mono text-[11px] tabular-nums ${on ? "text-ember" : "text-[#6B6255]"}`}>{String(i).padStart(2, "0")}</span>
                    <span className="serif text-[22px] leading-tight">{st.name}</span>
                    <span aria-hidden="true" className={`ml-auto h-px self-center bg-ember transition-all duration-500 ${on ? "w-10" : "w-0"}`} />
                  </button>
                );
              })}
            </div>
            <p id="node-spec" role="tabpanel" aria-live="polite" className="m-0 min-h-[5.2em] max-w-[46ch] text-[16px] leading-[1.65] text-night-mute">{s.spec}</p>
          </div>
          <div className="relative mx-auto w-full max-w-[680px]">
            <NodeIso ex={pinned ? scrolled : still} active={s.id} labels className="node-iso" />
          </div>
        </div>
      </div>
    </section>
  );
}
