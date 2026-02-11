"use client";

import { useEffect, useState } from "react";

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
  showCursor?: boolean;
}

export default function TypewriterText({
  text,
  speed = 50,
  delay = 0,
  className = "",
  onComplete,
  showCursor = true,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [started, setStarted] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [started, text, speed, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {showCursor && !complete && (
        <span
          className="inline-block w-[2px] h-[1em] bg-accent ml-[2px] align-middle"
          style={{ animation: "terminal-blink 1s step-end infinite" }}
        />
      )}
      {showCursor && complete && (
        <span
          className="inline-block w-[2px] h-[1em] bg-accent ml-[2px] align-middle"
          style={{ animation: "terminal-blink 1s step-end infinite" }}
        />
      )}
    </span>
  );
}
