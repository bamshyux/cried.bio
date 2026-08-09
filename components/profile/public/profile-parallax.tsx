"use client";

import { useRef, useState } from "react";

const PERSPECTIVE = 720;
const MAX_TILT = 22;
const HOVER_SCALE = 1.04;
const HOVER_LIFT = 28;
const SHIFT_X = 12;
const SHIFT_Y = 10;

const REST_TRANSFORM = `perspective(${PERSPECTIVE}px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0) scale(1)`;

function buildTransform(x: number, y: number) {
  return [
    `perspective(${PERSPECTIVE}px)`,
    `rotateY(${x * MAX_TILT}deg)`,
    `rotateX(${-y * MAX_TILT}deg)`,
    `translate3d(${x * SHIFT_X}px, ${y * SHIFT_Y}px, ${HOVER_LIFT}px)`,
    `scale(${HOVER_SCALE})`,
  ].join(" ");
}

export function ProfileParallaxCard({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState(REST_TRANSFORM);
  const [isHovering, setIsHovering] = useState(false);

  if (!enabled) return <>{children}</>;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setIsHovering(true);
    setTransform(buildTransform(x, y));
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setTransform(REST_TRANSFORM);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={[
        "profile-parallax-card relative z-[1] w-full overflow-visible will-change-transform",
        isHovering ? "" : "transition-transform duration-300 ease-out",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ transform }}
    >
      {children}
    </div>
  );
}
