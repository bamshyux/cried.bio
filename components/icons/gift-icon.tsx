"use client";

import { useId } from "react";

type GiftIconProps = {
  size?: number;
  className?: string;
  /** Minimal monochrome stroke icon for UI buttons */
  variant?: "minimal" | "accent";
};

export function GiftIcon({ size = 24, className = "", variant = "accent" }: GiftIconProps) {
  if (variant === "minimal") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden
      >
        <path
          d="M12 7v14M3 11h18M5 11V9.2c0-2.4 3.1-4.2 7-4.2s7 1.8 7 4.2V11"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="3"
          y="11"
          width="18"
          height="10"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinejoin="round"
        />
        <path
          d="M12 7c-1.6-2.1-5-1.8-5 1.1S9.8 11 12 11s5-0.1 5-2.9S13.6 4.9 12 7z"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  const uid = useId().replace(/:/g, "");
  const box = `gift-box-${uid}`;
  const lid = `gift-lid-${uid}`;
  const ribbon = `gift-ribbon-${uid}`;
  const bow = `gift-bow-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={box} x1="3" y1="12" x2="21" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a78bfa" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id={lid} x1="3" y1="6" x2="21" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ddd6fe" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id={ribbon} x1="12" y1="7" x2="12" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fb7185" />
          <stop offset="1" stopColor="#e11d48" />
        </linearGradient>
        <linearGradient id={bow} x1="7" y1="2" x2="17" y2="9" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fecdd3" />
          <stop offset="1" stopColor="#f43f5e" />
        </linearGradient>
      </defs>

      <rect x="3" y="12" width="18" height="9" rx="1.75" fill={`url(#${box})`} />
      <rect
        x="3"
        y="12"
        width="18"
        height="9"
        rx="1.75"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.75"
      />
      <path d="M3 11.25h18v1.75H3z" fill={`url(#${lid})`} />
      <path d="M3 8.75c0-2.2 4-3.75 9-3.75s9 1.55 9 3.75v2.5H3z" fill={`url(#${lid})`} />
      <path
        d="M3 8.75c0-2.2 4-3.75 9-3.75s9 1.55 9 3.75v2.5H3z"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="0.75"
      />
      <rect x="10" y="8.75" width="4" height="12.25" rx="0.75" fill={`url(#${ribbon})`} />
      <rect x="3" y="15" width="18" height="4" rx="0.75" fill={`url(#${ribbon})`} />
      <path
        d="M12 4.75C10 2.25 5.5 2.75 5.5 6c0 1.75 1.5 2.75 3 2.75H12zm0 0c2-2.5 6.5-2 6.5 1.25 0 1.75-1.5 2.75-3 2.75H12z"
        fill={`url(#${bow})`}
      />
      <circle cx="12" cy="5.25" r="1.35" fill="#fff" fillOpacity="0.92" />
    </svg>
  );
}
