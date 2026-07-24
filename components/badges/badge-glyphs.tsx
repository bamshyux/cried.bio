import type { ReactNode } from "react";
import { OgBadgeMarkFromColor } from "@/components/badges/og-badge-mark";

function MedallionRibbon({ c }: { c: string }) {
  return (
    <>
      <path d="M8.8 8 6.8 4.2 9.8 4.2 10.8 8Z" fill={c} />
      <path d="M15.2 8 17.2 4.2 14.2 4.2 13.2 8Z" fill={c} />
      <path d="M9.5 7.2h5v2.2H9.5z" fill={c} />
    </>
  );
}

function MedallionDisc({
  c,
  hi,
  cy = 14.8,
  r = 6.4,
}: {
  c: string;
  hi: string;
  cy?: number;
  r?: number;
}) {
  return (
    <>
      <circle cx="12" cy={cy} r={r + 0.5} fill="none" stroke={hi} strokeWidth="0.9" opacity="0.35" />
      <circle cx="12" cy={cy} r={r} fill={c} />
      <circle cx="12" cy={cy} r={r - 1.7} fill="none" stroke={hi} strokeWidth="1.3" />
      <circle cx="12" cy={cy} r={r - 3.1} fill="none" stroke={hi} strokeWidth="0.8" opacity="0.45" />
    </>
  );
}

function ShieldBadge({ c, hi, children }: { c: string; hi: string; children: ReactNode }) {
  return (
    <>
      <path d="M12 2.5 3.5 6.5v7c0 5.2 4 8.8 8.5 9.5 4.5-.7 8.5-4.3 8.5-9.5v-7L12 2.5z" fill={c} />
      <path d="M12 2.5 3.5 6.5v7c0 5.2 4 8.8 8.5 9.5 4.5-.7 8.5-4.3 8.5-9.5v-7L12 2.5z" fill={hi} opacity="0.14" />
      <path d="M12 4.8v1.8" stroke={hi} strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
      {children}
    </>
  );
}

/**
 * Icon-first badge glyphs — 24×24 viewBox, readable at 16×16 by silhouette.
 * Bold filled shapes, no circular backgrounds.
 */
