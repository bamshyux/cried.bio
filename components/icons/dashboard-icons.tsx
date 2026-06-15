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

export function accentStyle() {
  return { color: BRAND.accent };
}
