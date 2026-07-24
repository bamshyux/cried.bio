import type { BadgeRarity } from "@/lib/types/badge";
import { RARITY_VISUALS } from "@/lib/badges/rarity-visuals";
import { VerifiedBadgeIcon } from "@/components/badges/verified-badge-icon";
import { OgBadgeMark } from "@/components/badges/og-badge-mark";

type IconProps = { size?: number; color?: string; className?: string; premium?: boolean };

function Svg({ size = 16, children, className = "" }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
      shapeRendering="geometricPrecision"
    >
      {children}
    </svg>
  );
}

const paths: Record<string, (p: IconProps) => React.ReactNode> = {
  verified: (p) => <VerifiedBadgeIcon size={p.size ?? 14} className={p.className} />,
  developer: (p) => (
    <Svg {...p}>
      <path
        d="M8.5 9 5 12l3.5 3M15.5 9 19 12l-3.5 3M14 7 10 17"
        stroke="currentColor"
        strokeWidth={p.premium ? 2.4 : 2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
  staff: (p) => (
    <Svg {...p}>
      <rect x="4" y="8" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 8V6a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  ),
  moderator: (p) => (
    <Svg {...p}>
      <path d="M12 3 4 7v6c0 4.5 3.5 7.5 8 8 4.5-.5 8-3.5 8-8V7l-8-4z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </Svg>
  ),
  creator: (p) => (
    <Svg {...p}>
      <rect x="4" y="8" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="13.5" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M9 5h6v3H9V5z" stroke="currentColor" strokeWidth="1.85" strokeLinejoin="round" />
      <circle cx="12" cy="13.5" r="1.1" fill="currentColor" />
    </Svg>
  ),
  partner: (p) => (
    <Svg {...p}>
      <path
        d="M12 2.5 3.5 6.5v7c0 5.2 4 8.8 8.5 9.5 4.5-.7 8.5-4.3 8.5-9.5v-7L12 2.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M12 7.2 14.1 11.2 18.4 11.6 15 14.2 16 18.2 12 16.2 8 18.2 9 14.2 5.6 11.6 9.9 11.2 12 7.2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 4.8v1.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
    </Svg>
  ),
  premium: (p) => (
    <Svg {...p}>
      <path
        d="M5.5 8.5 12 4.5l6.5 4v8.5L12 21.5 5.5 17V8.5z"
        fill="currentColor"
        fillOpacity={p.premium ? 0.35 : 0.2}
        stroke="currentColor"
        strokeWidth={p.premium ? 1.6 : 1.85}
        strokeLinejoin="round"
      />
      <path d="M12 4.5v17" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.35" />
    </Svg>
  ),
  founder: (p) => (
    <Svg {...p}>
      <path
        d="M12 2.5 14.2 8.8H21l-5.8 4.2 2.2 6.5L12 17.8 6.6 19.5l2.2-6.5L3 8.8h6.8L12 2.5z"
        fill="currentColor"
        fillOpacity={p.premium ? 0.4 : 0.24}
        stroke="currentColor"
        strokeWidth={p.premium ? 1.35 : 1.5}
        strokeLinejoin="round"
      />
    </Svg>
  ),
  donor: (p) => (
    <Svg {...p}>
      <rect x="5" y="10" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <path d="M5 10h14M12 10V7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 7.5c-1.2-2-3.3-1.5-3.3.4.1 1.2 1.4 1.8 3.3 3.1 1.9-1.3 3.2-1.9 3.3-3.1 0-1.9-2.1-2.4-3.3-.4z" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </Svg>
  ),
  supporter: (p) => (
    <Svg {...p}>
      <rect x="8.5" y="3.2" width="7" height="2.2" rx="0.7" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="4.2" r="1.15" fill="currentColor" fillOpacity="0.45" />
      <path
        d="M12 21.2S4.8 15.8 4.8 10.8a4 4 0 0 1 7.2-2.2A4 4 0 0 1 19.2 10.8c0 5-7.2 10.4-7.2 10.4z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M12 18.8S8.2 15.2 8.2 12a2.8 2.8 0 0 1 3.8 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" fill="none" opacity="0.55" />
    </Svg>
  ),
  helper: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </Svg>
  ),
  "bug-hunter": (p) => (
    <Svg {...p}>
      <ellipse cx="12" cy="14" rx="5" ry="6" stroke="currentColor" strokeWidth="1.75" />
      <path d="M7 10H4M20 10h-3M7 14H4M20 14h-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </Svg>
  ),
  contributor: (p) => (
    <Svg {...p}>
      <path d="M12 2.6 19.4 6.8v8.6L12 21.4 4.6 15.4V6.8L12 2.6z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <circle cx="12" cy="7.8" r="2.1" fill="currentColor" fillOpacity="0.45" />
      <circle cx="8.2" cy="15.8" r="2.1" fill="currentColor" fillOpacity="0.45" />
      <circle cx="15.8" cy="15.8" r="2.1" fill="currentColor" fillOpacity="0.45" />
      <path d="M12 9.9v3.2M12 13.1 8.2 15.8M12 13.1 15.8 15.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    </Svg>
  ),
  "community-choice": (p) => (
    <Svg {...p}>
      <circle cx="12" cy="10" r="4.5" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7.2v2.8l1.8 1" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 18.5 12 16l3.5 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 21h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  ),
  gifter: (p) => (
    <Svg {...p}>
      <path d="M12 5.2C10.2 3.4 7 3.8 7 6.4c0 2 2.4 3.1 5 3.5V5.2z" fill="currentColor" />
      <path d="M12 5.2c1.8-1.8 5-1.4 5 1.2 0 2-2.4 3.1-5 3.5V5.2z" fill="currentColor" />
      <circle cx="12" cy="6.6" r="1.2" fill="currentColor" fillOpacity="0.45" />
      <rect x="5" y="10.2" width="14" height="2.6" rx="0.5" fill="currentColor" />
      <rect x="5.5" y="12.5" width="13" height="8.8" rx="1" fill="currentColor" />
      <rect x="11" y="10.2" width="2" height="11.1" fill="currentColor" fillOpacity="0.45" />
      <rect x="5.5" y="15.6" width="13" height="1.6" fill="currentColor" fillOpacity="0.35" />
    </Svg>
  ),
  og: (p) => (
    <Svg {...p}>
      <OgBadgeMark />
    </Svg>
  ),
  "year-one": (p) => (
    <Svg {...p}>
      <path d="M12 3.2 9.5 6.6h5L12 3.2z" fill="currentColor" />
      <rect x="8.8" y="6.6" width="6.4" height="2.1" rx="0.6" fill="currentColor" opacity="0.9" />
      <circle cx="12" cy="14.2" r="7.3" fill="currentColor" fillOpacity={p.premium ? 0.95 : 0.85} />
      <circle cx="12" cy="14.2" r="5.9" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />
      <rect x="10.2" y="10" width="3.6" height="8.5" rx="1.1" fill="currentColor" fillOpacity="0.45" />
      <rect x="10.2" y="10" width="3.6" height="2.3" rx="0.7" fill="currentColor" fillOpacity="0.25" />
      <path d="M5 14.2c1.3-2 3-3.1 4.8-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" opacity="0.75" />
      <path d="M19 14.2c-1.3-2-3-3.1-4.8-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" opacity="0.75" />
      <path d="M9.2 20 7.8 22.2l2.4-1.3M14.8 20l1.4 2.2-2.4-1.3" fill="currentColor" opacity="0.85" />
      <circle cx="18" cy="6.5" r="0.9" fill="currentColor" opacity="0.55" />
      <circle cx="6" cy="7" r="0.6" fill="currentColor" opacity="0.4" />
    </Svg>
  ),
  "followers-100": (p) => (
    <Svg {...p}>
      <circle cx="9" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.85" />
      <circle cx="15.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.85" />
      <path d="M5.5 18.5c0-2.8 1.8-4.5 3.5-4.5s3.5 1.7 3.5 4.5M12.5 18.5c0-2.2 1.5-3.5 3-3.5s3 1.3 3 3.5" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
      <path d="M16.5 8.5h3.5v3.5" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" />
      <text x="17.2" y="11.2" textAnchor="middle" fill="currentColor" fontSize="4.5" fontWeight="700">100</text>
    </Svg>
  ),
  "account-1yr": (p) => (
    <Svg {...p}>
      <rect x="5" y="6" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M5 10h14M9 4v3M15 4v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.5 14.5 11.3 16.3 15 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  "views-100": (p) => (
    <Svg {...p}>
      <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
      <text x="12" y="21" textAnchor="middle" fill="currentColor" fontSize="5.5" fontWeight="700">100</text>
    </Svg>
  ),
  "views-1k": (p) => (
    <Svg {...p}>
      <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
      <text x="12" y="21" textAnchor="middle" fill="currentColor" fontSize="5.5" fontWeight="700">1K</text>
    </Svg>
  ),
  "views-10k": (p) => (
    <Svg {...p}>
      <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
      <text x="12" y="21" textAnchor="middle" fill="currentColor" fontSize="5" fontWeight="700">10K</text>
    </Svg>
  ),
  "views-100k": (p) => (
    <Svg {...p}>
      <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
      <text x="12" y="21" textAnchor="middle" fill="currentColor" fontSize="4.5" fontWeight="700">100K</text>
    </Svg>
  ),
  champion: (p) => (
    <Svg {...p}>
      <path d="M8.8 8 6.8 4.2 9.8 4.2 10.8 8Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M15.2 8 17.2 4.2 14.2 4.2 13.2 8Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M9.5 7.2h5v2.2H9.5z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <circle cx="12" cy="14.8" r="6.9" stroke="currentColor" strokeWidth="1.75" opacity="0.45" />
      <circle cx="12" cy="14.8" r="6.4" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="14.8" r="4.7" stroke="currentColor" strokeWidth="1.25" opacity="0.55" />
      <path
        d="M12 11.4 13.1 13.7 15.7 14 13.7 15.6 14.4 18 12 16.6 9.6 18 10.3 15.6 8.3 14 10.9 13.7 12 11.4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </Svg>
  ),
  "runner-up": (p) => (
    <Svg {...p}>
      <path d="M8.8 8 6.8 4.2 9.8 4.2 10.8 8Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M15.2 8 17.2 4.2 14.2 4.2 13.2 8Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M9.5 7.2h5v2.2H9.5z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <circle cx="12" cy="14.8" r="6.9" stroke="currentColor" strokeWidth="1.75" opacity="0.45" />
      <circle cx="12" cy="14.8" r="6.4" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="14.8" r="4.7" stroke="currentColor" strokeWidth="1.25" opacity="0.55" />
      <text x="12" y="16.4" textAnchor="middle" fill="currentColor" fontSize="7.5" fontWeight="900" fontFamily="system-ui,sans-serif">
        2
      </text>
    </Svg>
  ),
  finalist: (p) => (
    <Svg {...p}>
      <path d="M8.8 8 6.8 4.2 9.8 4.2 10.8 8Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M15.2 8 17.2 4.2 14.2 4.2 13.2 8Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M9.5 7.2h5v2.2H9.5z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <circle cx="12" cy="14.8" r="6.9" stroke="currentColor" strokeWidth="1.75" opacity="0.45" />
      <circle cx="12" cy="14.8" r="6.4" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="14.8" r="4.7" stroke="currentColor" strokeWidth="1.25" opacity="0.55" />
      <text x="12" y="16.4" textAnchor="middle" fill="currentColor" fontSize="7.5" fontWeight="900" fontFamily="system-ui,sans-serif">
        3
      </text>
    </Svg>
  ),
  "tournament-winner": (p) => (
    <Svg {...p}>
      <path d="M5.2 11.8a9 9 0 0 1 13.6 0" stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" />
      <path d="M7 10.2H5.6a2 2 0 0 0 0 4H7" stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" />
      <path d="M17 10.2h1.4a2 2 0 0 1 0 4H17" stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" />
      <path d="M7.2 10h9.6l-1 7.2H8.2L7.2 10z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path
        d="M12 7.8 12.55 9.2 14.05 9.2 12.85 10.1 13.3 11.5 12 10.65 10.7 11.5 11.15 10.1 9.95 9.2 11.45 9.2 12 7.8z"
        fill="currentColor"
        fillOpacity="0.45"
      />
      <path d="M8.2 17.2h7.6v2H8.2z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M9.8 19.2h4.4v2.8H9.8z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </Svg>
  ),
  "halloween-2026": (p) => (
    <Svg {...p}>
      <path d="M12 4c-3 0-5 2-5 5v3H5v2h14v-2h-2v-3c0-3-2-5-5-5z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="1" fill="currentColor" /><circle cx="14" cy="10" r="1" fill="currentColor" />
    </Svg>
  ),
  "christmas-2026": (p) => (
    <Svg {...p}>
      <path
        d="M12 2.8 13.4 6.2 16.8 6.2 14 8.2 15 11.5 12 9.5 9 11.5 10 8.2 7.2 6.2 10.6 6.2 12 2.8z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M12 6.8 9.2 11h5.6L12 6.8z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M12 9.8 7.8 14.8h8.4L12 9.8z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M12 12.8 6 19.5h12L12 12.8z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M10.1 19.5h3.8v2.5H10.1z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <circle cx="10.2" cy="13.2" r="0.95" fill="currentColor" fillOpacity="0.45" />
      <circle cx="14.2" cy="15.5" r="0.95" fill="currentColor" fillOpacity="0.45" />
      <circle cx="11.2" cy="17.8" r="0.85" fill="currentColor" fillOpacity="0.45" />
    </Svg>
  ),
  "new-year-2027": (p) => (
    <Svg {...p}>
      <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </Svg>
  ),
  "summer-2026": (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </Svg>
  ),
  custom: (p) => (
    <Svg {...p}>
      <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </Svg>
  ),
};

export function BadgeIcon({
  slug,
  iconUrl,
  size = 14,
  color = "currentColor",
  className = "",
  monochrome = false,
  sharp = false,
  premium = false,
}: {
  slug: string;
  iconUrl?: string | null;
  size?: number;
  color?: string;
  className?: string;
  monochrome?: boolean;
  sharp?: boolean;
  premium?: boolean;
}) {
  const glyphClass = sharp ? `bf-badge-glyph ${className}`.trim() : className;

  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className={`inline-block shrink-0 object-contain ${glyphClass}`}
        aria-hidden
      />
    );
  }

  const Icon = paths[slug] ?? paths.custom;
  return (
    <span className={`inline-flex shrink-0 ${glyphClass}`} style={{ color }}>
      {Icon({ size, color, className: glyphClass, premium })}
    </span>
  );
}

export function rarityClass(rarity: BadgeRarity) {
  const visual = RARITY_VISUALS[rarity] ?? RARITY_VISUALS.common;
  return { label: visual.label, accent: visual.accent };
}
