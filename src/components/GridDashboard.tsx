"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import ClippedFrame from "./ClippedFrame";

// ── Node data ──

interface NodeData {
  id: string;
  status: "ACTIVE" | "OPTIMIZING" | "STANDBY";
  desc: string;
  capacity: string;
  type: string;
  region: string;
  uptime: string;
  output: number;
  maxOutput: number;
  totalMWh: number;
  segments: number; // out of 20
}

const nodes: NodeData[] = [
  {
    id: "na-east-solar-cluster-7",
    status: "ACTIVE",
    desc: "High-density photovoltaic array with bifacial tracking across 12 sub-stations.",
    capacity: "450MW",
    type: "solar",
    region: "NA-EAST",
    uptime: "99.94%",
    output: 312,
    maxOutput: 450,
    totalMWh: 184720,
    segments: 14,
  },
  {
    id: "eu-west-wind-farm-12",
    status: "ACTIVE",
    desc: "Offshore turbine array with predictive yaw control and grid-forming inverters.",
    capacity: "380MW",
    type: "wind",
    region: "EU-WEST",
    uptime: "99.87%",
    output: 291,
    maxOutput: 380,
    totalMWh: 203410,
    segments: 15,
  },
  {
    id: "ap-south-grid-node-3",
    status: "OPTIMIZING",
    desc: "Battery-backed distribution hub running load-balancing optimization cycle.",
    capacity: "220MW",
    type: "storage",
    region: "AP-SOUTH",
    uptime: "99.91%",
    output: 148,
    maxOutput: 220,
    totalMWh: 97530,
    segments: 13,
  },
  {
    id: "af-north-thermal-plant-1",
    status: "STANDBY",
    desc: "Geothermal baseload plant in scheduled maintenance window, reserves allocated.",
    capacity: "180MW",
    type: "thermal",
    region: "AF-NORTH",
    uptime: "98.12%",
    output: 42,
    maxOutput: 180,
    totalMWh: 61280,
    segments: 5,
  },
];

// ── Status styling ──

const statusColor: Record<string, string> = {
  ACTIVE: "text-accent",
  OPTIMIZING: "text-cyan",
  STANDBY: "text-yellow-400",
};

const statusDotBg: Record<string, string> = {
  ACTIVE: "bg-accent",
  OPTIMIZING: "bg-cyan",
  STANDBY: "bg-yellow-400",
};

const statusBarColor: Record<string, string> = {
  ACTIVE: "bg-accent/80",
  OPTIMIZING: "bg-cyan/80",
  STANDBY: "bg-yellow-400/60",
};

// ── Animated counter hook ──

