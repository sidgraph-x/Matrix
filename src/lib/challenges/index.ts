/* Server-side access to the Energy × AI open-problems atlas, plus the HTML builders
   ported from the atlas's app.js (renderProblem). Content is trusted and escaped. */
import { PROBLEMS as RAW } from "./data";
import { DETAIL as RAW_DETAIL } from "./detail";
import { DOCS as RAW_DOCS } from "./docs";

export type Tool = Partial<Record<"data" | "access" | "compute" | "tier" | "infra" | "oss" | "lic" | "machines" | "cost" | "skills", string>>;

export type Problem = {
  id: string;
  slug: string;
  type: "Core" | "Computational";
  group: string;
  title: string;
  question: string;
  why: string;
  state?: string[];
  papers?: string[];
  open?: string[];
  methods?: (string | [string, string, string])[];
  verifier: string;
  bottleneck: string;
  experiment: string;
  impact: number;
  ver: number;
  link?: string;
  tool?: Tool;
};

type Detail = { formal?: string[]; eq?: string[]; base?: [string, string, string][]; papers?: [string, string][] };
type Docs = {
  hard?: string;
  status?: string;
  ready?: string;
  data?: [string, string, string][];
  refs?: [string, string][];
  map?: Record<string, string>;
};

const CORE_VER: Record<string, string> = {
  A1: "Converged gyrokinetic/MHD simulation against measured profiles; tokamak and stellarator experiments; ultimately burning-plasma devices.",
  A2: "Irradiation in a fusion-spectrum neutron source; ion-beam and fission surrogates; post-irradiation examination.",
  A3: "Irradiation tests, post-irradiation examination, lead test assemblies, NRC licensing.",
  A4: "Field wells: stimulation, flow tests and microseismic monitoring over years.",
  A5: "IEC 61215/61730 qualification; multi-year outdoor field data.",
  B1: "Coin and pouch cell cycling; operando characterisation; safety testing.",
  B2: "Pilot plants and multi-year field performance; UL 9540A.",
  B3: "Critical-current tests at field and temperature; magnet test stands; quench tests.",
  B4: "Zero resistance plus Meissner effect (SQUID magnetometry); independent replication.",
  B5: "JEDEC/AEC-Q101 reliability tests; utility field pilots.",
  B6: "Rotating-disk electrode activity; MEA durability over thousands of hours.",
  C1: "Thermal test vehicles and flow loops; reliability rigs; field deployment.",
  C2: "Test chips from fabrication shuttles; system-level measurements.",
  C3: "Packaging pilot lines; JEDEC reliability; customer qualification.",
  C4: "EMT simulation, hardware-in-the-loop, IEEE 1547/2800 and NERC compliance, utility studies.",
};

export const PROBLEMS: Problem[] = (RAW as Problem[]).map((p) => ({ ...p, verifier: p.verifier || CORE_VER[p.id] || "" }));
const DETAIL = RAW_DETAIL as Record<string, Detail>;
const DOCS = RAW_DOCS as Record<string, Docs>;

export const getProblem = (slug: string) => PROBLEMS.find((p) => p.slug === slug);

/* ---- text helpers (verbatim from the atlas) ---- */
export const esc = (s: unknown) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export const md = (s: unknown) =>
  esc(s)
    .replace(/\[([^\]]+)\]\((https?:\/\/(?:[^()\s]|\([^()\s]*\))+)\)/g, (_, t, u) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|\s)(https?:\/\/[^\s<]+)/g, (_, a, u: string) => `${a}<a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\//, "").slice(0, 38)}${u.length > 46 ? "…" : ""}</a>`);
export const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export type Section = { id: string; title: string; html: string };

