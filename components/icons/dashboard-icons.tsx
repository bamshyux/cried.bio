import { BRAND } from "@/lib/design/tokens";

type IconProps = { className?: string; size?: number };

const defaults = { className: "", size: 18 };

function Icon({ children, className, size }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size ?? defaults.size}
      height={size ?? defaults.size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconOverview(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </Icon>
  );
}

export function IconHome(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 10.5L12 4l8 6.5" />
      <path d="M6 9.5V19a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1V9.5" />
    </Icon>
  );
}

export function IconProfile(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </Icon>
  );
}

export function IconCustomize(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
      <circle cx="12" cy="12" r="4" />
      <path d="M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
    </Icon>
  );
}

export function IconBackground(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M21 15l-5-4-4 3-3-2-6 5" />
    </Icon>
  );
}

export function IconLayout(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 9v12" />
    </Icon>
  );
}

export function IconLinks(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M10 13a5 5 0 0 0 7.1 0l1.4-1.4a5 5 0 0 0-7.1-7.1L10 6" />
      <path d="M14 11a5 5 0 0 0-7.1 0L5.5 12.4a5 5 0 0 0 7.1 7.1L14 18" />
    </Icon>
  );
}

export function IconBadges(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7 1 5.3L12 14.8 7.1 16.6l1-5.3L4.3 7.6l5.3-.8L12 2z" />
    </Icon>
  );
}

export function IconMusic(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M9 18V6l10-2v12" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="16" r="2" />
    </Icon>
  );
}

export function IconEffects(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
      <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75L19 15z" />
    </Icon>
  );
}

export function IconAnalytics(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 17V11M12 17V7M16 17v-4" />
    </Icon>
  );
}

export function IconExplore(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
      <path d="M8 11h6M11 8v6" />
    </Icon>
  );
}

export function IconSettings(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </Icon>
  );
}

export function IconPresets(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3" y="5" width="18" height="5" rx="1.5" />
      <rect x="3" y="12" width="18" height="5" rx="1.5" />
      <path d="M8 7.5h8M8 14.5h5" />
    </Icon>
  );
}

export function IconExternal(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M14 5h5v5M10 14L19 5M19 14v5H5V5h5" />
    </Icon>
  );
}

export function IconEye(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}

export function IconCode(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M9 8l-4 4 4 4" />
      <path d="M15 8l4 4-4 4" />
    </Icon>
  );
}

export function IconGuestbook(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 5h16v12H7l-3 3V5z" />
      <path d="M8 10h8M8 13h5" />
    </Icon>
  );
}

export function IconEmbed(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M10 9.5v5l5-2.5-5-2.5z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconWidget(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </Icon>
  );
}

export function IconVideo(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M10 10.5v3l4-1.5-4-1.5z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconPremium(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6L12 2z" />
    </Icon>
  );
}

export function accentStyle() {
  return { color: BRAND.accent };
}
