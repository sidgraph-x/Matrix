import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROBLEMS, getProblem, buildSections, toolRows, md } from "@/lib/challenges";
import { AtlasFigure } from "@/components/challenges/AtlasFigure";
import AtlasToc from "@/components/challenges/AtlasToc";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return PROBLEMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProblem((await params).slug);
  if (!p) return {};
  return { title: `${p.id} · ${p.title} — Matrix`, description: p.question };
}

function Pips({ n, label }: { n: number; label: string }) {
  return (
    <span className="pips" title={`${label} ${n} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= n ? "on" : ""} />)}
    </span>
  );
}

export default async function ProblemPage({ params }: Props) {
  const p = getProblem((await params).slug);
  if (!p) notFound();
  const i = PROBLEMS.indexOf(p);
  const prev = PROBLEMS[(i - 1 + PROBLEMS.length) % PROBLEMS.length];
  const next = PROBLEMS[(i + 1) % PROBLEMS.length];
  const link = p.link ? PROBLEMS.find((q) => q.id === p.link) : undefined;
  const isCore = p.type === "Core";
  const sec = buildSections(p);

  return (
    <>
      <nav className="crumb"><Link href="/challenges">All problems</Link><span>/</span><span>{p.group}</span></nav>
      <header className="phead">
        <h1>{p.title}</h1>
        <p className="byline">Authored by <strong>Siddhant Saxena</strong> <span>(@sidgraph)</span></p>
        <p className="q">{p.question}</p>
        <div className="tags">
          <span className="tag strong">{isCore ? "Problem" : "Computational"} {p.id}</span>
          <span className="tag">Open</span>
          <span className="tag">{p.group}</span>
          <span className="tag">Impact <Pips n={p.impact} label="Impact" /></span>
          <span className="tag">Verifiability <Pips n={p.ver} label="Verifiability" /></span>
          {link && <Link className="tag" href={`/challenges/${link.slug}`}>Feeds {link.id} →</Link>}
        </div>
      </header>
      <AtlasFigure id={p.id} slug={p.slug} />
      <div className="cols">
        <article className="prose">
          {sec.map((x) => (
            <section id={`s-${x.id}`} key={x.id}>
              <h2>{x.title}</h2>
              <div dangerouslySetInnerHTML={{ __html: x.html }} />
            </section>
          ))}
        </article>
        <aside className="side">
          <div className="tool">
            <h2>What it takes</h2>
            <dl>
              {toolRows(p).map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd dangerouslySetInnerHTML={{ __html: md(v) }} /></div>
              ))}
            </dl>
          </div>
          <AtlasToc items={sec.map(({ id, title }) => ({ id, title }))} />
        </aside>
      </div>
      <nav className="pn">
        <Link href={`/challenges/${prev.slug}`}><small>← {prev.id}</small>{prev.title}</Link>
        <Link href={`/challenges/${next.slug}`} className="r"><small>{next.id} →</small>{next.title}</Link>
      </nav>
    </>
  );
}
