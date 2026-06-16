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

  const hexFill = monochrome ? "#d4d4d8" : `url(#${goldId})`;
  const border = monochrome ? "#52525b" : "#fffef7";
  const letter = monochrome ? "#18181b" : "#ffffff";

  return (
    <>
      {!monochrome && (
        <defs>
          <linearGradient id={goldId} x1="22%" y1="8%" x2="78%" y2="92%">
            <stop offset="0%" stopColor="#f0c040" />
            <stop offset="42%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
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

      <path
        fill={letter}
        fillRule="evenodd"
        d="M11.05 4.1 5.65 7.18v9.64L11.05 19.9V4.1 M8.05 7.95h1.95v8.1H8.05V7.95"
      />
      <path
        fill={letter}
        fillRule="evenodd"
        d="M12.95 4.1l5.55 3.08v9.64L12.95 19.9V4.1 M14.95 7.95h2.5v8.1h-2.5v-2.35h1.35v-1.15h-1.35V7.95"
      />

      {!monochrome && (
        <>
          <path
            d="M7.4 5.8Q12 3.95 16.6 5.8"
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.75"
            strokeLinecap="round"
            opacity="0.38"
          />
          <circle cx="17.85" cy="5.75" r="0.85" fill="#ffffff" opacity="0.82" />
          <circle cx="5.95" cy="6.15" r="0.58" fill="#ffffff" opacity="0.58" />
          <circle cx="12" cy="3.35" r="0.42" fill="#fff7cc" opacity="0.72" />
        </>
      )}
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
