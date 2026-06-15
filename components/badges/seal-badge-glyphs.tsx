import type { ReactNode } from "react";

const S = {
  stroke: "#ffffff",
  fill: "#ffffff",
  sw: 2.6,
  cap: "round" as const,
  join: "round" as const,
};

/** Inner cartoony glyphs (24×24) — rendered in white on the colored seal. */
export function SealBadgeGlyph({ slug }: { slug: string }): ReactNode {
  switch (slug) {
    case "verified":
      return (
        <path
          d="M7.5 12.2 10.5 15.2 16.8 8.8"
          stroke={S.stroke}
          strokeWidth="3.2"
          strokeLinecap={S.cap}
          strokeLinejoin={S.join}
          fill="none"
        />
      );
    case "developer":
      return (
        <path d="M7 8.5 4 12l3 3.5M17 8.5 20 12l-3 3.5M14 6.5 10 17.5" stroke={S.stroke} strokeWidth={S.sw} strokeLinecap={S.cap} strokeLinejoin={S.join} />
      );
    case "staff":
      return (
        <>
          <rect x="6" y="10" width="12" height="9" rx="2" fill={S.fill} fillOpacity="0.95" />
          <path d="M9 10V8a3 3 0 0 1 6 0v2" stroke={S.stroke} strokeWidth={S.sw} strokeLinecap={S.cap} fill="none" />
        </>
      );
    case "moderator":
      return <path d="M12 3.5 5.5 7v5.8c0 3.8 2.9 6.4 6.5 7 3.6-.6 6.5-3.2 6.5-7V7L12 3.5z" fill={S.fill} fillOpacity="0.92" />;
    case "creator":
      return (
        <>
          <rect x="5.5" y="9" width="13" height="10" rx="2" fill={S.fill} fillOpacity="0.9" />
          <circle cx="12" cy="14" r="2.8" fill="#000" fillOpacity="0.35" />
          <path d="M9.5 6.5h5v2.5h-5V6.5z" fill={S.fill} />
        </>
      );
    case "partner":
      return (
        <>
          <path d="M8 12.5a2.6 2.6 0 1 0 0-5.2h1.4M16 12.5a2.6 2.6 0 1 1 0-5.2h-1.4" stroke={S.stroke} strokeWidth={S.sw} strokeLinecap={S.cap} />
          <path d="M10.8 12.5h2.4M9.8 10.5 12 8.5 14.2 10.5" stroke={S.stroke} strokeWidth={S.sw} strokeLinecap={S.cap} strokeLinejoin={S.join} />
        </>
      );
    case "premium":
      return <path d="M5.5 9 12 5l6.5 4v7.5L12 20.5 5.5 16.5V9z" fill={S.fill} fillOpacity="0.95" />;
    case "founder":
      return <path d="M12 3 14.4 9.2H21l-5.6 4.1 2.1 6.2L12 16.8 6.5 19.5l2.1-6.2L3 9.2h6.6L12 3z" fill={S.fill} fillOpacity="0.95" />;
    case "donor":
      return (
        <>
          <rect x="5.5" y="10.5" width="13" height="8.5" rx="1.5" fill={S.fill} fillOpacity="0.9" />
          <path d="M12 8.2c-1-1.6-2.8-1.3-2.8.2.1 1 1.2 1.5 2.8 2.6 1.6-1.1 2.7-1.6 2.8-2.6 0-1.5-1.8-1.8-2.8-.2z" fill={S.fill} />
        </>
      );
    case "supporter":
      return (
        <>
          <path d="M5 10.5 8.8 8.8v8.4L5 15.5v-5z" fill={S.fill} fillOpacity="0.9" />
          <path d="M9 11h2.2c1.8 0 3.2 1.1 3.2 2.6S13 16.2 11.2 16.2H9" stroke={S.stroke} strokeWidth={S.sw} strokeLinecap={S.cap} fill="none" />
        </>
      );
    case "helper":
      return (
        <>
          <circle cx="12" cy="8.5" r="3.2" fill={S.fill} fillOpacity="0.92" />
          <path d="M5.5 19.5c0-3.2 2.8-5.2 6.5-5.2s6.5 2 6.5 5.2" fill={S.fill} fillOpacity="0.88" />
        </>
      );
    case "bug-hunter":
      return (
        <>
          <ellipse cx="12" cy="14" rx="4.8" ry="5.5" fill={S.fill} fillOpacity="0.9" />
          <path d="M7.5 10.5H5M19 10.5h-2.5M7.5 14H5M19 14h-2.5" stroke={S.stroke} strokeWidth="2.2" strokeLinecap={S.cap} />
        </>
      );
    case "contributor":
      return <path d="M6.5 17.5 12 6.5l5.5 11H6.5z" fill={S.fill} fillOpacity="0.92" />;
    case "community-choice":
      return (
        <>
          <circle cx="12" cy="10" r="3.8" fill={S.fill} fillOpacity="0.9" />
          <path d="M9 18.5 12 16l3 2.5M7.5 20.5h9" stroke={S.stroke} strokeWidth={S.sw} strokeLinecap={S.cap} />
        </>
      );
    case "og":
      return (
        <text x="12" y="15.5" textAnchor="middle" fill={S.fill} fontSize="8.5" fontWeight="900" fontFamily="system-ui,sans-serif">
          OG
        </text>
      );
    case "year-one":
      return (
        <text x="12" y="16.5" textAnchor="middle" fill={S.fill} fontSize="12" fontWeight="900" fontFamily="system-ui,sans-serif">
          1
        </text>
      );
    case "followers-100":
      return (
        <>
          <circle cx="9" cy="10" r="2.2" fill={S.fill} />
          <circle cx="15" cy="10.5" r="1.8" fill={S.fill} fillOpacity="0.85" />
          <path d="M5.5 17.5c0-2.4 1.6-3.8 3.5-3.8s3.5 1.4 3.5 3.8" fill={S.fill} fillOpacity="0.85" />
          <text x="17" y="17" textAnchor="middle" fill={S.fill} fontSize="5.5" fontWeight="800" fontFamily="system-ui,sans-serif">100</text>
        </>
      );
    case "account-1yr":
      return (
        <>
          <rect x="5.5" y="7" width="13" height="11" rx="1.8" fill={S.fill} fillOpacity="0.88" />
          <path d="M5.5 10h13M9 5v2.5M15 5v2.5M9.5 14l1.8 1.8 3.5-3.5" stroke="#000" strokeWidth="1.6" strokeLinecap={S.cap} strokeLinejoin={S.join} fill="none" strokeOpacity="0.35" />
        </>
      );
    case "views-100":
    case "views-1k":
    case "views-10k":
    case "views-100k":
      return (
        <>
          <path d="M3.5 12s3-5.5 8.5-5.5 8.5 5.5 8.5 5.5-3 5.5-8.5 5.5S3.5 12 3.5 12z" fill={S.fill} fillOpacity="0.88" />
          <circle cx="12" cy="12" r="2" fill="#000" fillOpacity="0.25" />
          <text x="12" y="20.5" textAnchor="middle" fill={S.fill} fontSize="5" fontWeight="800" fontFamily="system-ui,sans-serif">
            {slug === "views-100" ? "100" : slug === "views-1k" ? "1K" : slug === "views-10k" ? "10K" : "100K"}
          </text>
        </>
      );
    case "champion":
      return (
        <>
          <path d="M7 9H5.5a1.5 1.5 0 0 0-1.5 1.5v1.5h5.5V9zM18.5 9H17a2 2 0 0 0-2 2v1.5h5.5V9zM8.5 19.5h7M12 16.5v3" stroke={S.stroke} strokeWidth="2.2" strokeLinecap={S.cap} />
          <path d="M8.5 9h7v4.5a3.5 3.5 0 0 1-7 0V9z" fill={S.fill} fillOpacity="0.9" />
        </>
      );
    case "runner-up":
      return (
        <>
          <circle cx="12" cy="13.5" r="5.2" fill={S.fill} fillOpacity="0.9" />
          <path d="M12 7.5V5M9.5 5h5" stroke={S.stroke} strokeWidth={S.sw} strokeLinecap={S.cap} />
          <text x="12" y="15.5" textAnchor="middle" fill="#000" fillOpacity="0.35" fontSize="7" fontWeight="900">2</text>
        </>
      );
    case "finalist":
      return <path d="M12 4.5 8.5 10h7L12 4.5zM6.5 10.5v8.5h11v-8.5H6.5z" fill={S.fill} fillOpacity="0.92" />;
    case "tournament-winner":
      return <path d="M8.5 19.5h7M12 16v3.5M7.5 5h9l-1 7.5H8.5L7.5 5z" fill={S.fill} fillOpacity="0.92" stroke={S.stroke} strokeWidth="1.5" strokeLinejoin={S.join} />;
    case "halloween-2026":
      return (
        <>
          <path d="M12 5.5c-2.5 0-4.2 1.6-4.2 4v2.8H5v1.8h14v-1.8h-2.8V9.5c0-2.4-1.7-4-4.2-4z" fill={S.fill} fillOpacity="0.92" />
          <circle cx="10" cy="10.5" r="0.9" fill="#000" fillOpacity="0.4" />
          <circle cx="14" cy="10.5" r="0.9" fill="#000" fillOpacity="0.4" />
        </>
      );
    case "christmas-2026":
      return <path d="M12 4 7 13h10L12 4zM9.5 13h5v6.5h-5V13z" fill={S.fill} fillOpacity="0.92" />;
    case "new-year-2027":
      return (
        <>
          <path d="M12 4v3M12 17v3M4.5 12h3M16.5 12h3" stroke={S.stroke} strokeWidth={S.sw} strokeLinecap={S.cap} />
          <circle cx="12" cy="12" r="3.5" fill={S.fill} fillOpacity="0.9" />
        </>
      );
    case "summer-2026":
      return (
        <>
          <circle cx="12" cy="12" r="4" fill={S.fill} fillOpacity="0.9" />
          <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2" stroke={S.stroke} strokeWidth="2.2" strokeLinecap={S.cap} />
        </>
      );
    default:
      return <path d="M12 4.5l1.4 4.3h4.5l-3.6 2.6 1.4 4.3L12 13.1 8.3 15.7l1.4-4.3-3.6-2.6h4.5L12 4.5z" fill={S.fill} fillOpacity="0.92" />;
  }
}
