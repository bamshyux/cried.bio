"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { resolveBioStyle } from "@/lib/bio-style";
import { BRAND } from "@/lib/design/tokens";
import type { CursorEffect, ProfileSettings } from "@/lib/types/settings";
import {
  CURSOR_HOTSPOT_DEFAULT,
  CUSTOM_CURSOR_SIZE_DEFAULT,
  cursorHotspotTransform,
} from "@/lib/profile/custom-cursor";

type Particle = {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  size: number;
  vx?: number;
  vy?: number;
  hue?: number;
  shape?: "circle" | "star" | "heart" | "line" | "ring" | "cross";
  color?: string;
};

const MAX_PARTICLES = 120;

function hexAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  if (hex.startsWith("#") && hex.length >= 7) return `${hex.slice(0, 7)}${a}`;
  return `rgba(255,255,255,${alpha})`;
}

function hsl(h: number, s: number, l: number, a: number): string {
  return `hsla(${h % 360}, ${s}%, ${l}%, ${a})`;
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  const s = size * 0.5;
  ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x, y, x - s, y, x - s, y + s * 0.3);
  ctx.bezierCurveTo(x - s, y + s * 0.8, x, y + s * 1.1, x, y + s * 1.4);
  ctx.bezierCurveTo(x, y + s * 1.1, x + s, y + s * 0.8, x + s, y + s * 0.3);
  ctx.bezierCurveTo(x + s, y, x, y, x, y + s * 0.3);
  ctx.fill();
  ctx.restore();
}

