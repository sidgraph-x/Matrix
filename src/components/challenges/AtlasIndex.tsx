"use client";

import Link from "next/link";
import { useState } from "react";
import { AtlasThumb } from "./AtlasFigure";

export type Card = { id: string; slug: string; type: string; group: string; title: string; question: string };

export default function AtlasIndex({ cards }: { cards: Card[] }) {
  const [filter, setFilter] = useState("all");
  const nCore = cards.filter((c) => c.type === "Core").length;
  const chips: [string, string][] = [
    ["all", `All ${cards.length}`],
    ["Core", `Core hard problems · ${nCore}`],
    ["Computational", `Computational problems · ${cards.length - nCore}`],
  ];
  const list = cards.filter((c) => filter === "all" || c.type === filter);
  const groups = [...new Set(cards.map((c) => c.group))].filter((g) => list.some((c) => c.group === g));

  return (
    <>
      <header className="hero">
        <p className="kicker">An illustrated atlas · {cards.length} problems</p>
        <h1>Open problems where energy, materials and AI infrastructure meet</h1>
        <p className="lede">
          Each problem below has its own working figure: the physics, chemistry or mathematics that makes it hard, drawn so you can change one assumption and watch the consequence. Fifteen are core engineering and science problems, and twenty-seven are computational problems that could be settled with algorithms and compute.
        </p>
        <div className="chips" role="group" aria-label="Filter">
          {chips.map(([k, l]) => (
            <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
      </header>
      {groups.map((g) => (
        <section className="grp" key={g}>
          <h2>{g}</h2>
          <div className="grid">
            {list.filter((c) => c.group === g).map((c) => (
              <Link className="card" href={`/challenges/${c.slug}`} key={c.id}>
                <AtlasThumb id={c.id} />
                <div className="cbody">
                  <span className="cid">{c.id}</span>
                  <h3>{c.title}</h3>
                  <p>{c.question}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <footer className="foot">Figures are explanatory models with stated parameters; captions say where values are approximate or schematic.</footer>
    </>
  );
}
