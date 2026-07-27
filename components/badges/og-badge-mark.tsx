"use client";

import type { ReactNode } from "react";
import { useId } from "react";

/** Cozy home mark for OG — warm gold house, readable at badge size. */
export function OgBadgeMark({
  monochrome = false,
  color = "#c9a83a",
  idPrefix,
}: {
  monochrome?: boolean;
  color?: string;
  idPrefix?: string;
}): ReactNode {
  const uid = useId().replace(/:/g, "");
  const prefix = idPrefix ?? uid;
  const goldId = `bf-og-gold-${prefix}`;
  const roofId = `bf-og-roof-${prefix}`;

  const roofFill = monochrome ? color : `url(#${roofId})`;
  const wallFill = monochrome ? color : `url(#${goldId})`;
  const trim = monochrome ? color : "#f8f4ea";
  const accent = monochrome ? color : "#8a7024";

  return (
    <>
      {!monochrome && (
        <defs>
          <linearGradient id={goldId} x1="30%" y1="20%" x2="70%" y2="95%">
            <stop offset="0%" stopColor="#e8d078" />
            <stop offset="45%" stopColor="#c9a83a" />
            <stop offset="100%" stopColor="#8a7024" />
          </linearGradient>
          <linearGradient id={roofId} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#f0e08a" />
            <stop offset="100%" stopColor="#b8962e" />
          </linearGradient>
        </defs>
      )}

      {/* Roof */}
      <path d="M12 2.6 20.6 10.4H3.4L12 2.6z" fill={roofFill} opacity={monochrome ? 0.88 : 1} />

      {/* Chimney */}
      <path d="M15.8 5.2h2.1v4.8h-2.1V5.2z" fill={wallFill} />
      {!monochrome && (
        <path
          d="M16.2 4.4c.55-.45 1.05-.35 1.35.15.35.6-.05 1.15-.75 1.05-.45-.05-.75-.55-.6-1.2z"
          fill="#fff8e7"
          opacity="0.55"
        />
      )}

      {/* House body */}
      <path
        d="M5.1 10.4h13.8v9.9c0 .55-.45 1-1 1H6.1c-.55 0-1-.45-1-1v-9.9z"
        fill={wallFill}
      />

      {/* Door */}
      <path
        d="M10.35 14.8a1.65 1.65 0 0 1 3.3 0V21H10.35v-6.2z"
        fill={trim}
        opacity={monochrome ? 0.5 : 1}
      />
      <circle cx="12" cy="17.8" r="0.55" fill={accent} opacity={monochrome ? 0.65 : 1} />

      {/* Windows */}
      <rect x="6.6" y="12.1" width="2.5" height="2.5" rx="0.45" fill={trim} opacity={monochrome ? 0.5 : 0.92} />
      <rect x="14.9" y="12.1" width="2.5" height="2.5" rx="0.45" fill={trim} opacity={monochrome ? 0.5 : 0.92} />

      {/* Window crossbars + warm glow */}
      <path
        d="M7.85 12.1v2.5M6.6 13.35h2.5M15.15 12.1v2.5M14.9 13.35h2.5"
        stroke={accent}
        strokeWidth="0.45"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* Step */}
      <path d="M8.8 21h6.4v1.15H8.8V21z" fill={monochrome ? color : "#7a6420"} opacity={monochrome ? 0.75 : 1} />

      {!monochrome && (
        <>
          <circle cx="7.85" cy="13.35" r="0.45" fill="#fff8e7" opacity="0.65" />
          <circle cx="16.15" cy="13.35" r="0.45" fill="#fff8e7" opacity="0.65" />
          <path
            d="M11.15 15.1h1.7v1.05h-1.7V15.1z"
            fill={accent}
            opacity="0.35"
          />
        </>
      )}
    </>
  );
}
