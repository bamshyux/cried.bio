"use client";

import { TEARDROP_PATH, TEARDROP_VIEWBOX } from "@/lib/brand/teardrop";
import { useEffect, useId, useRef, useState } from "react";

type TearMotion = "hidden" | "enter" | "hold" | "exit";

export function DashNavTearAccent({
  selected,
  sub = false,
}: {
  selected: boolean;
  sub?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const bodyGradId = `tear-body-${uid}`;

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
      enterTimerRef.current = setTimeout(() => setMotion("hold"), 380);
      return;
    }

    if (wasSelectedRef.current) {
      setMotion("exit");
      exitTimerRef.current = setTimeout(() => {
        setMotion("hidden");
        wasSelectedRef.current = false;
      }, 320);
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
      <svg
        className="bf-dash-nav-tear__drop"
        viewBox={TEARDROP_VIEWBOX}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={bodyGradId} x1="16" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(255,255,255,0.88)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.42)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.16)" />
          </linearGradient>
        </defs>
        <path d={TEARDROP_PATH} fill={`url(#${bodyGradId})`} />
        <path
          d={TEARDROP_PATH}
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="0.55"
          strokeLinejoin="round"
        />
        <ellipse
          cx="12.4"
          cy="11.8"
          rx="1.4"
          ry="2.6"
          fill="rgba(255,255,255,0.35)"
          transform="rotate(-20 12.4 11.8)"
        />
      </svg>
    </span>
  );
}
