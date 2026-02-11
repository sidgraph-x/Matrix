"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface GlitchTextProps {
  text: string;
  className?: string;
}

export default function GlitchText({ text, className = "" }: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(false);
  const hoveringRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerGlitch = useCallback(() => {
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 100 + Math.random() * 150);
  }, []);

  // Auto-fire: periodic glitch at a relaxed pace
  useEffect(() => {
    const initTimeout = setTimeout(triggerGlitch, 400);
    const autoInterval = setInterval(() => {
      triggerGlitch();
    }, 1200 + Math.random() * 800);
    return () => {
      clearTimeout(initTimeout);
      clearInterval(autoInterval);
    };
  }, [triggerGlitch]);

  // Hover: rapid-fire glitch loop on top of auto
  const startHoverGlitch = useCallback(() => {
    hoveringRef.current = true;
    triggerGlitch();
    intervalRef.current = setInterval(() => {
      if (hoveringRef.current) triggerGlitch();
    }, 150 + Math.random() * 150);
  }, [triggerGlitch]);

  const stopHoverGlitch = useCallback(() => {
    hoveringRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <span
      className="relative inline-block cursor-default"
      onMouseEnter={startHoverGlitch}
      onMouseLeave={stopHoverGlitch}
    >
      {/* Main text with gradient */}
      <span className={`relative z-10 ${className}`}>{text}</span>

      {/* Glitch layers — pure chromatic split */}
      {isGlitching && (
        <>
          <span
            className="absolute inset-0 z-20"
            style={{
              color: "#00ff88",
              animation: "glitch-1 0.25s steps(3) forwards",
            }}
            aria-hidden="true"
          >
            {text}
          </span>

          <span
            className="absolute inset-0 z-20"
            style={{
              color: "#0af0e8",
              animation: "glitch-2 0.25s steps(3) forwards",
              mixBlendMode: "screen",
            }}
            aria-hidden="true"
          >
            {text}
          </span>

          <span
            className="absolute inset-0 z-30 pointer-events-none overflow-hidden"
            aria-hidden="true"
          >
            <span
              className="absolute w-full h-[3px] bg-accent/50"
              style={{
                top: `${15 + Math.random() * 30}%`,
                animation: "glitch-1 0.12s steps(1) forwards",
              }}
            />
            <span
              className="absolute w-full h-[2px] bg-cyan/40"
              style={{
                top: `${50 + Math.random() * 30}%`,
                animation: "glitch-2 0.12s steps(1) forwards",
              }}
            />
            <span
              className="absolute w-full h-[1px] bg-accent/30"
              style={{
                top: `${35 + Math.random() * 40}%`,
                animation: "glitch-1 0.1s steps(1) forwards",
              }}
            />
            <span
              className="absolute h-[4px] bg-background/80"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${Math.random() * 40}%`,
                width: `${20 + Math.random() * 40}%`,
                animation: "glitch-2 0.15s steps(1) forwards",
              }}
            />
          </span>
        </>
      )}
    </span>
  );
}
