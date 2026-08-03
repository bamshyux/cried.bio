"use client";

import { useEffect, useRef, useState } from "react";

type TearMotion = "hidden" | "enter" | "hold" | "exit";

export function DashNavTearAccent({
  engaged,
  sub = false,
}: {
  /** True when the nav item is hovered or active/selected */
  engaged: boolean;
  sub?: boolean;
}) {
  const [motion, setMotion] = useState<TearMotion>("hidden");
  const wasEngagedRef = useRef(false);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

    if (engaged) {
      wasEngagedRef.current = true;
      setMotion("enter");
      enterTimerRef.current = setTimeout(() => setMotion("hold"), 480);
      return;
    }

    if (wasEngagedRef.current) {
      setMotion("exit");
      exitTimerRef.current = setTimeout(() => {
        setMotion("hidden");
        wasEngagedRef.current = false;
      }, 420);
      return;
    }

    setMotion("hidden");
  }, [engaged]);

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
      <span className="bf-dash-nav-tear__drop" />
    </span>
  );
}
