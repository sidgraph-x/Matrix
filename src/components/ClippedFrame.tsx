"use client";

interface ClippedFrameProps {
  children: React.ReactNode;
  className?: string;
  cut?: number;
  corners?: ("tl" | "tr" | "bl" | "br")[];
}

function buildClipPath(cut: number, corners: string[]) {
  const c = cut;
  const tl = corners.includes("tl");
  const tr = corners.includes("tr");
  const bl = corners.includes("bl");
  const br = corners.includes("br");

  const points: string[] = [];

  if (tl) {
    points.push(`${c}px 0`);
  } else {
    points.push("0 0");
  }

  if (tr) {
    points.push(`calc(100% - ${c}px) 0`);
    points.push(`100% ${c}px`);
  } else {
    points.push("100% 0");
  }

  if (br) {
    points.push(`100% calc(100% - ${c}px)`);
    points.push(`calc(100% - ${c}px) 100%`);
  } else {
    points.push("100% 100%");
  }

  if (bl) {
    points.push(`${c}px 100%`);
    points.push(`0 calc(100% - ${c}px)`);
  } else {
    points.push("0 100%");
  }

  if (tl) {
    points.push(`0 ${c}px`);
  }

  return `polygon(${points.join(", ")})`;
}

export default function ClippedFrame({
  children,
  className = "",
  cut = 24,
  corners = ["tl", "br"],
}: ClippedFrameProps) {
  const clipPath = buildClipPath(cut, corners);

  return (
    <div
      className={`${className} overflow-hidden`}
      style={{ clipPath }}
    >
      {children}
    </div>
  );
}
