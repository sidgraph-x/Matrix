import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { PROBLEMS } from "@/lib/challenges";
import NodeSection from "@/components/home/NodeSection";
import EnergyPath from "@/components/home/EnergyPath";
import RackFront from "@/components/home/RackFront";
import Telemetry from "@/components/home/Telemetry";
import OrbitView from "@/components/home/OrbitView";
import LearningLoop from "@/components/home/LearningLoop";
import { Layer, Scene } from "@/components/home/parallax";

/* Until there is a contact inbox, every request goes to the founder's X account. */
const CONTACT = "https://x.com/sidgraph";

const PROBLEMS_3 = [
  { tag: "Energy", head: "Intelligence is bounded by power.", body: "New compute waits years for the grid. We build intelligence that brings its own generation and storage, and we study how to schedule learning around the energy a machine actually has." },
  { tag: "Taste", head: "Capability without judgment is noise.", body: "Taste is the part of intelligence that knows what is worth doing. We study how a model can learn a person's or a team's standards from what they keep, reject and revise, and carry them forward." },
  { tag: "Intelligence", head: "Models should keep learning after they ship.", body: "Frozen weights forget the person using them. We work on continual learning and personal memory, with weights that stay on hardware the user controls." },
];

const THREADS = [
  { cat: "Verification", title: "A harness for scientific discovery", body: "Machine-checked verification, including Lean, for proposed solutions to hard problems in physics, chemistry and materials.", href: "/challenges", cta: `Browse ${PROBLEMS.length} open problems` },
  { cat: "Intelligence", title: "Learning after deployment", body: "Continual learning with personal memory and small adapters, without forgetting what the base model knows." },
  { cat: "Taste", title: "Learning judgment from revision", body: "What a person keeps, rejects and rewrites is the richest signal of their standards. We study how to learn from it." },
  { cat: "Energy", title: "Scheduling learning around the sun", body: "Energy-aware training and inference that moves work to the hours and places where power is abundant." },
];

const BELIEFS = [
  ["Intelligence should belong to the people who use it.", "Weights, memory and data live on hardware the user controls, by default."],
  ["Start from energy.", "Every claim about intelligence is also a claim about power. We design from the watt up."],
  ["Verify before we believe.", "Results that matter should be checkable by machine, not just persuasive to people."],
  ["Taste is learned, not imposed.", "A personal model should reflect its user's judgment, not ours."],
];

function LayerRow({ id, n, name, head, body, children, flip = false }: { id: string; n: string; name: string; head: string; body: React.ReactNode; children: React.ReactNode; flip?: boolean }) {
  return (
    <div id={id} className={`grid scroll-mt-24 items-center gap-x-16 gap-y-10 border-t border-rule pt-10 ${flip ? "lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]" : "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"}`}>
      <div className={`flex flex-col gap-5 ${flip ? "lg:order-2" : ""}`}>
        <span className="label text-ember-deep">Layer {n} · {name}</span>
        <h3 className="serif m-0 text-[clamp(30px,3.2vw,42px)] leading-[1.1]">{head}</h3>
        <div className="flex max-w-[46ch] flex-col gap-4 text-[17px] leading-[1.65] text-ink-3">{body}</div>
      </div>
      <div className={`min-w-0 ${flip ? "lg:order-1" : ""}`}>{children}</div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "The Matrix Node — energy, compute, link and intelligence in one machine",
  description: "Inside the Matrix Node: its own power, its own silicon, a link to the world and a model that learns your taste.",
};

function fmt(d: string) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
}

