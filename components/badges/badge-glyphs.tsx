import type { ReactNode } from "react";

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
        <>
          <circle cx="8.5" cy="12" r="4.2" stroke={c} strokeWidth="2.6" fill="none" />
          <circle cx="15.5" cy="12" r="4.2" stroke={c} strokeWidth="2.6" fill="none" />
          <path d="M11.2 12h1.6" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
        </>
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
          <circle cx="12" cy="15" r="6.5" stroke={c} strokeWidth="2.6" fill="none" />
          <path d="M12 8.5V5M8.5 6.5h7" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="12" cy="15" r="2.2" fill={c} />
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
          <circle cx="12" cy="12" r="8.5" stroke={c} strokeWidth="2.6" fill="none" />
          <path d="M12 7.5v9M7.5 12h9" stroke={c} strokeWidth="2.8" strokeLinecap="round" />
        </>
      );

    case "community-choice":
      return (
        <>
          <path d="M12 4 14.5 10H21l-5.8 4.2 2.2 6.3L12 16.8 6.1 20.5l2.2-6.3L2.5 10h6.5L12 4z" fill={c} />
        </>
      );

    case "og":
      return (
        <>
          <rect x="4.1" y="3.2" width="2.1" height="17.2" rx="0.55" fill={c} opacity="0.5" />
          <circle cx="5.15" cy="3.2" r="1.35" fill={c} />
          <path d="M6.4 5.8v12.4L20.2 12 6.4 5.8z" fill={c} />
          <path
            d="M6.4 5.8v12.4L20.2 12 6.4 5.8z"
            fill="none"
            stroke="#000"
            strokeOpacity="0.2"
            strokeWidth="0.75"
            strokeLinejoin="round"
          />
          <path d="M6.4 5.8l6.8 3.4v5.6l-6.8 3.4" fill={hi} opacity="0.28" />
          <text
            x="12.6"
            y="13.6"
            textAnchor="middle"
            fill="#120f08"
            fillOpacity="0.88"
            fontSize="7.2"
            fontWeight="900"
            fontFamily="Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif"
            letterSpacing="-0.35"
          >
            OG
          </text>
        </>
      );

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
          <path d="M13 17.5h6" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
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
          <path d="M7 8.5H5a1.5 1.5 0 0 0-1.5 1.5V12H7V8.5zM19 8.5h-1.5a2 2 0 0 0-2 2V12H19V8.5z" fill={c} />
          <path d="M8 8.5h8v4.5a4 4 0 0 1-8 0V8.5z" fill={c} />
          <path d="M9.5 17h5v3h-5v-3zM12 14.5v2.5" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
        </>
      );

    case "runner-up":
      return (
        <>
          <circle cx="12" cy="14" r="6" fill={c} />
          <path d="M12 6.5V4M9 4h6" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
          <text x="12" y="16.5" textAnchor="middle" fill="#000" fillOpacity="0.3" fontSize="7" fontWeight="900" fontFamily="system-ui,sans-serif">2</text>
        </>
      );

    case "finalist":
      return (
        <>
          <path d="M5 18h14v-3H5v3z" fill={c} />
          <path d="M8 15V9h3v6H8zM13 15V6h3v9h-3z" fill={c} />
        </>
      );

    case "tournament-winner":
      return (
        <>
          <path d="M7.5 5h9l-.8 7.5H8.3L7.5 5z" fill={c} />
          <path d="M8.5 18.5h7M12 15.5v3" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M9.5 12.5h5" stroke={c} strokeWidth="2" strokeLinecap="round" />
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
          <path d="M12 3 6.5 12.5h11L12 3z" fill={c} />
          <rect x="9.5" y="12.5" width="5" height="7.5" fill={c} />
          <circle cx="12" cy="9" r="1.2" fill={hi} />
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
