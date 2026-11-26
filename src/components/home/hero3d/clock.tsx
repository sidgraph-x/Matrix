"use client";

import { createContext, useContext, useEffect, useRef } from "react";

/** World-space spacing between stations along +x. Station i is rendered in a group at x = i * STATION_GAP. */
export const STATION_GAP = 40;
/** Seconds each chapter holds while playing. */
export const CHAPTER_SECONDS = 9;
/** Seconds the camera takes to fly between stations. */
export const FLY_SECONDS = 2.2;

type Clock = { ch: number; since: number; reduce: boolean; pin?: number };
const ClockCtx = createContext<{ current: Clock }>({ current: { ch: 0, since: 0, reduce: false } });

/** Seconds into the current chapter, honouring reduced motion (4 s) and a pinned review time. */
export function chapterTime(c: Clock) {
  if (c.pin !== undefined) return c.pin;
  if (c.reduce) return 4;
  return (performance.now() - c.since) / 1000;
}

export function ClockProvider({ ch, reduce, pin, children }: { ch: number; reduce: boolean; pin?: number; children: React.ReactNode }) {
  const ref = useRef<Clock>({ ch, since: 0, reduce, pin });
  useEffect(() => {
    ref.current = { ch, since: performance.now(), reduce, pin };
  }, [ch, reduce, pin]);
  return <ClockCtx.Provider value={ref}>{children}</ClockCtx.Provider>;
}

/**
 * Returns a function giving seconds since `index`'s chapter began (0 when another chapter is showing).
 * Call it inside useFrame. Under reduced motion it returns a fixed representative time of 4 s,
 * so stations should draw their "mechanism visible" state at t = 4.
 */
export function useLocalTime(index: number) {
  const ref = useContext(ClockCtx);
  return () => {
    const c = ref.current;
    if (c.ch !== index) return 0;
    return chapterTime(c);
  };
}

export function useClockRef() {
  return useContext(ClockCtx);
}
