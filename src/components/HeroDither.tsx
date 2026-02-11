"use client";

import { useEffect, useRef } from "react";

// ── Simple 3D noise (hash-based) for continent generation ──
function hash(x: number, y: number, z: number): number {
  let h = x * 374761393 + y * 668265263 + z * 1274126177;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return (h & 0x7fffffff) / 0x7fffffff;
}

function smoothNoise(x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;

  // Smoothstep
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const sz = fz * fz * (3 - 2 * fz);

  const n000 = hash(ix, iy, iz);
  const n100 = hash(ix + 1, iy, iz);
  const n010 = hash(ix, iy + 1, iz);
  const n110 = hash(ix + 1, iy + 1, iz);
  const n001 = hash(ix, iy, iz + 1);
  const n101 = hash(ix + 1, iy, iz + 1);
  const n011 = hash(ix, iy + 1, iz + 1);
  const n111 = hash(ix + 1, iy + 1, iz + 1);

  const nx00 = n000 + sx * (n100 - n000);
  const nx10 = n010 + sx * (n110 - n010);
  const nx01 = n001 + sx * (n101 - n001);
  const nx11 = n011 + sx * (n111 - n011);

  const nxy0 = nx00 + sy * (nx10 - nx00);
  const nxy1 = nx01 + sy * (nx11 - nx01);

  return nxy0 + sz * (nxy1 - nxy0);
}

function fbm(x: number, y: number, z: number): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < 5; i++) {
    value += amplitude * smoothNoise(x * frequency, y * frequency, z * frequency);
    amplitude *= 0.5;
    frequency *= 2.1;
  }
  return value;
}

// ── Fibonacci sphere distribution ──
function fibSphere(count: number): Array<[number, number, number]> {
  const points: Array<[number, number, number]> = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    points.push([Math.cos(theta) * radius, y, Math.sin(theta) * radius]);
  }
  return points;
}

interface SpherePoint {
  ox: number;
  oy: number;
  oz: number;
  isLand: boolean;
  noise: number;
  size: number;
  isNode: boolean; // outer network node
  extensionFactor: number;
}

