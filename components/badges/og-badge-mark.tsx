"use client";

import type { ReactNode } from "react";
import { useId } from "react";

const MONOCHROME_FILL = "#e4e4e7";

function isMonochromeColor(color: string) {
  return color.trim().toLowerCase() === MONOCHROME_FILL;
}

/** Block-letter OG inside a vertical hexagon — muted gold with white letters. */
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
  const letter = monochrome ? "#18181b" : "#f8f4ea";

  return (
    <>
      {!monochrome && (
        <defs>
          <linearGradient id={goldId} x1="28%" y1="10%" x2="72%" y2="90%">
            <stop offset="0%" stopColor="#d9c56a" />
            <stop offset="50%" stopColor="#b8962e" />
            <stop offset="100%" stopColor="#8a7024" />
          </linearGradient>
        </defs>
      )}

      <path d="M12 2.05 19.95 6.58v10.84L12 21.95 4.05 17.42V6.58Z" fill={hexFill} />

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
          <circle cx="17.6" cy="5.9" r="0.62" fill="#fff8e7" opacity="0.55" />
          <circle cx="6.35" cy="6.35" r="0.45" fill="#fff8e7" opacity="0.38" />
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
