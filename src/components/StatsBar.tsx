"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface StatProps {
  label: string;
  value: number;
  suffix?: string;
  trend?: string;
}

function AnimatedCounter({ value, suffix, trend }: Omit<StatProps, "label">) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(value * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [inView, value]);

  return (
    <div ref={ref} className="font-mono text-3xl md:text-4xl font-bold text-foreground flex items-baseline gap-2">
      <span>{count.toLocaleString()}</span>
      {suffix && (
        <span className="text-sm font-medium text-secondary">{suffix}</span>
      )}
      {trend && (
        <span className="text-xs font-medium text-accent">{trend}</span>
      )}
      <span
        className="inline-block w-[2px] h-6 bg-accent"
        style={{ animation: "terminal-blink 1s step-end infinite" }}
      />
    </div>
  );
}

const stats: StatProps[] = [
  { label: "nodes_online", value: 12847, trend: "▲ 99.97%" },
  { label: "throughput", value: 847, suffix: "TWh" },
  { label: "grid_latency", value: 12, suffix: "ms" },
  { label: "active_regions", value: 34 },
];

export default function StatsBar() {
  return (
    <div className="relative z-[1] border-t border-b border-border bg-surface">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`py-8 ${
              i < stats.length - 1 ? "md:border-r border-border" : ""
            } ${i === 0 ? "" : "md:pl-8"}`}
          >
            <div className="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-muted mb-2">
              {stat.label}
            </div>
            <AnimatedCounter
              value={stat.value}
              suffix={stat.suffix}
              trend={stat.trend}
            />
          </motion.div>
        ))}
      </div>

      {/* Scanline effect on stats bar */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute h-px w-full opacity-[0.08]"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(0, 255, 136, 0.6), transparent)",
            animation: "scanline 4s linear infinite",
          }}
        />
      </div>
    </div>
  );
}
