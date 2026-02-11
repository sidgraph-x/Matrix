"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LABELS = [
  "grid/monitor.service",
  "solar.controller",
  "turbine/telemetry",
  "demand-forecast.ts",
  "battery.optimizer",
  "power/dispatch.ts",
  "smart-meter/ingest",
  "fault-detection.ts",
  "capacity.planner",
  "energy/trading.ts",
  "grid-topology.map",
  "load-balancer.config",
];

// Positions spread around the globe — consecutive entries are far apart
// to prevent overlapping when 2-3 labels are visible simultaneously
const POSITIONS: Array<{ top: string; left: string }> = [
  { top: "14%", left: "52%" },   // upper-center-right
  { top: "74%", left: "10%" },   // lower-left
  { top: "22%", left: "8%" },    // upper-left
  { top: "68%", left: "58%" },   // lower-right
  { top: "42%", left: "72%" },   // mid-right
  { top: "82%", left: "38%" },   // bottom-center
  { top: "8%", left: "30%" },    // top-center
  { top: "52%", left: "6%" },    // mid-left
];

interface ActiveLabel {
  id: number;
  text: string;
  position: { top: string; left: string };
}

export default function FloatingLabels() {
  const [labels, setLabels] = useState<ActiveLabel[]>([]);
  const counterRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let interval: ReturnType<typeof setInterval>;

    const spawn = () => {
      if (!mountedRef.current) return;

      const idx = counterRef.current;
      counterRef.current++;

      const id = idx;
      const text = LABELS[idx % LABELS.length];
      const position = POSITIONS[idx % POSITIONS.length];

      setLabels((prev) => [...prev, { id, text, position }]);

      // Auto-remove after 3.5s
      setTimeout(() => {
        if (mountedRef.current) {
          setLabels((prev) => prev.filter((l) => l.id !== id));
        }
      }, 3500);
    };

    // First label after 3s (waits for hero init sequence), then every 2s
    const initial = setTimeout(() => {
      spawn();
      interval = setInterval(spawn, 2000);
    }, 3000);

    return () => {
      mountedRef.current = false;
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 hidden md:block">
      <AnimatePresence>
        {labels.map((label) => (
          <motion.div
            key={label.id}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -8 }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="absolute flex items-center gap-2"
            style={label.position}
          >
            {/* Node dot with ring */}
            <span className="relative flex-shrink-0 flex items-center justify-center w-4 h-4">
              <span className="absolute inset-0 rounded-full border-[1.5px] border-accent/50" />
              <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_6px_rgba(0,255,136,0.6)]" />
            </span>
            {/* Label pill */}
            <span className="bg-[#1f5e34] border border-accent/20 rounded-[3px] px-3 py-1.5 shadow-[0_0_20px_rgba(0,255,136,0.08)]">
              <span className="font-mono text-[11px] text-white/90 whitespace-nowrap tracking-[0.02em]">
                {label.text}
              </span>
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