export function BadgeGlyph({ slug, color }: { slug: string; color: string }): ReactNode {
  const c = color;
  const hi = "rgba(255,255,255,0.35)";

  switch (slug) {
    case "verified":
      return (
        <path
          d="M6.5 12.5 10 16 17.5 8"
          stroke={c}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      );

    case "developer":
      return (
        <>
          <path d="M8.5 6.5 4.5 12l4 5.5" stroke={c} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M15.5 6.5 19.5 12l-4 5.5" stroke={c} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M14 5.5 10 18.5" stroke={c} strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </>
      );

    case "staff":
      return (
        <>
          <rect x="10.5" y="11" width="3" height="9.5" rx="1.2" fill={c} />
          <rect x="5.5" y="5.5" width="13" height="5" rx="1.5" fill={c} />
          <rect x="7" y="4" width="10" height="2.5" rx="1" fill={c} />
        </>
      );

    case "moderator":
      return (
        <>
          <path d="M12 3.5 5 7v5.5c0 4.2 3.2 7.2 7 7.8 3.8-.6 7-3.6 7-7.8V7L12 3.5z" fill={c} />
          <path d="M12 3.5 5 7v5.5c0 4.2 3.2 7.2 7 7.8 3.8-.6 7-3.6 7-7.8V7L12 3.5z" fill={hi} transform="scale(0.55) translate(9.5 9.5)" />
        </>
      );

    case "creator":
      return (
        <>
          <rect x="4" y="8" width="16" height="11" rx="2.2" fill={c} />
          <path d="M9.5 8V6.5a2.5 2.5 0 0 1 5 0V8" stroke={c} strokeWidth="0" fill={c} />
          <rect x="8.5" y="5.5" width="7" height="2.8" rx="1" fill={c} />
          <circle cx="12" cy="13.5" r="3.2" fill="#000" fillOpacity="0.22" />
          <circle cx="12" cy="13.5" r="2" fill={hi} />
        </>
      );

    case "partner":
      return (
        <ShieldBadge c={c} hi={hi}>
          <path
            d="M12 7.2 14.1 11.2 18.4 11.6 15 14.2 16 18.2 12 16.2 8 18.2 9 14.2 5.6 11.6 9.9 11.2 12 7.2z"
            fill="#000"
            fillOpacity="0.3"
          />
          <path
            d="M12 7.2 14.1 11.2 18.4 11.6 15 14.2 16 18.2 12 16.2 8 18.2 9 14.2 5.6 11.6 9.9 11.2 12 7.2z"
            fill={hi}
            opacity="0.22"
          />
        </ShieldBadge>
      );

    case "premium":
      return (
        <>
          <path d="M12 3.5 18.5 9 12 20.5 5.5 9 12 3.5z" fill={c} />
          <path d="M12 3.5 15 9 12 20.5 9 9 12 3.5z" fill={hi} opacity="0.45" />
        </>
      );

    case "founder":
      return (
        <>
          <path d="M4 17h16v-2.5l-2.5-5.5-3.5 2.5L12 8.5 9.5 11.5 6 9 4 14.5V17z" fill={c} />
          <rect x="4" y="17" width="16" height="2.5" rx="0.5" fill={c} />
          <circle cx="12" cy="7.5" r="1.6" fill={c} />
        </>
      );

    case "donor":
      return (
        <path
          d="M12 20.5S4.5 15.5 4.5 10a4.2 4.2 0 0 1 7.5-2.5A4.2 4.2 0 0 1 19.5 10c0 5.5-7.5 10.5-7.5 10.5z"
          fill={c}
        />
      );

    case "supporter":
      return (
        <>
          <MedallionRibbon c={c} />
          <MedallionDisc c={c} hi={hi} />
          <path
            d="M12 17.5S7.8 14.2 7.8 11a2.6 2.6 0 0 1 4.2 0 2.6 2.6 0 0 1 4.2 0c0 3.2-4.2 6.5-4.2 6.5z"
            fill="#000"
            fillOpacity="0.3"
          />
          <path
            d="M12 17.5S7.8 14.2 7.8 11a2.6 2.6 0 0 1 4.2 0 2.6 2.6 0 0 1 4.2 0c0 3.2-4.2 6.5-4.2 6.5z"
            fill={hi}
            opacity="0.18"
          />
        </>
      );

    case "helper":
      return (
        <>
          <circle cx="12" cy="8" r="3.5" fill={c} />
          <path d="M5 19.5c0-3.8 3.1-6 7-6s7 2.2 7 6" fill={c} />
        </>
      );

    case "bug-hunter":
      return (
        <>
          <ellipse cx="12" cy="13.5" rx="5.5" ry="6.5" fill={c} />
          <path d="M6.5 11H4M20 11h-2.5M6.5 14.5H4M20 14.5h-2.5M12 5.5V3.5" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M9 7.5 7 5.5M15 7.5l2-2" stroke={c} strokeWidth="2" strokeLinecap="round" />
        </>
      );

    case "contributor":
      return (
        <>
          <MedallionRibbon c={c} />
          <MedallionDisc c={c} hi={hi} />
          <path
            d="M13.4 11.6h2.1v1.4a1 1 0 1 0 0 2H13.4v2h-1.6a1 1 0 1 1-2 0v-2H8.5a1 1 0 1 1 0-2h1.3v-1.4h1.6a1 1 0 1 1 2 0v1.4z"
            fill="#000"
            fillOpacity="0.32"
          />
          <path
            d="M13.4 11.6h2.1v1.4a1 1 0 1 0 0 2H13.4v2h-1.6a1 1 0 1 1-2 0v-2H8.5a1 1 0 1 1 0-2h1.3v-1.4h1.6a1 1 0 1 1 2 0v1.4z"
            fill={hi}
            opacity="0.2"
          />
        </>
      );

    case "community-choice":
      return (
        <>
          <path d="M12 4 14.5 10H21l-5.8 4.2 2.2 6.3L12 16.8 6.1 20.5l2.2-6.3L2.5 10h6.5L12 4z" fill={c} />
        </>
      );

    case "gifter":
      return (
        <>
          <path d="M12 5.2C10.2 3.4 7 3.8 7 6.4c0 2 2.4 3.1 5 3.5V5.2z" fill={c} />
          <path d="M12 5.2c1.8-1.8 5-1.4 5 1.2 0 2-2.4 3.1-5 3.5V5.2z" fill={c} />
          <circle cx="12" cy="6.6" r="1.2" fill={hi} />
          <rect x="5" y="10.2" width="14" height="2.6" rx="0.5" fill={c} />
          <rect x="5.5" y="12.5" width="13" height="8.8" rx="1" fill={c} />
          <rect x="11" y="10.2" width="2" height="11.1" fill={hi} opacity="0.5" />
          <rect x="5.5" y="15.6" width="13" height="1.6" fill={hi} opacity="0.4" />
        </>
      );

    case "og":
      return <OgBadgeMarkFromColor color={c} />;

    case "year-one":
      return (
        <>
          <path d="M12 3.2 9.5 6.6h5L12 3.2z" fill={c} />
          <rect x="8.8" y="6.6" width="6.4" height="2.1" rx="0.6" fill={c} opacity="0.9" />
          <circle cx="12" cy="14.2" r="7.3" fill={c} />
          <circle cx="12" cy="14.2" r="5.9" fill="none" stroke={hi} strokeWidth="1" opacity="0.45" />
          <rect x="10.2" y="10" width="3.6" height="8.5" rx="1.1" fill="#000" fillOpacity="0.3" />
          <rect x="10.2" y="10" width="3.6" height="2.3" rx="0.7" fill={hi} opacity="0.5" />
          <path d="M5 14.2c1.3-2 3-3.1 4.8-3.5" stroke={c} strokeWidth="1.7" strokeLinecap="round" fill="none" opacity="0.75" />
          <path d="M19 14.2c-1.3-2-3-3.1-4.8-3.5" stroke={c} strokeWidth="1.7" strokeLinecap="round" fill="none" opacity="0.75" />
          <path d="M9.2 20 7.8 22.2l2.4-1.3M14.8 20l1.4 2.2-2.4-1.3" fill={c} opacity="0.85" />
          <circle cx="18" cy="6.5" r="0.9" fill={hi} opacity="0.8" />
          <circle cx="6" cy="7" r="0.6" fill={hi} opacity="0.6" />
        </>
      );

    case "followers-100":
      return (
        <>
          <circle cx="9" cy="10" r="2.8" fill={c} />
          <path d="M4.5 18c0-2.8 2-4.5 4.5-4.5s4.5 1.7 4.5 4.5" fill={c} />
          <circle cx="16" cy="10.5" r="2.2" fill={c} opacity="0.75" />
          <path d="M11.5 18c0-2.2 1.3-3.5 4.5-3.5s4.5 1.3 4.5 3.5" fill={c} opacity="0.75" />
        </>
      );

    case "account-1yr":
      return (
        <>
          <rect x="4" y="6" width="16" height="14" rx="2" fill={c} />
          <path d="M4 10h16M8.5 4v3M15.5 4v3" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.25" />
          <path d="M9 15l2 2 4-4.5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.35" fill="none" />
        </>
      );

    case "views-100":
    case "views-1k":
    case "views-10k":
    case "views-100k":
      return (
        <>
          <path d="M2.5 12s3.8-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.8 6.5-9.5 6.5S2.5 12 2.5 12z" fill={c} />
          <circle cx="12" cy="12" r="2.8" fill="#000" fillOpacity="0.2" />
          {slug === "views-1k" && <path d="M12 5.5v2M12 16.5v2" stroke={c} strokeWidth="2" strokeLinecap="round" />}
          {slug === "views-10k" && (
            <>
              <path d="M12 5.5v2M12 16.5v2M5.5 12h2M16.5 12h2" stroke={c} strokeWidth="2" strokeLinecap="round" />
            </>
          )}
          {slug === "views-100k" && (
            <path d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2M6.8 6.8l1.4 1.4M15.8 15.8l1.4 1.4M6.8 17.2l1.4-1.4M15.8 8.2l1.4-1.4" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
          )}
        </>
      );

    case "champion":
      return (
        <>
          <MedallionRibbon c={c} />
          <MedallionDisc c={c} hi={hi} />
          <path
            d="M12 11.4 13.1 13.7 15.7 14 13.7 15.6 14.4 18 12 16.6 9.6 18 10.3 15.6 8.3 14 10.9 13.7 12 11.4z"
            fill="#000"
            fillOpacity="0.28"
          />
        </>
      );

    case "runner-up":
      return (
        <>
          <MedallionRibbon c={c} />
          <MedallionDisc c={c} hi={hi} />
          <text x="12" y="16.4" textAnchor="middle" fill="#000" fillOpacity="0.3" fontSize="7.5" fontWeight="900" fontFamily="system-ui,sans-serif">
            2
          </text>
        </>
      );

    case "finalist":
      return (
        <>
          <MedallionRibbon c={c} />
          <MedallionDisc c={c} hi={hi} />
          <text x="12" y="16.4" textAnchor="middle" fill="#000" fillOpacity="0.3" fontSize="7.5" fontWeight="900" fontFamily="system-ui,sans-serif">
            3
          </text>
        </>
      );

    case "tournament-winner":
      return (
        <>
          <MedallionRibbon c={c} />
          <MedallionDisc c={c} hi={hi} />
          <path d="M10 10.8 12 9.2 14 10.8" stroke={hi} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.75" />
          <path d="M9.6 11h4.8l-.5 4.2h-3.8L9.6 11z" fill="#000" fillOpacity="0.32" />
          <rect x="8.8" y="15.2" width="6.4" height="1.5" rx="0.4" fill="#000" fillOpacity="0.32" />
          <rect x="10.4" y="16.7" width="3.2" height="1.8" rx="0.4" fill="#000" fillOpacity="0.32" />
          <rect x="8.1" y="11.8" width="1.3" height="2.8" rx="0.5" fill="#000" fillOpacity="0.25" />
          <rect x="14.6" y="11.8" width="1.3" height="2.8" rx="0.5" fill="#000" fillOpacity="0.25" />
          <path
            d="M12 9.8 12.35 10.65 13.25 10.65 12.55 11.15 12.85 12 12 11.55 11.15 12 11.45 11.15 10.75 10.65 11.65 10.65 12 9.8z"
            fill={hi}
          />
        </>
      );

    case "halloween-2026":
      return (
        <>
          <path d="M12 4.5c-3 0-5 2-5 4.5v3H5v2h14v-2h-2v-3c0-2.5-2-4.5-5-4.5z" fill={c} />
          <rect x="5" y="14" width="14" height="5.5" rx="1" fill={c} />
          <circle cx="10" cy="11" r="1" fill="#000" fillOpacity="0.35" />
          <circle cx="14" cy="11" r="1" fill="#000" fillOpacity="0.35" />
        </>
      );

    case "christmas-2026":
      return (
        <>
          <MedallionRibbon c={c} />
          <MedallionDisc c={c} hi={hi} />
          <path
            d="M12 9.2 12.35 10.05 13.25 10.05 12.55 10.55 12.85 11.4 12 10.95 11.15 11.4 11.45 10.55 10.75 10.05 11.65 10.05 12 9.2z"
            fill={hi}
          />
          <path d="M12 10.8 9.2 14.2h5.6L12 10.8z" fill="#000" fillOpacity="0.32" />
          <path d="M12 12.8 8 17h8L12 12.8z" fill="#000" fillOpacity="0.32" />
          <rect x="11" y="17" width="2" height="2.4" fill="#000" fillOpacity="0.32" />
          <circle cx="8.4" cy="12.4" r="0.75" fill={hi} opacity="0.65" />
          <circle cx="15.6" cy="13.2" r="0.75" fill={hi} opacity="0.65" />
          <circle cx="9.8" cy="16.2" r="0.65" fill={hi} opacity="0.5" />
          <circle cx="14.2" cy="16.5" r="0.65" fill={hi} opacity="0.5" />
        </>
      );

    case "new-year-2027":
      return (
        <>
          <path d="M8 5h8l-1 4H9L8 5zM6 9h12v2H6V9zM7 11h10v8H7v-8z" fill={c} />
          <path d="M9 14h2v3H9v-3zM13 13h2v4h-2v-4z" fill={hi} opacity="0.5" />
        </>
      );

    case "summer-2026":
      return (
        <>
          <circle cx="12" cy="12" r="5" fill={c} />
          <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.8 5.8l1.8 1.8M16.4 16.4l1.8 1.8M5.8 18.2l1.8-1.8M16.4 7.6l1.8-1.8" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
        </>
      );

    default:
      return (
        <path
          d="M12 3.5l2.1 6.5H21l-5.4 3.9 2.1 6.5L12 16.8 6.2 20.4l2.1-6.5L3 10h6.9L12 3.5z"
          fill={c}
        />
      );
  }
}