function spawnParticles(
  effect: CursorEffect,
  x: number,
  y: number,
  color: string,
  tick: number,
): Particle[] {
  switch (effect) {
    case "sparkles":
      return Array.from({ length: 3 }, () => ({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        age: 0,
        maxAge: 35,
        size: Math.random() * 3 + 1,
        color: "#ffffff",
      }));
    case "particles":
      return [{ x, y, age: 0, maxAge: 35, size: 4, color }];
    case "neon":
      return [
        { x, y, age: 0, maxAge: 40, size: 10, color },
        { x, y, age: 0, maxAge: 28, size: 5, color },
      ];
    case "comet":
      return [{ x, y, age: 0, maxAge: 45, size: 6, vx: -2 - Math.random() * 2, vy: (Math.random() - 0.5) * 2, color }];
    case "laser":
      return [{ x, y, age: 0, maxAge: 20, size: 2, shape: "line" as const, color }];
    case "ripple":
      return [{ x, y, age: 0, maxAge: 50, size: 4, shape: "ring" as const, color }];
    case "flame":
      return Array.from({ length: 2 }, () => ({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        age: 0,
        maxAge: 30 + Math.random() * 15,
        size: Math.random() * 5 + 3,
        vy: -1 - Math.random() * 2,
        color: Math.random() > 0.5 ? "#ff6b35" : "#ffcc00",
      }));
    case "snow":
      return Array.from({ length: 2 }, () => ({
        x: x + (Math.random() - 0.5) * 16,
        y,
        age: 0,
        maxAge: 60,
        size: Math.random() * 3 + 2,
        vy: 0.5 + Math.random(),
        color: "#ffffff",
      }));
    case "hearts":
      return [{
        x: x + (Math.random() - 0.5) * 10,
        y,
        age: 0,
        maxAge: 45,
        size: 8 + Math.random() * 4,
        vy: -0.8,
        shape: "heart" as const,
        color: "#ff6b9d",
      }];
    case "stars":
      return [{
        x: x + (Math.random() - 0.5) * 12,
        y,
        age: 0,
        maxAge: 40,
        size: 4 + Math.random() * 3,
        vy: -0.5,
        shape: "star" as const,
        color: "#fff8dc",
      }];
    case "bubbles":
      return [{
        x: x + (Math.random() - 0.5) * 14,
        y,
        age: 0,
        maxAge: 55,
        size: 4 + Math.random() * 8,
        vy: -0.6 - Math.random() * 0.8,
        color: hexAlpha(color, 0.5),
      }];
    case "rainbow":
      return [{
        x,
        y,
        age: 0,
        maxAge: 38,
        size: 5,
        hue: (tick * 12) % 360,
      }];
    case "orbit":
      return Array.from({ length: 4 }, (_, i) => ({
        x,
        y,
        age: 0,
        maxAge: 9999,
        size: 3,
        hue: i * 90,
        shape: "circle" as const,
      }));
    case "crosshair":
      return [{ x, y, age: 0, maxAge: 9999, size: 12, shape: "cross" as const, color }];
    case "magnetic":
      return Array.from({ length: 2 }, () => ({
        x: x + (Math.random() - 0.5) * 120,
        y: y + (Math.random() - 0.5) * 120,
        age: 0,
        maxAge: 200,
        size: 3,
        color,
      }));
    case "paint":
      return [{
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        age: 0,
        maxAge: 80,
        size: 6 + Math.random() * 10,
        hue: Math.random() * 360,
      }];
    case "confetti":
      return Array.from({ length: 4 }, () => ({
        x,
        y,
        age: 0,
        maxAge: 50,
        size: 3 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 4,
        vy: -2 - Math.random() * 3,
        hue: Math.random() * 360,
      }));
    case "smoke":
      return [{
        x: x + (Math.random() - 0.5) * 6,
        y,
        age: 0,
        maxAge: 55,
        size: 8 + Math.random() * 10,
        vy: -0.4,
        color: "rgba(180,180,180,0.4)",
      }];
    case "electric":
      return Array.from({ length: 3 }, () => ({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        age: 0,
        maxAge: 12,
        size: 2,
        color: "#aef",
      }));
    case "glitch":
      return [
        { x: x - 4, y, age: 0, maxAge: 18, size: 4, color: "#ff0040" },
        { x: x + 4, y, age: 0, maxAge: 18, size: 4, color: "#00ffff" },
        { x, y, age: 0, maxAge: 25, size: 4, color },
      ];
    default:
      return [{ x, y, age: 0, maxAge: 35, size: 4, color }];
  }
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  effect: CursorEffect,
  color: string,
  pointer: { x: number; y: number },
  tick: number,
) {
  const alpha = 1 - p.age / p.maxAge;
  if (alpha <= 0) return;

  if (p.vx) p.x += p.vx;
  if (p.vy) p.y += p.vy;

  if (effect === "magnetic") {
    const dx = pointer.x - p.x;
    const dy = pointer.y - p.y;
    p.x += dx * 0.08;
    p.y += dy * 0.08;
  }

  if (effect === "orbit") {
    const idx = tick % 4;
    const angle = (tick * 0.08) + (p.hue ?? 0) * (Math.PI / 180);
    const radius = 18 + (p.hue ?? 0) * 0.02;
    p.x = pointer.x + Math.cos(angle + idx) * radius;
    p.y = pointer.y + Math.sin(angle + idx) * radius;
  }

  if (effect === "crosshair") {
    p.x = pointer.x;
    p.y = pointer.y;
  }

  const fill = p.color ?? (p.hue !== undefined ? hsl(p.hue, 85, 60, alpha) : hexAlpha(color, alpha));

  ctx.save();

  if (effect === "glow" || effect === "neon") {
    ctx.shadowBlur = effect === "neon" ? 24 : 15;
    ctx.shadowColor = color;
  }

  if (p.shape === "ring" || effect === "ripple") {
    const radius = p.size + p.age * 1.2;
    ctx.strokeStyle = hexAlpha(color, alpha * 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (p.shape === "cross" || effect === "crosshair") {
    ctx.strokeStyle = hexAlpha(color, 0.6);
    ctx.lineWidth = 1;
    const s = p.size;
    ctx.beginPath();
    ctx.moveTo(p.x - s, p.y);
    ctx.lineTo(p.x + s, p.y);
    ctx.moveTo(p.x, p.y - s);
    ctx.lineTo(p.x, p.y + s);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (p.shape === "line" || effect === "laser") {
    ctx.strokeStyle = hexAlpha(color, alpha);
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - 40 * alpha, p.y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (p.shape === "star" || effect === "stars") {
    ctx.fillStyle = fill;
    drawStar(ctx, p.x, p.y, p.size * alpha, alpha);
    ctx.restore();
    return;
  }

  if (p.shape === "heart" || effect === "hearts") {
    ctx.fillStyle = fill;
    drawHeart(ctx, p.x, p.y, p.size * alpha, alpha);
    ctx.restore();
    return;
  }

  if (effect === "electric") {
    ctx.strokeStyle = hexAlpha("#aef", alpha);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    for (let i = 0; i < 3; i++) {
      ctx.lineTo(p.x + (Math.random() - 0.5) * 20, p.y + (Math.random() - 0.5) * 20);
    }
    ctx.stroke();
    ctx.restore();
    return;
  }

  const radius =
    effect === "glow" ? 8 * alpha :
    effect === "neon" ? (p.size ?? 6) * alpha :
    effect === "smoke" ? p.size * (0.5 + alpha * 0.8) :
    (p.size ?? 4) * alpha;

  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = effect === "sparkles" ? `rgba(255,255,255,${alpha})` : fill;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawSpotlight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  width: number,
  height: number,
) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, 180);
  gradient.addColorStop(0, hexAlpha(color, 0.18));
  gradient.addColorStop(0.45, hexAlpha(color, 0.06));
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

export function CursorEffectCanvas({
  effect,
  color = BRAND.accent,
}: {
  effect: CursorEffect;
  color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const tickRef = useRef(0);

  useEffect(() => {
    if (effect === "none") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles: Particle[] = [];
    let moveThrottle = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
      moveThrottle++;

      if (effect === "orbit") {
        if (particles.length === 0) {
          particles.push(...spawnParticles(effect, e.clientX, e.clientY, color, tickRef.current));
        }
        return;
      }

      if (effect === "crosshair" || effect === "magnetic") {
        if (effect === "magnetic" && particles.length < 24 && moveThrottle % 4 === 0) {
          particles.push(...spawnParticles(effect, e.clientX, e.clientY, color, tickRef.current));
        }
        return;
      }

      if (effect === "spotlight") return;

      const every = effect === "ripple" ? 8 : 2;
      if (moveThrottle % every !== 0) return;

      particles.push(...spawnParticles(effect, e.clientX, e.clientY, color, tickRef.current));
      while (particles.length > MAX_PARTICLES) particles.shift();
    };

    window.addEventListener("mousemove", onMove);

    let id: number;
    const draw = () => {
      tickRef.current++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (effect === "spotlight") {
        drawSpotlight(ctx, pointerRef.current.x, pointerRef.current.y, color, canvas.width, canvas.height);
      }

      if (effect === "crosshair") {
        drawParticle(
          ctx,
          { x: pointerRef.current.x, y: pointerRef.current.y, age: 0, maxAge: 1, size: 12, shape: "cross", color },
          effect,
          color,
          pointerRef.current,
          tickRef.current,
        );
      }

      for (const p of particles) {
        p.age++;
        drawParticle(ctx, p, effect, color, pointerRef.current, tickRef.current);
      }

      const stale =
        effect === "orbit"
          ? []
          : particles.filter((p) => p.age > p.maxAge);
      particles.splice(0, stale.length);

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

export function CustomProfileCursor({
  imageUrl,
  maxSize = CUSTOM_CURSOR_SIZE_DEFAULT,
  hotspotX = CURSOR_HOTSPOT_DEFAULT,
  hotspotY = CURSOR_HOTSPOT_DEFAULT,
}: {
  imageUrl: string | null;
  maxSize?: number;
  hotspotX?: number;
  hotspotY?: number;
}) {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;

    document.documentElement.classList.add("bf-custom-cursor-active");

    const onMove = (event: MouseEvent) => {
      setPos({ x: event.clientX, y: event.clientY });
      const target = event.target;
      const overEditorHandle =
        target instanceof Element && target.closest(".bf-card-editor-handle") !== null;
      setVisible(!overEditorHandle);
    };
    const onLeave = () => setVisible(false);

    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      document.documentElement.classList.remove("bf-custom-cursor-active");
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [imageUrl]);

  if (!imageUrl) return null;

  return (
    <img
      src={imageUrl}
      alt=""
      aria-hidden
      draggable={false}
      className="bf-custom-cursor pointer-events-none fixed z-[9999] select-none"
      style={{
        left: pos.x,
        top: pos.y,
        maxWidth: maxSize,
        maxHeight: maxSize,
        width: "auto",
        height: "auto",
        transform: cursorHotspotTransform(hotspotX, hotspotY),
        opacity: visible ? 1 : 0,
      }}
    />
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

const TYPING_BIO_TYPE_MS = 80;
const TYPING_BIO_DELETE_MS = 50;
const TYPING_BIO_PAUSE_FULL_MS = 2500;
const TYPING_BIO_PAUSE_EMPTY_MS = 800;

export function TypingBio({
  text,
  enabled,
  settings,
  className,
  style,
}: {
  text: string;
  enabled: boolean;
  settings?: ProfileSettings;
  className?: string;
  style?: CSSProperties;
}) {
  const bioStyle = settings ? resolveBioStyle(settings) : style;
  const mergedStyle = bioStyle ? { ...bioStyle, ...style } : style;
  const bioClassName = ["bf-profile-bio leading-relaxed", className].filter(Boolean).join(" ");

  const [displayed, setDisplayed] = useState(enabled ? "" : text);

  useEffect(() => {
    if (!enabled) {
      setDisplayed(text);
      return;
    }

    if (!text) {
      setDisplayed("");
      return;
    }

    let cancelled = false;
    let index = 0;
    let deleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const schedule = (delay: number, fn: () => void) => {
      timeoutId = setTimeout(() => {
        if (!cancelled) fn();
      }, delay);
    };

    const step = () => {
      if (deleting) {
        index = Math.max(0, index - 1);
        setDisplayed(text.slice(0, index));

        if (index === 0) {
          schedule(TYPING_BIO_PAUSE_EMPTY_MS, () => {
            deleting = false;
            step();
          });
          return;
        }

        schedule(TYPING_BIO_DELETE_MS, step);
        return;
      }

      index = Math.min(text.length, index + 1);
      setDisplayed(text.slice(0, index));

      if (index >= text.length) {
        schedule(TYPING_BIO_PAUSE_FULL_MS, () => {
          deleting = true;
          step();
        });
        return;
      }

      schedule(TYPING_BIO_TYPE_MS, step);
    };

    setDisplayed("");
    schedule(TYPING_BIO_TYPE_MS, step);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [text, enabled]);

  if (!enabled) {
    return (
      <p className={bioClassName} style={mergedStyle}>
        {text}
      </p>
    );
  }

  return (
    <p className={`${bioClassName} bf-profile-bio--typing`} style={mergedStyle}>
      <span className="bf-profile-bio-text">
        {displayed}
        <span className="bf-cursor-blink ml-0.5 inline-block w-0.5 text-current opacity-80">|</span>
      </span>
    </p>
  );
}
