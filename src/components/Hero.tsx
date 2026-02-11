"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import GlitchText from "./GlitchText";
import TypewriterText from "./TypewriterText";
import HeroDither from "./HeroDither";
import ClippedFrame from "./ClippedFrame";
import FloatingLabels from "./FloatingLabels";

export default function Hero() {
  const [initComplete, setInitComplete] = useState(false);

  return (
    <section className="relative z-[1] min-h-screen flex items-center px-6 md:px-12 max-w-[1400px] mx-auto pt-20 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4 items-center w-full">
        {/* ── Left: Text Content ── */}
        <div className="flex flex-col justify-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="inline-flex items-center gap-2 font-mono text-[11px] font-medium tracking-[0.12em] uppercase text-accent bg-accent-dim border border-accent/15 px-4 py-1.5 rounded-full w-fit mb-8"
          >
            <span
              className="w-1.5 h-1.5 bg-accent rounded-full"
              style={{ animation: "terminal-blink 2s ease-in-out infinite" }}
            />
            systems online
          </motion.div>

          {/* Init sequence */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            className="font-mono text-sm text-muted mb-4"
          >
            <TypewriterText
              text="> initializing matrix_"
              speed={40}
              delay={1000}
              showCursor={!initComplete}
              onComplete={() => setInitComplete(true)}
            />
          </motion.div>

          {/* Headline */}
          {initComplete && (
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-[-0.03em] max-w-[700px] mb-7"
            >
              the operating system for{" "}
              <GlitchText
                text="energy infrastructure"
                className="bg-gradient-to-r from-accent to-cyan bg-clip-text text-transparent"
              />
            </motion.h1>
          )}

          {/* Subtitle */}
          {initComplete && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="font-display text-[15px] font-light text-secondary max-w-[500px] leading-relaxed mb-12 tracking-[0.01em]"
            >
              monitor. orchestrate. optimize.
              <br />
              energy systems at planetary scale. from grid to endpoint.
            </motion.p>
          )}

          {/* CTAs */}
          {initComplete && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <a
                href="#contact"
                className="group inline-flex items-center gap-3 font-mono text-[13px] font-semibold tracking-[0.04em] px-7 py-3.5 bg-accent text-background rounded-md hover:bg-foreground hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,255,136,0.2)] transition-all"
              >
                request_access
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <a
                href="/blog/energy-is-ais-binding-constraint"
                className="inline-flex items-center gap-3 font-mono text-[13px] font-medium tracking-[0.04em] px-7 py-3.5 border border-border-light text-foreground rounded-md hover:border-secondary hover:bg-elevated transition-all"
              >
                read_manifesto
              </a>
            </motion.div>
          )}
        </div>

        {/* ── Right: Dithered Globe ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
          className="relative h-[400px] sm:h-[500px] lg:h-[600px]"
        >
          <ClippedFrame
            className="w-full h-full"
            cut={32}
            corners={["tl", "br"]}
          >
            <HeroDither />
          </ClippedFrame>
          <FloatingLabels />
        </motion.div>
      </div>
    </section>
  );
}