/* Builds the prose sections of a problem page, exactly as the atlas does. */
export function buildSections(p: Problem): Section[] {
  const D = DETAIL[p.id] || {}, X = DOCS[p.id] || {};
  const isCore = p.type === "Core", M = X.map || {};
  const meth = (p.methods || [])
    .map((m) => (Array.isArray(m) ? `<tr><th>${esc(m[0])}</th><td>${esc(m[1])}</td><td>${esc(m[2])}</td></tr>` : `<tr><th colspan="3">${esc(cap(m))}</th></tr>`))
    .join("");
  const hasTriples = (p.methods || []).some(Array.isArray);
  const sec: Section[] = [];
  const add = (id: string, title: string, html: string) => { if (html) sec.push({ id, title, html }); };

  add("why", "Why it matters", `<p>${md(M["Payoff if solved"] ? cap(M["Payoff if solved"]) + "." : p.why)}</p>`);
  const hard = isCore ? M["Why it has stayed unsolved"] : X.hard;
  add("statement", "The problem, precisely",
    (D.formal || []).map((x) => `<p>${md(x)}</p>`).join("") +
    (D.eq && D.eq.length ? `<div class="eq" role="group" aria-label="Key relations">${D.eq.map((e) => `<div>${esc(e)}</div>`).join("")}</div>` : "") +
    (hard ? `<p class="hard"><strong>Why it is hard.</strong> ${md(cap(hard))}.</p>` : "") +
    (X.status ? `<p class="hard"><strong>Status.</strong> ${md(X.status)}.</p>` : ""));
  add("baselines", "Baselines and best results to date", D.base && D.base.length
    ? `<div class="tw"><table class="meth base stack"><thead><tr><th>Measure</th><th>Best result or baseline</th><th>Source</th></tr></thead><tbody>${D.base.map((r) => `<tr><th>${md(r[0])}</th><td>${md(r[1])}</td><td class="src">${md(r[2])}</td></tr>`).join("")}</tbody></table></div>`
    : "");
  add("research", "Where research stands", (p.state || []).map((x) => `<p>${md(x)}</p>`).join(""));
  add("open", "Open sub-problems", `<ol>${(p.open || []).map((x) => `<li>${md(cap(x))}</li>`).join("")}</ol>`);
  add("approaches", "Approaches", `<div class="tw"><table class="meth">${hasTriples ? "<thead><tr><th>Method</th><th>What it gives</th><th>Limits</th></tr></thead>" : ""}<tbody>${meth}</tbody></table></div>`);
  const loopRows: [string, string | undefined][] = isCore
    ? [["Theory and simulation", M["Theory and simulation"]], ["Experiment and facilities", M["Experiment and facilities"]], ["Scale-up and certification", M["Scale-up and certification"]], ["How an answer gets checked", p.verifier], ["Where the loop breaks", M["Where the loop breaks"]], ["What would compress it", M["What would compress it"]]]
    : [["How an answer gets checked", p.verifier], ["Readiness", X.ready]];
  add("loop", isCore ? "Verification loop" : "How an answer gets checked",
    `<table class="meth loop"><tbody>${loopRows.filter((r) => r[1]).map((r) => `<tr><th>${r[0]}</th><td>${md(cap(String(r[1]).replace(/\*\*/g, "")))}</td></tr>`).join("")}</tbody></table>`);
  add("data", "Data, benchmarks and code", X.data && X.data.length
    ? `<div class="tw"><table class="meth stack"><thead><tr><th>Resource</th><th>Contents</th><th>Where</th></tr></thead><tbody>${X.data.map((r) => `<tr><th>${md(r[0])}</th><td>${md(r[1])}</td><td class="src">${md(r[2])}</td></tr>`).join("")}</tbody></table></div>`
    : "");
  const seen = new Set<string>(), refs: [string, string][] = [];
  const pushRef = (t: string, u: string) => { const k = (u || t).replace(/\/$/, ""); if (seen.has(k)) return; seen.add(k); refs.push([t, u]); };
  (D.papers || []).forEach(([t, u]) => pushRef(t, u));
  (X.refs || []).forEach(([t, u]) => pushRef(t, u));
  (p.papers || []).forEach((x) => { const m = String(x).match(/^(.*?)\s*(https?:\/\/\S+)?$/)!; pushRef(m[1], m[2] || ""); });
  add("papers", "Research papers and sources", `<ol class="refs-list">${refs.map(([t, u]) => `<li>${u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>` : esc(t)}</li>`).join("")}</ol>`);
  add("bottleneck", "Bottleneck", `<p>${md(p.bottleneck)}</p>`);
  add("experiment", "A first experiment", `<p>${md(p.experiment)}</p>`);
  return sec;
}

export function toolRows(p: Problem): [string, string][] {
  const t = p.tool || {};
  return ([["Data", t.data], ["Access", t.access], ["Compute", t.compute], ["Infrastructure", t.infra], ["Open-source software", t.oss], ["Licences", t.lic], ["Machines", t.machines], ["Indicative cost", t.cost], ["Skills", t.skills]] as [string, string | undefined][])
    .filter((r): r is [string, string] => !!r[1]);
}
