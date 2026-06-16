"use client";

import { useId } from "react";

/** 12-point scalloped verified badge (Twitter / Instagram style). */
function buildScallopPath(cx: number, cy: number, outerR: number, innerR: number, teeth: number) {
  const segments = teeth * 2;
  const parts: string[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    parts.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `${parts.join(" ")} Z`;
}

export function VerifiedBadgeIcon({
  size = 22,
  monochrome = false,
  className = "",
}: {
  size?: number;
  monochrome?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const gradId = `bf-verified-grad-${uid}`;
  const shape = buildScallopPath(12, 12, 11.1, 9.65, 12);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`bf-verified-badge ${className}`.trim()}
      aria-hidden
    >
      {!monochrome && (
        <defs>
          <linearGradient id={gradId} x1="8%" y1="6%" x2="92%" y2="94%">
            <stop offset="0%" stopColor="#5CC4FF" />
            <stop offset="38%" stopColor="#1D9BF0" />
            <stop offset="100%" stopColor="#1574B8" />
          </linearGradient>
        </defs>
      )}
      <path
        d={shape}
        fill={monochrome ? "#d4d4d8" : `url(#${gradId})`}
        stroke={monochrome ? "#52525b" : "#0b4f86"}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d="M8.6 12.2 10.8 14.4 15.6 9.3"
        stroke={monochrome ? "#18181b" : "#ffffff"}
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