export default function NodePage() {
  const posts = getAllPosts().slice(0, 3);

  return (
    <>
      {/* PRODUCT */}
      <section className="pt-[clamp(64px,10vw,120px)] pb-[clamp(80px,10vw,120px)]">
        <div className="wrap flex flex-wrap items-start gap-x-20 gap-y-8">
          <div className="flex flex-[1_1_420px] flex-col gap-3">
            <span className="label text-mute">Product</span>
            <h1 className="serif m-0 text-[clamp(40px,5vw,68px)] leading-[1.04]">Introducing the Matrix Node</h1>
          </div>
          <div className="flex flex-[1_1_440px] flex-col gap-7">
            <p className="m-0 text-[19px] leading-[1.6] text-ink-2">A full-stack personal intelligence in one machine. It brings its own energy and its own silicon, links to the world by fiber or satellite, and runs a model that learns your taste and never leaves your hands.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="#node" className="btn btn-ink">Explore the Node</Link>
              <Link href="#access" className="btn btn-line">Request access</Link>
            </div>
          </div>
        </div>
      </section>

      {/* THREE PROBLEMS */}
      <section id="research" className="scroll-mt-20 pb-[clamp(90px,12vw,140px)]">
        <div className="wrap flex flex-col gap-16">
          <div className="flex flex-wrap items-end justify-between gap-x-20 gap-y-6">
            <h2 className="serif m-0 max-w-[720px] text-[clamp(40px,5vw,68px)] leading-[1.04]">Three problems. One stack.</h2>
            <p className="m-0 max-w-[420px] text-[17px] leading-[1.6] text-ink-3">Each is hard on its own. We work on them together, because a personal intelligence fails if any one of them is missing.</p>
          </div>
          <div className="grid border-t border-ink md:grid-cols-3">
            {PROBLEMS_3.map((p, i) => (
              <article key={p.tag} className={`flex flex-col gap-5 py-8 md:pb-10 ${i === 0 ? "md:pr-8" : i === 1 ? "md:border-l md:border-rule md:px-8" : "md:border-l md:border-rule md:pl-8"} ${i ? "border-t border-rule md:border-t-0" : ""}`}>
                <span className="label text-ember-deep">{p.tag}</span>
                <h3 className="serif m-0 text-[32px] leading-[1.15]">{p.head}</h3>
                <p className="m-0 text-[16px] leading-[1.65] text-ink-3">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* THE NODE — pinned, comes apart on scroll */}
      <NodeSection />

      {/* LAYER BY LAYER */}
      <section aria-labelledby="inside-h" className="py-[clamp(90px,12vw,140px)]">
        <div className="wrap flex flex-col gap-[clamp(64px,9vw,112px)]">
          <div className="flex flex-wrap items-end justify-between gap-x-20 gap-y-6">
            <h2 id="inside-h" className="serif m-0 max-w-[760px] text-[clamp(40px,5vw,68px)] leading-[1.04]">Inside the Node, layer by layer.</h2>
            <p className="m-0 max-w-[400px] text-[17px] leading-[1.6] text-ink-3">Four layers, designed together, so that every watt it makes ends up as judgment you own.</p>
          </div>

          <LayerRow id="energy" n="1" name="Energy" head="Makes and banks its own power."
            body={<><p className="m-0">Solar on the roof and in the field, batteries in the skid, and a DC bus straight to the racks. A Node runs islanded or beside a grid.</p><p className="m-0">Because it stores what it makes, it can train when power is cheap and abundant and serve through the night.</p></>}>
            <Scene><Layer depth={70}><EnergyPath /></Layer></Scene>
          </LayerRow>

          <LayerRow id="compute" n="2" name="Compute" flip head="Trains and serves at the source."
            body={<><p className="m-0">GPUs, local storage for memory and checkpoints, and a Linux-native control plane. Every server is liquid-cooled from manifolds fed by the dry coolers on the roof.</p><p className="m-0">The rack runs on 48-volt DC from the battery skid, with no conversion back to AC on the way.</p></>}>
            <Scene className="relative pb-24 lg:pb-0">
              <Layer depth={50} className="mx-auto max-w-[420px] lg:mx-0">
                <div className="rounded-[8px] bg-[radial-gradient(120%_80%_at_50%_0%,#2b2622,#171512)] px-4 pt-6 pb-2">
                  <RackFront />
                </div>
              </Layer>
              <Layer depth={190} className="absolute bottom-0 right-0 w-[min(320px,78%)] lg:bottom-[-4%] lg:right-0">
                <Telemetry />
              </Layer>
            </Scene>
          </LayerRow>

          <LayerRow id="link" n="3" name="Link" head="Connected from anywhere."
            body={<><p className="m-0">Satellite for remote sites, fiber where it exists, and encrypted links so Nodes can learn together without pooling private data.</p><p className="m-0">A Node in a field and a Node in a city basement share what they learn, not what they know about their users.</p></>}>
            <OrbitView />
          </LayerRow>

          <LayerRow id="intelligence" n="4" name="Intelligence" flip head="A model that learns your taste, and keeps it."
            body={<><p className="m-0">The Node watches what you accept, change and discard. It writes that into a personal memory, distils it during surplus-energy hours, and updates small adapters on its own silicon. Over weeks it stops sounding like a model and starts working like you.</p><p className="m-0">None of it leaves the machine unless you send it.</p></>}>
            <Scene><Layer depth={80} className="mx-auto max-w-[540px]"><LearningLoop /></Layer></Scene>
          </LayerRow>
        </div>
      </section>

      {/* RESEARCH AGENDA */}
      <section id="agenda" aria-labelledby="agenda-h" className="scroll-mt-20 pb-[clamp(90px,12vw,140px)]">
        <div className="wrap flex flex-col gap-12">
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-rule pt-10">
            <h2 id="agenda-h" className="serif m-0 text-[clamp(36px,4vw,52px)] leading-[1.08]">Research agenda</h2>
            <Link href="/challenges" className="text-[15px] text-ink underline underline-offset-4 hover:text-ember-deep">The open-problems atlas</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {THREADS.map((t, i) => {
              const dark = i === 0;
              const inner = (
                <>
                  <span className={`label ${dark ? "text-ember" : "text-ember-deep"}`}>{t.cat}</span>
                  <span className="serif text-[28px] leading-[1.15]">{t.title}</span>
                  <span className="mt-auto text-[15px] leading-[1.6] opacity-80">{t.body}</span>
                  {t.href && <span className="text-[14px] underline underline-offset-4">{t.cta}</span>}
                </>
              );
              const cls = `flex min-h-[320px] flex-col gap-5 rounded-[4px] p-7 no-underline ${dark ? "bg-night text-night-ink" : "bg-sand text-ink"}`;
              return t.href ? <Link key={t.cat} href={t.href} className={`${cls} transition-colors hover:bg-[#2a2520]`}>{inner}</Link> : <div key={t.cat} className={cls}>{inner}</div>;
            })}
          </div>
        </div>
      </section>

      {/* WRITING */}
      {posts.length > 0 && (
        <section id="writing" aria-labelledby="writing-h" className="scroll-mt-20 pb-[clamp(90px,12vw,140px)]">
          <div className="wrap flex flex-col gap-10">
            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-rule pt-10">
              <h2 id="writing-h" className="serif m-0 text-[clamp(36px,4vw,52px)] leading-[1.08]">Writing</h2>
              <Link href="/blog" className="text-[15px] text-ink underline underline-offset-4 hover:text-ember-deep">All posts</Link>
            </div>
            <ul className="m-0 flex list-none flex-col p-0">
              {posts.map((p) => (
                <li key={p.slug} className="border-b border-rule first:border-t first:border-ink">
                  <Link href={`/blog/${p.slug}`} className="group grid gap-x-10 gap-y-2 py-7 text-ink no-underline md:grid-cols-[200px_minmax(0,1fr)]">
                    <span className="pt-2 text-[14px] text-mute">{fmt(p.date)}</span>
                    <span className="flex flex-col gap-2">
                      <span className="serif text-[30px] leading-[1.15] group-hover:text-ember-deep">{p.title}</span>
                      <span className="max-w-[68ch] text-[16px] leading-[1.6] text-ink-3">{p.description}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* BELIEFS */}
      <section id="beliefs" aria-labelledby="beliefs-h" className="scroll-mt-16 border-t border-rule bg-sand py-[clamp(90px,12vw,140px)]">
        <div className="wrap flex flex-wrap gap-16">
          <div className="flex flex-[1_1_320px] flex-col gap-4">
            <span className="label text-mute">What we believe</span>
            <h2 id="beliefs-h" className="serif m-0 max-w-[420px] text-[clamp(40px,4.8vw,64px)] leading-[1.04]">Principles we build by.</h2>
          </div>
          <ol className="m-0 flex flex-[1.6_1_520px] list-none flex-col p-0">
            {BELIEFS.map(([h, b], i) => (
              <li key={h} className={`grid grid-cols-[56px_1fr] gap-4 py-7 ${i === 0 ? "border-t border-ink" : "border-t border-[#c9c1b2]"} ${i === BELIEFS.length - 1 ? "border-b border-b-[#c9c1b2]" : ""}`}>
                <span className="label pt-2.5 text-ember-deep">0{i + 1}</span>
                <div className="flex flex-col gap-2.5">
                  <span className="serif text-[28px] leading-[1.2]">{h}</span>
                  <span className="text-[16px] leading-[1.65] text-ink-3">{b}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ACCESS */}
      <section id="access" aria-labelledby="access-h" className="scroll-mt-16 py-[clamp(90px,12vw,140px)]">
        <div className="wrap flex flex-col gap-14">
          <h2 id="access-h" className="serif m-0 max-w-[980px] text-[clamp(44px,6vw,84px)] leading-[1.02]">Bring your intelligence home.</h2>
          <div className="grid gap-5 md:grid-cols-3">
            <div className="flex min-h-[280px] flex-col gap-5 rounded-[4px] bg-night p-9 text-night-ink">
              <span className="label text-[#9a907f]">Node</span>
              <span className="serif text-[32px] leading-[1.15]">Request a Matrix Node for your home, lab or site.</span>
              <a href={CONTACT} target="_blank" rel="noopener noreferrer" className="btn btn-ember mt-auto self-start">Request access</a>
            </div>
            <div className="flex min-h-[280px] flex-col gap-5 rounded-[4px] bg-sand p-9">
              <span className="label text-mute">Research</span>
              <span className="serif text-[32px] leading-[1.15]">Collaborate on energy, taste or verification research.</span>
              <a href={CONTACT} target="_blank" rel="noopener noreferrer" className="btn btn-line mt-auto self-start">Get in touch</a>
            </div>
            <div className="flex min-h-[280px] flex-col gap-5 rounded-[4px] bg-sand p-9">
              <span className="label text-mute">Careers</span>
              <span className="serif text-[32px] leading-[1.15]">Join us across hardware, systems and learning.</span>
              <a href={CONTACT} target="_blank" rel="noopener noreferrer" className="btn btn-line mt-auto self-start">Ask about roles</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
