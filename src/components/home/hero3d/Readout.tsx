import type { Readout as R } from "./story";

/** The chapter's number, as a small chart on the plate's top right. */
export default function Readout({ r }: { r: R }) {
  return (
    <div className="w-[300px] rounded-[4px] border border-night-rule bg-[#171512]/80 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <span className="text-[12px] text-night-ink">{r.title}</span>
        {r.simulated && <span className="font-mono text-[10px] text-night-mute">Simulated</span>}
      </div>
      {r.kind === "bars" && <Bars r={r} />}
      {r.kind === "rows" && (
        <dl className="m-0 flex flex-col gap-1.5">
          {r.rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-4 border-t border-night-rule pt-1.5 text-[12px]">
              <dt className="text-night-mute">{row.label}</dt>
              <dd className={`m-0 font-mono ${row.accent ? "text-ember" : "text-night-ink"}`}>{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {r.kind === "curve" && <Curve r={r} />}
      <p className="m-0 mt-3 text-[11px] leading-[1.45] text-night-mute">{r.note}</p>
    </div>
  );
}

function Bars({ r }: { r: Extract<R, { kind: "bars" }> }) {
  const f = (v: number) => (r.log ? Math.log10(Math.max(v, 1e-3)) : v);
  const lo = r.log ? Math.min(...r.rows.map((x) => f(x.value))) - 0.6 : 0;
  const hi = Math.max(...r.rows.map((x) => f(x.value)));
  return (
    <div className="flex flex-col gap-2.5">
      {r.rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-1">
          <div className="flex justify-between text-[12px]">
            <span className="text-night-mute">{row.label}</span>
            <span className={`font-mono ${row.accent ? "text-ember" : "text-night-ink"}`}>{row.value.toLocaleString("en-US")} {r.unit}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-night-rule">
            <div className={`h-full rounded-full ${row.accent ? "bg-ember" : "bg-night-mute"}`} style={{ width: `${Math.max(3, ((f(row.value) - lo) / (hi - lo)) * 100)}%` }} />
          </div>
        </div>
      ))}
      {r.log && <span className="font-mono text-[10px] text-night-mute">log scale</span>}
    </div>
  );
}

function Curve({ r }: { r: Extract<R, { kind: "curve" }> }) {
  const W = 268, H = 92;
  return (
    <div className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" aria-hidden="true">
        <path d={`M0 ${H - 0.5}H${W}`} stroke="#2e2a25" />
        {r.series.map((s) => (
          <polyline
            key={s.label}
            points={s.points.map((p, i) => `${((i / (s.points.length - 1)) * W).toFixed(1)},${(H - 4 - p * (H - 10)).toFixed(1)}`).join(" ")}
            fill="none"
            stroke={s.accent ? "#ff6b2c" : "#b3a998"}
            strokeWidth={s.accent ? 2 : 1.2}
          />
        ))}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-night-mute">
        {r.series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className={`inline-block h-0.5 w-3 ${s.accent ? "bg-ember" : "bg-night-mute"}`} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