export default function HeroDither() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const smoothRotRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let sphereRadius = 0;
    let points: SpherePoint[] = [];
    let outerLines: Array<{ from: number; to: number }> = [];

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sphereRadius = Math.min(w, h) * 0.38;
      initPoints();
    };

    const initPoints = () => {
      const raw = fibSphere(4500);
      points = raw.map(([x, y, z]) => {
        const n = fbm(x * 2.2 + 3.7, y * 2.2 + 1.3, z * 2.2 + 5.1);
        const isLand = n > 0.48;
        const isNode = Math.random() < 0.04;
        return {
          ox: x,
          oy: y,
          oz: z,
          isLand,
          noise: n,
          size: isLand
            ? 0.6 + Math.random() * 1.4
            : 0.2 + Math.random() * 0.5,
          isNode,
          extensionFactor: isNode ? 1.15 + Math.random() * 0.35 : 1,
        };
      });

      // Build outer mesh connections
      outerLines = [];
      const nodeIndices = points
        .map((p, i) => (p.isNode ? i : -1))
        .filter((i) => i >= 0);

      for (let i = 0; i < nodeIndices.length; i++) {
        for (let j = i + 1; j < nodeIndices.length; j++) {
          const a = points[nodeIndices[i]];
          const b = points[nodeIndices[j]];
          const dx = a.ox - b.ox;
          const dy = a.oy - b.oy;
          const dz = a.oz - b.oz;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < 0.55) {
            outerLines.push({ from: nodeIndices[i], to: nodeIndices[j] });
          }
        }
      }
    };

    const project = (
      x: number,
      y: number,
      z: number,
      rotY: number,
      rotX: number,
      ext: number
    ): [number, number, number] => {
      // Rotate around Y axis (auto + mouse horizontal)
      const cosR = Math.cos(rotY);
      const sinR = Math.sin(rotY);
      const rx = x * cosR + z * sinR;
      const rz = -x * sinR + z * cosR;

      // Rotate around X axis (base tilt + mouse vertical)
      const tilt = 0.2 + rotX;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);
      const ry2 = y * cosT - rz * sinT;
      const rz2 = y * sinT + rz * cosT;

      const sx = rx * sphereRadius * ext + w / 2;
      const sy = ry2 * sphereRadius * ext + h / 2;

      return [sx, sy, rz2];
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, w, h);

      // Smooth lerp mouse offset toward target
      const lerpSpeed = 0.06;
      const targetX = mouseRef.current.active ? mouseRef.current.y * 0.3 : 0;
      const targetY = mouseRef.current.active ? mouseRef.current.x * 0.4 : 0;
      smoothRotRef.current.x += (targetX - smoothRotRef.current.x) * lerpSpeed;
      smoothRotRef.current.y += (targetY - smoothRotRef.current.y) * lerpSpeed;

      const rotY = time * 0.0001 + smoothRotRef.current.y;
      const rotX = smoothRotRef.current.x;

      // Sort by depth for painter's algorithm
      const projected = points.map((p, i) => {
        const [sx, sy, depth] = project(
          p.ox,
          p.oy,
          p.oz,
          rotY,
          rotX,
          p.extensionFactor
        );
        return { ...p, sx, sy, depth, idx: i };
      });

      projected.sort((a, b) => a.depth - b.depth);

      // ── Draw outer mesh connections first (behind) ──
      for (const line of outerLines) {
        const a = projected.find((p) => p.idx === line.from)!;
        const b = projected.find((p) => p.idx === line.to)!;
        if (!a || !b) continue;

        // Only draw if both points are somewhat facing us
        const avgDepth = (a.depth + b.depth) / 2;
        if (avgDepth < -0.3) continue;

        const opacity = Math.max(0, Math.min(0.12, (avgDepth + 0.3) * 0.15));
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.strokeStyle = `rgba(10, 240, 232, ${opacity})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // ── Draw surface connections (energy grid lines) ──
      for (let i = 0; i < projected.length; i++) {
        if (!projected[i].isLand) continue;
        for (let j = i + 1; j < Math.min(i + 20, projected.length); j++) {
          if (!projected[j].isLand) continue;
          const dx = projected[i].sx - projected[j].sx;
          const dy = projected[i].sy - projected[j].sy;
          const screenDist = Math.sqrt(dx * dx + dy * dy);

          if (screenDist < 12 && screenDist > 3) {
            const avgDepth = (projected[i].depth + projected[j].depth) / 2;
            if (avgDepth < -0.1) continue;
            const opacity = Math.max(
              0,
              Math.min(0.06, (avgDepth + 0.1) * 0.08)
            );
            ctx.beginPath();
            ctx.moveTo(projected[i].sx, projected[i].sy);
            ctx.lineTo(projected[j].sx, projected[j].sy);
            ctx.strokeStyle = `rgba(0, 255, 136, ${opacity})`;
            ctx.lineWidth = 0.3;
            ctx.stroke();
          }
        }
      }

      // ── Draw dither points ──
      for (const p of projected) {
        // Depth-based visibility (back-face culling with soft falloff)
        const depthFactor = (p.depth + 1) / 2; // 0 = back, 1 = front
        if (depthFactor < 0.15) continue;

        const alpha = Math.pow(depthFactor, 1.5);
        const r = p.size * (0.6 + depthFactor * 0.4);

        if (p.isLand) {
          // Land: bright green dither dots
          const brightness = 0.5 + p.noise * 0.5;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 255, 136, ${alpha * brightness * 0.9})`;
          ctx.fill();

          // Occasional brighter "energy node" dot
          if (p.size > 1.5) {
            ctx.beginPath();
            ctx.arc(p.sx, p.sy, r * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 136, ${alpha * 0.04})`;
            ctx.fill();
          }
        } else {
          // Ocean: dim cyan dither dots
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, r * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(10, 240, 232, ${alpha * 0.25})`;
          ctx.fill();
        }

        // Outer network node indicators
        if (p.isNode && depthFactor > 0.4) {
          // Extended point — draw a small bright dot at the extended position
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(10, 240, 232, ${alpha * 0.7})`;
          ctx.fill();

          // Connection line from sphere surface to extended point
          const [surfX, surfY] = project(p.ox, p.oy, p.oz, rotY, rotX, 1);
          ctx.beginPath();
          ctx.moveTo(surfX, surfY);
          ctx.lineTo(p.sx, p.sy);
          ctx.strokeStyle = `rgba(10, 240, 232, ${alpha * 0.15})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // ── Glow ring around equator area ──
      const cx = w / 2;
      const cy = h / 2;
      const gradient = ctx.createRadialGradient(
        cx,
        cy,
        sphereRadius * 0.85,
        cx,
        cy,
        sphereRadius * 1.4
      );
      gradient.addColorStop(0, "rgba(0, 255, 136, 0)");
      gradient.addColorStop(0.5, "rgba(0, 255, 136, 0.015)");
      gradient.addColorStop(1, "rgba(0, 255, 136, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, sphereRadius * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // Normalize to -1..1 from center
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseRef.current.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    resize();
    animRef.current = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
