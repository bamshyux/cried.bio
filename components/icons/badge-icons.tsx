import type { BadgeRarity } from "@/lib/types/badge";
import { RARITY_STYLES } from "@/lib/types/badge";

type IconProps = { size?: number; color?: string; className?: string };

function Svg({ size = 16, children, className = "" }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      {children}
    </svg>
  );
}

const paths: Record<string, (p: IconProps) => React.ReactNode> = {
  verified: (p) => (
    <Svg {...p}>
      <path d="M9 12.5 11 14.5 15.5 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 3l2.2 1.1 2.5-.3 1.1 2.2 2.2 1.1-.3 2.5 1.1 2.2-2.2 1.1-.3 2.5-2.5-.3-2.2 1.1-2.2L12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </Svg>
  ),
  developer: (p) => (
    <Svg {...p}>
      <path d="M8 9 4 12l4 3M16 9l4 3-4 3M14 6l-4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  staff: (p) => (
    <Svg {...p}>
      <rect x="4" y="8" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 8V6a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </Svg>
  ),
  moderator: (p) => (
    <Svg {...p}>
      <path d="M12 3 4 7v6c0 4.5 3.5 7.5 8 8 4.5-.5 8-3.5 8-8V7l-8-4z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </Svg>
  ),
  creator: (p) => (
    <Svg {...p}>
      <path d="M12 3v12M8 7h8M6 21h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  ),
  partner: (p) => (
    <Svg {...p}>
      <path d="m7 7 5 5M17 7l-5 5M12 12v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  ),
  premium: (p) => (
    <Svg {...p}>
      <path d="M5 8l7-4 7 4-7 13L5 8z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </Svg>
  ),
  founder: (p) => (
    <Svg {...p}>
      <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17l-6.5 4.5 2.5-7.5-6-4.5h7.5L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </Svg>
  ),
  donor: (p) => (
    <Svg {...p}>
      <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </Svg>
  ),
  supporter: (p) => (
    <Svg {...p}>
      <path d="M12 21s-6-4.35-6-10a3.5 3.5 0 0 1 6-2 3.5 3.5 0 0 1 6 2c0 5.65-6 10-6 10z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
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
      <path d="M6 18 12 6l6 12H6z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </Svg>
  ),
  "community-choice": (p) => (
    <Svg {...p}>
      <path d="M12 3 9 9H3l5.5 4-2 8L12 16l5.5 5-2-8L21 9h-6l-3-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </Svg>
  ),
  og: (p) => (
    <Svg {...p}>
      <path d="M4 12h16M12 4v16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  ),
  "year-one": (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </Svg>
  ),
  "views-100": (p) => (
    <Svg {...p}><text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="9" fontWeight="700">100</text></Svg>
  ),
  "views-1k": (p) => (
    <Svg {...p}><text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="9" fontWeight="700">1K</text></Svg>
  ),
  "views-10k": (p) => (
    <Svg {...p}><text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="700">10K</text></Svg>
  ),
  "views-100k": (p) => (
    <Svg {...p}><text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="7" fontWeight="700">100K</text></Svg>
  ),
  champion: (p) => (
    <Svg {...p}>
      <path d="M6 9H4a2 2 0 0 0-2 2v2h6V9zM20 9h-2a2 2 0 0 0-2 2v2h6v-2a2 2 0 0 0-2-2zM8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M8 9h8v5a4 4 0 0 1-8 0V9z" stroke="currentColor" strokeWidth="1.75" />
    </Svg>
  ),
  "runner-up": (p) => (
    <Svg {...p}>
      <circle cx="12" cy="13" r="6" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 7V4M9 4h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </Svg>
  ),
  finalist: (p) => (
    <Svg {...p}>
      <path d="M12 4 8 10h8l-4-6zM6 10v10h12V10H6z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </Svg>
  ),
  "tournament-winner": (p) => (
    <Svg {...p}>
      <path d="M8 21h8M12 17v4M7 4h10l-1 8H8L7 4z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
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
      <path d="M12 3 6 14h12L12 3zM9 14h6v7H9v-7z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
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
}: {
  slug: string;
  iconUrl?: string | null;
  size?: number;
  color?: string;
  className?: string;
  monochrome?: boolean;
}) {
  if (iconUrl && monochrome) {
    return (
      <span
        className={`inline-block shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          WebkitMaskImage: `url(${iconUrl})`,
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskImage: `url(${iconUrl})`,
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
        }}
        aria-hidden
      />
    );
  }

  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        width={size}
        height={size}
        className={`inline-block shrink-0 object-contain ${className}`}
        aria-hidden
      />
    );
  }

  const Icon = paths[slug] ?? paths.custom;
  return (
    <span className={`inline-flex shrink-0 ${className}`} style={{ color }}>
      {Icon({ size, color, className })}
    </span>
  );
}

export function rarityClass(rarity: BadgeRarity) {
  return RARITY_STYLES[rarity] ?? RARITY_STYLES.common;
}