function useAnimatedValue(
  target: number,
  inView: boolean,
  drift: boolean = false,
  driftAmplitude: number = 0,
) {
  const [value, setValue] = useState(0);
  const phaseRef = useRef(Math.random() * Math.PI * 2);
  const countUpDone = useRef(false);

  useEffect(() => {
    if (!inView) return;

    const duration = 2000;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(target * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        countUpDone.current = true;
      }
    };

    requestAnimationFrame(animate);
  }, [inView, target]);

  // Continuous drift after count-up
  useEffect(() => {
    if (!inView || !drift) return;

    let raf: number;
    let lastTick = 0;
    const interval = 1000 / 15; // ~15fps

    const tick = (now: number) => {
      if (now - lastTick >= interval && countUpDone.current) {
        lastTick = now;
        const sine = Math.sin(now / 1000 + phaseRef.current);
        setValue(target + Math.round(sine * driftAmplitude));
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, drift, target, driftAmplitude]);

  return value;
}

// ── Progress bar ──

function SegmentBar({
  filled,
  status,
  inView,
}: {
  filled: number;
  status: string;
  inView: boolean;
}) {
  const total = 20;
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-[6px] flex-1 rounded-[1px] transition-all duration-700 ${
            inView && i < filled
              ? statusBarColor[status]
              : "bg-border-light/40"
          }`}
          style={{
            transitionDelay: inView ? `${i * 40}ms` : "0ms",
          }}
        />
      ))}
    </div>
  );
}

// ── Node card ──

function NodeCard({
  node,
  inView,
}: {
  node: NodeData;
  inView: boolean;
}) {
  const output = useAnimatedValue(node.output, inView, true, 8);
  const totalMWh = useAnimatedValue(node.totalMWh, inView, true, 45);

  return (
    <div className="bg-surface p-5 md:p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[13px] italic text-secondary leading-tight break-all">
          {node.id}
        </span>
        <span
          className={`shrink-0 flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.1em] uppercase ${statusColor[node.status]}`}
        >
          <span
            className={`inline-block w-[6px] h-[6px] rounded-full ${statusDotBg[node.status]} ${
              node.status !== "STANDBY" ? "status-pulse-dot" : ""
            }`}
          />
          {node.status}
        </span>
      </div>

      {/* Description */}
      <p className="text-[13px] text-muted leading-relaxed">{node.desc}</p>

      {/* Spec chips */}
      <div className="flex flex-wrap gap-[6px]">
        {[
          node.capacity,
          node.type,
          node.region,
          `↑ ${node.uptime}`,
        ].map((chip) => (
          <span
            key={chip}
            className="font-mono text-[10px] text-secondary border border-border px-2 py-0.5 tracking-wide uppercase"
          >
            {chip}
          </span>
        ))}
      </div>

      {/* Progress bar */}
      <SegmentBar
        filled={node.segments}
        status={node.status}
        inView={inView}
      />

      {/* Output */}
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[13px] text-foreground font-medium">
          {output}MW{" "}
          <span className="text-muted font-normal">
            / {node.maxOutput}MW
          </span>
        </span>
        <span className="font-mono text-[11px] text-muted">
          {totalMWh.toLocaleString()} MWh
        </span>
      </div>
    </div>
  );
}

// ── Framer variants ──

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ── Main component ──

export default function GridDashboard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const mwPerSec = useAnimatedValue(847, inView, true, 12);
  const totalMWh = useAnimatedValue(546940, inView, true, 130);
  const activeNodes = useAnimatedValue(12847, inView, false);

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="mt-12"
    >
      <ClippedFrame corners={["tl", "br"]} cut={20}>
        <div className="bg-surface border border-border">
          {/* ── Header bar ── */}
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-between px-5 md:px-6 py-3 border-b border-border"
          >
            <span className="font-mono text-[11px] text-muted tracking-[0.1em] uppercase">
              // grid_operations
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.1em] uppercase text-accent">
              <span
                className="inline-block w-[6px] h-[6px] rounded-full bg-accent status-pulse-dot"
              />
              LIVE
            </span>
          </motion.div>

          {/* ── Top metrics row ── */}
          <motion.div
            variants={fadeUp}
            className="grid grid-cols-1 md:grid-cols-3 border-b border-border"
          >
            {/* MW dispatched/sec */}
            <div className="px-5 md:px-6 py-5 md:border-r border-border">
              <div className="font-mono text-[10px] text-muted tracking-[0.15em] uppercase mb-1.5">
                mw_dispatched/sec
              </div>
              <div className="font-mono text-2xl md:text-3xl font-bold text-foreground flex items-baseline gap-2">
                {mwPerSec.toLocaleString()}
                <span className="text-[11px] font-medium text-accent">
                  ▲ live
                </span>
                <span
                  className="inline-block w-[2px] h-5 bg-accent"
                  style={{
                    animation: "terminal-blink 1s step-end infinite",
                  }}
                />
              </div>
            </div>

            {/* Total MWh processed */}
            <div className="px-5 md:px-6 py-5 md:border-r border-border border-t md:border-t-0">
              <div className="font-mono text-[10px] text-muted tracking-[0.15em] uppercase mb-1.5">
                total_mwh_processed
              </div>
              <div className="font-mono text-2xl md:text-3xl font-bold text-foreground">
                {totalMWh.toLocaleString()}
              </div>
            </div>

            {/* Active nodes */}
            <div className="px-5 md:px-6 py-5 border-t md:border-t-0">
              <div className="font-mono text-[10px] text-muted tracking-[0.15em] uppercase mb-1.5">
                active_nodes
              </div>
              <div className="font-mono text-2xl md:text-3xl font-bold text-foreground flex items-baseline gap-2">
                {activeNodes.toLocaleString()}
                <span className="text-xs font-medium text-accent">
                  ▲ 99.97%
                </span>
              </div>
            </div>
          </motion.div>

          {/* ── Node cards grid ── */}
          <motion.div
            variants={fadeUp}
            className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border"
          >
            {nodes.map((node) => (
              <NodeCard key={node.id} node={node} inView={inView} />
            ))}
          </motion.div>
        </div>
      </ClippedFrame>
    </motion.div>
  );
}
