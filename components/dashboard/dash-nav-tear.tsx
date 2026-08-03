"use client";

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
  const gradientId = useId();
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
      enterTimerRef.current = setTimeout(() => setMotion("hold"), 480);
      return;
    }

    if (wasSelectedRef.current) {
      setMotion("exit");
      exitTimerRef.current = setTimeout(() => {
        setMotion("hidden");
        wasSelectedRef.current = false;
      }, 420);
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

  return (
    <span
      className={[
        "bf-dash-nav-tear",
        sub ? "bf-dash-nav-tear--sub" : "",
        motion !== "hidden" ? `bf-dash-nav-tear--${motion}` : "bf-dash-nav-tear--hidden",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    >
      <svg
        className="bf-dash-nav-tear__drop"
        viewBox="0 0 14 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="7" y1="0" x2="7" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="45%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.18)" />
          </linearGradient>
        </defs>
        <path
          d="M7 0.5C7 0.5 12.25 7.25 12.25 11.25C12.25 14.15 9.85 16.75 7 16.75C4.15 16.75 1.75 14.15 1.75 11.25C1.75 7.25 7 0.5 7 0.5Z"
          fill={`url(#${gradientId})`}
        />
        <path
          d="M7 0.5C7 0.5 12.25 7.25 12.25 11.25C12.25 14.15 9.85 16.75 7 16.75C4.15 16.75 1.75 14.15 1.75 11.25C1.75 7.25 7 0.5 7 0.5Z"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="0.6"
        />
        <ellipse cx="5.1" cy="7.2" rx="1.1" ry="2.2" fill="rgba(255,255,255,0.35)" transform="rotate(-18 5.1 7.2)" />
      </svg>
    </span>
  );
}
