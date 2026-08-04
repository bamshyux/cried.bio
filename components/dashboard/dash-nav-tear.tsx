"use client";

import { TEARDROP_PATH, TEARDROP_VIEWBOX } from "@/lib/brand/teardrop";
import { useEffect, useId, useRef, useState } from "react";

type TearMotion = "hidden" | "enter" | "hold" | "exit";

export function DashNavTearAccent({
  selected,
  sub = false,
}: {
  /** True when the nav item is the active/selected route */
  selected: boolean;
  sub?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const bodyGradId = `tear-body-${uid}`;
  const shineGradId = `tear-shine-${uid}`;
  const rimGradId = `tear-rim-${uid}`;
  const clipId = `tear-clip-${uid}`;
  const glowId = `tear-glow-${uid}`;

  const [motion, setMotion] = useState<TearMotion>("hidden");
  const wasSelectedRef = useRef(false);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

    if (selected) {
      wasSelectedRef.current = true;
      setMotion("enter");
      enterTimerRef.current = setTimeout(() => setMotion("hold"), 620);
      return;
    }

    if (wasSelectedRef.current) {
      setMotion("exit");
      exitTimerRef.current = setTimeout(() => {
        setMotion("hidden");
        wasSelectedRef.current = false;
      }, 520);
      return;
    }

    setMotion("hidden");
  }, [selected]);

  useEffect(
    () => () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    },
    [],
  );

  const motionClass =
    motion !== "hidden" ? `bf-dash-nav-tear--${motion}` : "bf-dash-nav-tear--hidden";

  return (
    <span
      className={["bf-dash-nav-tear", sub ? "bf-dash-nav-tear--sub" : "", motionClass]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    >
      <span className="bf-dash-nav-tear__aura" />
      <span className="bf-dash-nav-tear__ripple" />
      <span className="bf-dash-nav-tear__splash bf-dash-nav-tear__splash--a" />
      <span className="bf-dash-nav-tear__splash bf-dash-nav-tear__splash--b" />
      <span className="bf-dash-nav-tear__splash bf-dash-nav-tear__splash--c" />

      <svg
        className="bf-dash-nav-tear__drop"
        viewBox={TEARDROP_VIEWBOX}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={TEARDROP_PATH} />
          </clipPath>

          <linearGradient id={bodyGradId} x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="18%" stopColor="#e8f4ff" stopOpacity="0.92" />
            <stop offset="42%" stopColor="#b8d4f0" stopOpacity="0.55" />
            <stop offset="68%" stopColor="#8eb8e8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#5a90c8" stopOpacity="0.22" />
          </linearGradient>

          <linearGradient id={shineGradId} x1="0" y1="8" x2="32" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="45%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <linearGradient id={rimGradId} x1="16" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
          </linearGradient>

          <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter={`url(#${glowId})`}>
          <path d={TEARDROP_PATH} fill={`url(#${bodyGradId})`} />
          <path
            d={TEARDROP_PATH}
            fill="none"
            stroke={`url(#${rimGradId})`}
            strokeWidth="0.65"
            strokeLinejoin="round"
          />
          <ellipse
            className="bf-dash-nav-tear__spec"
            cx="12.2"
            cy="11.5"
            rx="2.4"
            ry="4.8"
            fill="rgba(255,255,255,0.72)"
            transform="rotate(-22 12.2 11.5)"
          />
          <ellipse
            cx="19.5"
            cy="18"
            rx="1.1"
            ry="1.6"
            fill="rgba(255,255,255,0.28)"
            transform="rotate(-12 19.5 18)"
          />
          <rect
            className="bf-dash-nav-tear__shimmer"
            x="-8"
            y="0"
            width="14"
            height="32"
            fill={`url(#${shineGradId})`}
            clipPath={`url(#${clipId})`}
            opacity="0.55"
          />
        </g>
      </svg>

      <span className="bf-dash-nav-tear__trail" />
    </span>
  );
}
