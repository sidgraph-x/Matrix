"use client";

import { createContext, useContext, useRef, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";

/* A scene tracks its own pass through the viewport (0 = entering at the bottom, 1 = leaving at the top).
   Layers read that progress and drift by `depth`: nearer layers (bigger depth) travel further,
   so a flat illustration separates into planes as you scroll past it. */
const SceneCtx = createContext<MotionValue<number> | null>(null);

export function Scene({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  return (
    <SceneCtx.Provider value={scrollYProgress}>
      <div ref={ref} className={className} style={{ position: "relative", ...style }}>{children}</div>
    </SceneCtx.Provider>
  );
}

/* depth is the travel in px across the whole pass, centred so the layer sits at rest mid-viewport. */
export function Layer({ depth, children, className, style, x = 0 }: { depth: number; children: ReactNode; className?: string; style?: CSSProperties; x?: number }) {
  const p = useContext(SceneCtx)!; // a Layer always sits inside a Scene
  const reduce = useReducedMotion();
  const y = useTransform(p, [0, 1], [depth / 2, -depth / 2]);
  const tx = useTransform(p, [0, 1], [x / 2, -x / 2]);
  return (
    <motion.div className={className} style={{ ...style, y: reduce ? 0 : y, x: reduce ? 0 : tx, willChange: "transform" }}>
      {children}
    </motion.div>
  );
}
