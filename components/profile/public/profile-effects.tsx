"use client";

import { useEffect, useRef, useState } from "react";
import type { CursorEffect } from "@/lib/types/settings";
import { BRAND } from "@/lib/design/tokens";

export function CursorEffectCanvas({
  effect,
  color = BRAND.accent,
}: {
  effect: CursorEffect;
  color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (effect === "none") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const points: { x: number; y: number; age: number; size?: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      if (effect === "sparkles") {
        for (let i = 0; i < 3; i++) {
          points.push({
            x: e.clientX + (Math.random() - 0.5) * 20,
            y: e.clientY + (Math.random() - 0.5) * 20,
            age: 0,
            size: Math.random() * 3 + 1,
          });
        }
      } else {
        points.push({ x: e.clientX, y: e.clientY, age: 0 });
      }
      if (points.length > 40) points.shift();
    };

    window.addEventListener("mousemove", onMove);

    let id: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of points) {
        p.age++;
        const alpha = 1 - p.age / 35;
        if (alpha <= 0) continue;

        const radius =
          effect === "glow" ? 8 * alpha : (p.size ?? 4) * alpha;

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);

        if (effect === "glow") {
          ctx.fillStyle = `${color}${Math.round(alpha * 100).toString(16).padStart(2, "0")}`;
          ctx.shadowBlur = 15;
          ctx.shadowColor = color;
        } else if (effect === "sparkles") {
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        } else {
          ctx.fillStyle = `${color}${Math.round(alpha * 180).toString(16).padStart(2, "0")}`;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      points.splice(0, points.filter((p) => p.age > 35).length);
      id = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, [effect, color]);

  if (effect === "none") return null;

  return (
    <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[100]" aria-hidden />
  );
}

/** @deprecated use CursorEffectCanvas */
export function CursorTrail(props: { enabled: boolean; color: string }) {
  return (
    <CursorEffectCanvas
      effect={props.enabled ? "trail" : "none"}
      color={props.color}
    />
  );
}

export function TypingBio({ text, enabled }: { text: string; enabled: boolean }) {
  const [displayed, setDisplayed] = useState(enabled ? "" : text);
  const [done, setDone] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setDisplayed(text);
      setDone(true);
      return;
    }

    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 35);

    return () => clearInterval(interval);
  }, [text, enabled]);

  if (!enabled) return <p className="leading-relaxed">{text}</p>;

  return (
    <p className="leading-relaxed">
      {displayed}
      {!done && <span className="bf-cursor-blink ml-0.5 inline-block w-0.5">|</span>}
    </p>
  );
}
