"use client";

import { useEffect, useRef } from "react";
import type { ParticleEffect } from "@/lib/types/settings";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  char?: string;
  rotation?: number;
};

export function ParticleCanvas({ effect }: { effect: ParticleEffect }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const count =
      effect === "matrix" ? 80 :
      effect === "starfield" || effect === "stars" ? 180 :
      effect === "bubbles" ? 40 : 100;

    for (let i = 0; i < count; i++) {
      particles.push(createParticle(effect, canvas.width, canvas.height));
    }

    const draw = () => {
      if (effect === "matrix") {
        ctx.fillStyle = "rgba(0,0,0,0.08)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      for (const p of particles) {
        updateParticle(p, effect, canvas.width, canvas.height);

        if (effect === "matrix") {
          ctx.fillStyle = `rgba(0, 229, 204, ${p.opacity})`;
          ctx.font = `${p.size}px monospace`;
          ctx.fillText(p.char ?? "0", p.x, p.y);
        } else if (effect === "sakura") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation ?? 0);
          ctx.fillStyle = `rgba(255, 183, 197, ${p.opacity})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (effect === "leaves") {
          ctx.fillStyle = `rgba(180, 140, 60, ${p.opacity})`;
          ctx.fillRect(p.x, p.y, p.size, p.size * 0.5);
        } else if (effect === "bubbles") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,255,255,${p.opacity * 0.5})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (effect === "fireflies") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 230, 100, ${p.opacity})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#ffe066";
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (effect === "rain") {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 1, p.y - 10);
          ctx.strokeStyle = `rgba(147, 197, 253, ${p.opacity * 0.5})`;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          const alpha = effect === "stars" || effect === "starfield"
            ? 0.3 + Math.sin(Date.now() * 0.003 + p.x) * 0.5
            : p.opacity;
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [effect]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" aria-hidden />;
}

function createParticle(effect: ParticleEffect, w: number, h: number): Particle {
  const chars = "01アイウエオカキクケコ";
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.5,
    vy: effect === "rain" ? 3 + Math.random() * 4 :
        effect === "snow" ? 0.5 + Math.random() * 1.5 :
        effect === "bubbles" ? -0.3 - Math.random() * 0.5 :
        effect === "matrix" ? 1 + Math.random() * 2 :
        (Math.random() - 0.5) * 0.3,
    size: effect === "matrix" ? 12 + Math.random() * 4 :
          effect === "bubbles" ? 4 + Math.random() * 12 : Math.random() * 3 + 1,
    opacity: Math.random() * 0.8 + 0.2,
    char: chars[Math.floor(Math.random() * chars.length)],
    rotation: Math.random() * Math.PI * 2,
  };
}

function updateParticle(p: Particle, effect: ParticleEffect, w: number, h: number) {
  p.x += p.vx;
  p.y += p.vy;

  if (effect === "rain" || effect === "snow" || effect === "sakura" || effect === "leaves") {
    if (p.y > h) { p.y = -10; p.x = Math.random() * w; }
  } else if (effect === "bubbles") {
    if (p.y < -20) { p.y = h + 10; p.x = Math.random() * w; }
  } else if (effect === "matrix") {
    if (p.y > h) { p.y = -20; p.x = Math.random() * w; p.char = "01"[Math.floor(Math.random() * 2)]; }
  } else {
    if (p.x < 0 || p.x > w) p.vx *= -1;
    if (p.y < 0 || p.y > h) p.vy *= -1;
  }

  if (effect === "fireflies") {
    p.opacity = 0.3 + Math.sin(Date.now() * 0.005 + p.x) * 0.5;
  }
  if (effect === "sakura" || effect === "leaves") {
    p.rotation = (p.rotation ?? 0) + 0.02;
    p.x += Math.sin(p.y * 0.02) * 0.5;
  }
}
