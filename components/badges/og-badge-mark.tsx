"use client";

import type { ReactNode } from "react";
import { useId } from "react";

const MONOCHROME_FILL = "#e4e4e7";

function isMonochromeColor(color: string) {
  return color.trim().toLowerCase() === MONOCHROME_FILL;
}

/** Block-letter OG inside a vertical hexagon — gold with white letters. */
export function OgBadgeMark({
  monochrome = false,
  idPrefix,
}: {
  monochrome?: boolean;
  idPrefix?: string;
}): ReactNode {
  const uid = useId().replace(/:/g, "");
  const prefix = idPrefix ?? uid;
  const goldId = `bf-og-gold-${prefix}`;
  const shineId = `bf-og-shine-${prefix}`;

  const hexFill = monochrome ? "#d4d4d8" : `url(#${goldId})`;
  const border = monochrome ? "#52525b" : "#fffef7";
  const letter = monochrome ? "#18181b" : "#ffffff";

  return (
    <>
      {!monochrome && (
        <defs>
          <linearGradient id={goldId} x1="18%" y1="4%" x2="82%" y2="96%">
            <stop offset="0%" stopColor="#fff3b0" />
            <stop offset="28%" stopColor="#fcd34d" />
            <stop offset="58%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id={shineId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="38%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
      )}

      <path
        d="M12 2.05 19.95 6.58v10.84L12 21.95 4.05 17.42V6.58Z"
        fill={hexFill}
        stroke={border}
        strokeWidth="1.08"
        strokeLinejoin="round"
      />

      {!monochrome && (
        <path
          d="M12 2.05 19.95 6.58v10.84L12 21.95 4.05 17.42V6.58Z"
          fill={`url(#${shineId})`}
          stroke="none"
        />
      )}

      <path
        fill={letter}
        fillRule="evenodd"
        d="M11.2 4.1 5.65 7.18v9.64L11.2 19.9V4.1 M8.05 7.95h1.95v8.1H8.05V7.95"
      />
      <path
        fill={letter}
        fillRule="evenodd"
        d="M12.8 4.1l5.55 3.08v9.64L12.8 19.9V4.1 M14.95 7.95h2.5v8.1h-2.5v-2.35h1.35v-1.15h-1.35V7.95"
      />
    </>
  );
}

export function OgBadgeMarkFromColor({
  color,
}: {
  color: string;
}): ReactNode {
  return <OgBadgeMark monochrome={isMonochromeColor(color)} />;
}
