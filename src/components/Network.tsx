"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import NetworkDither from "./NetworkDither";
import ClippedFrame from "./ClippedFrame";

const terminalLines = [
  { text: "$ matrix status --global", type: "command" as const },
  { text: "", type: "blank" as const },
  { text: "Region     Nodes    Load     Status", type: "header" as const },
  { text: "────────   ──────   ──────   ──────", type: "header" as const },
  { text: "NA-EAST    3,241    72.4%    ● ONLINE", type: "online" as const },
  { text: "EU-WEST    2,887    68.1%    ● ONLINE", type: "online" as const },
  { text: "AP-SOUTH   1,934    81.7%    ● ONLINE", type: "online" as const },
  { text: "AF-NORTH   1,102    54.3%    ● ONLINE", type: "online" as const },
  { text: "SA-CENT      891    47.2%    ● ONLINE", type: "online" as const },
  { text: "", type: "blank" as const },
  { text: "✓ All systems operational. Uptime: 99.97%", type: "success" as const },
];

function TerminalBlock() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < terminalLines.length) {
        setVisibleLines(i + 1);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 120);
    return () => clearInterval(interval);
  }, [inView]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      onViewportEnter={() => setInView(true)}
      className="bg-background border border-border overflow-hidden mt-10"
    >
      {/* Terminal header */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-white/[0.02]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-4 font-mono text-[10px] text-muted tracking-wider">matrix-cli v2.4.1</span>
      </div>

      {/* Terminal body */}
      <div className="p-5 font-mono text-[13px] leading-[1.9]">
        {terminalLines.slice(0, visibleLines).map((line, i) => (
          <div key={i}>
            {line.type === "command" && (
              <span>
                <span className="text-accent">$</span>{" "}
                <span className="text-foreground">matrix status</span>{" "}
                <span className="text-cyan">--global</span>
              </span>
            )}
            {line.type === "blank" && <span>&nbsp;</span>}
            {line.type === "header" && (
              <span className="text-muted">{line.text}</span>
            )}
            {line.type === "online" && (
              <span>
                <span className="text-secondary">{line.text.replace("● ONLINE", "")}</span>
                <span className="text-accent">● ONLINE</span>
              </span>
            )}
            {line.type === "success" && (
              <span className="text-accent">{line.text}</span>
            )}
          </div>
        ))}
        {visibleLines > 0 && visibleLines < terminalLines.length && (
          <span
            className="inline-block w-[2px] h-4 bg-accent"
            style={{ animation: "terminal-blink 0.8s step-end infinite" }}
          />
        )}
      </div>
    </motion.div>
  );
}

export default function Network() {
  return (
    <section
      id="network"
      className="relative z-[1] border-t border-b border-border bg-surface overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-24 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left: text + terminal */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-mono text-[11px] font-medium tracking-[0.15em] uppercase text-accent mb-4"
          >
            // network
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-sans text-3xl md:text-5xl font-bold leading-[1.1] tracking-[-0.025em] max-w-[700px] mb-5"
          >
            A living map of global energy flow
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[15px] md:text-[17px] text-secondary max-w-[540px] leading-relaxed"
          >
            Every node, every watt, every transaction — visible and verifiable.
            Matrix provides a unified view of energy systems across 34 regions worldwide.
          </motion.p>

          <TerminalBlock />
        </div>

        {/* Right: dithered terrain */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="h-[400px] sm:h-[480px] lg:h-[560px]"
        >
          <ClippedFrame
            className="w-full h-full"
            cut={28}
            corners={["tr", "bl"]}
          >
            <NetworkDither />
          </ClippedFrame>
        </motion.div>
      </div>
    </section>
  );
}
