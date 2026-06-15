import type {
  BackgroundType,
  CursorEffect,
  LinkAnimation,
  ParticleEffect,
  ProfileLayout,
  ProfileSettings,
  SettingsSection,
  UsernameEffect,
} from "@/lib/types/settings";
import { BRAND } from "@/lib/design/tokens";

export const DEFAULT_SETTINGS: Omit<
  ProfileSettings,
  "profile_id" | "created_at" | "updated_at"
> = {
  layout: "classic",
  accent_color: BRAND.accent,
  text_color: "#fafafa",
  background_color: "#090909",
  font_family: "inter",
  animated_gradient: false,
  gradient_colors: ["#090909", "#141414", "#1a1a1a"],
  glassmorphism: true,
  neon_glow: false,
  border_radius: 12,
  profile_opacity: 90,
  profile_blur: 16,
  background_type: "animated_gradient",
  background_image_url: null,
  background_video_url: null,
  particle_effect: null,
  overlay_opacity: 40,
  vignette: false,
  noise_texture: false,
  music_url: null,
  music_title: "",
  music_autoplay: false,
  music_loop: true,
  music_volume: 50,
  cursor_effect: "none",
  typing_bio: false,
  username_effect: "none",
  hover_animations: true,
  page_entrance: true,
  link_animation: "none",
  show_view_count: true,
  show_join_date: true,
  profile_status: "",
  profile_status_color: "",
  status_preset: "online",
  status_emoji: "",
  music_player_color: "",
  guestbook_enabled: false,
  guestbook_approval_required: true,
  show_follow_counts: true,
  show_activity: true,
  friends_visibility: "public",
  featured_link_id: null,
  show_badges: true,
  badge_display_limit: 5,
  badges_monochrome: false,
  badge_color: "#ffffff",
  links_monochrome: false,
  links_style: "buttons",
  profile_parallax: false,
};

export const LAYOUT_OPTIONS: {
  value: ProfileLayout;
  label: string;
  description: string;
  preview: string;
}[] = [
  { value: "classic", label: "Classic", description: "Banner header with avatar overlap", preview: "classic" },
  { value: "modern", label: "Modern", description: "Centered card, clean hierarchy", preview: "modern" },
  { value: "gaming", label: "Gaming", description: "Sharp edges, bold header strip", preview: "gaming" },
  { value: "portfolio", label: "Portfolio", description: "Side avatar with content grid", preview: "portfolio" },
  { value: "minimal", label: "Minimal", description: "Typography-first, no chrome", preview: "minimal" },
  { value: "stacked", label: "Stacked", description: "Banner with centered avatar below", preview: "stacked" },
  { value: "split", label: "Split", description: "Half banner panel, half content", preview: "split" },
  { value: "terminal", label: "Terminal", description: "Developer CLI prompt aesthetic", preview: "terminal" },
  { value: "compact", label: "Compact", description: "Dense header row, links first", preview: "compact" },
  { value: "card", label: "Card", description: "Small floating rounded card", preview: "card" },
  { value: "neon", label: "Neon", description: "Accent glow frame and highlights", preview: "neon" },
  { value: "magazine", label: "Magazine", description: "Bold headline with corner avatar", preview: "magazine" },
  { value: "bento", label: "Bento", description: "Grid tiles for profile sections", preview: "bento" },
];

export const FONT_OPTIONS = [
  { value: "inter", label: "Inter", css: "'Inter', sans-serif" },
  { value: "geist", label: "Geist", css: "var(--font-geist-sans), sans-serif" },
  { value: "helvetica", label: "Helvetica", css: "Helvetica, 'Helvetica Neue', Arial, sans-serif" },
  { value: "poppins", label: "Poppins", css: "'Poppins', sans-serif" },
  { value: "montserrat", label: "Montserrat", css: "'Montserrat', sans-serif" },
  { value: "roboto", label: "Roboto", css: "'Roboto', sans-serif" },
  { value: "orbitron", label: "Orbitron", css: "'Orbitron', sans-serif" },
  { value: "press-start", label: "Press Start 2P", css: "'Press Start 2P', cursive" },
  { value: "bebas", label: "Bebas Neue", css: "'Bebas Neue', sans-serif" },
] as const;

export const PARTICLE_OPTIONS: { value: ParticleEffect; label: string }[] = [
  { value: "snow", label: "Snow" },
  { value: "rain", label: "Rain" },
  { value: "stars", label: "Stars" },
  { value: "floating", label: "Floating Particles" },
  { value: "fireflies", label: "Fireflies" },
  { value: "matrix", label: "Matrix" },
  { value: "sakura", label: "Sakura Petals" },
  { value: "leaves", label: "Falling Leaves" },
  { value: "bubbles", label: "Bubbles" },
  { value: "starfield", label: "Starfield" },
];

export const CURSOR_EFFECT_OPTIONS: { value: CursorEffect; label: string }[] = [
  { value: "none", label: "None" },
  { value: "trail", label: "Trail" },
  { value: "glow", label: "Glow" },
  { value: "particles", label: "Particles" },
  { value: "sparkles", label: "Sparkles" },
];

export const USERNAME_EFFECT_OPTIONS: { value: UsernameEffect; label: string }[] = [
  { value: "none", label: "None" },
  { value: "glow", label: "Glow" },
  { value: "rainbow", label: "Rainbow" },
  { value: "wave", label: "Wave" },
  { value: "pulse", label: "Pulse" },
  { value: "gradient", label: "Gradient Text" },
];

export const LINK_ANIMATION_OPTIONS: { value: LinkAnimation; label: string }[] = [
  { value: "none", label: "None" },
  { value: "pulse", label: "Pulse" },
  { value: "bounce", label: "Bounce" },
  { value: "glow", label: "Glow" },
  { value: "slide", label: "Slide" },
];

export const BACKGROUND_TYPE_OPTIONS: { value: BackgroundType; label: string }[] = [
  { value: "solid", label: "Solid Color" },
  { value: "animated_gradient", label: "Animated Gradient" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video (MP4)" },
  { value: "particles", label: "Particle Effect" },
];

export function getFontCss(fontKey: string) {
  return FONT_OPTIONS.find((f) => f.value === fontKey)?.css ?? FONT_OPTIONS[0].css;
}

export function getGoogleFontsUrl(fontKey: string) {
  const map: Record<string, string> = {
    inter: "Inter:wght@400;500;600;700",
    poppins: "Poppins:wght@400;500;600;700",
    montserrat: "Montserrat:wght@400;500;600;700",
    roboto: "Roboto:wght@400;500;700",
    orbitron: "Orbitron:wght@400;700",
    "press-start": "Press+Start+2P",
    bebas: "Bebas+Neue",
  };
  const family = map[fontKey];
  if (!family) return null;
  return `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
}

export function mergeSettings(
  row: Partial<ProfileSettings> | null,
  profileId: string,
): ProfileSettings {
  const now = new Date().toISOString();
  const legacyCursor =
    (row as { cursor_trail?: boolean })?.cursor_trail && !row?.cursor_effect
      ? "trail"
      : undefined;
  const legacyUsername =
    (row as { username_glow?: boolean })?.username_glow && !row?.username_effect
      ? "glow"
      : undefined;

  return {
    profile_id: profileId,
    layout: row?.layout ?? DEFAULT_SETTINGS.layout,
    accent_color: row?.accent_color ?? DEFAULT_SETTINGS.accent_color,
    text_color: row?.text_color ?? DEFAULT_SETTINGS.text_color,
    background_color: row?.background_color ?? DEFAULT_SETTINGS.background_color,
    font_family: row?.font_family ?? DEFAULT_SETTINGS.font_family,
    animated_gradient: row?.animated_gradient ?? DEFAULT_SETTINGS.animated_gradient,
    gradient_colors: Array.isArray(row?.gradient_colors)
      ? row.gradient_colors
      : DEFAULT_SETTINGS.gradient_colors,
    glassmorphism: row?.glassmorphism ?? DEFAULT_SETTINGS.glassmorphism,
    neon_glow: row?.neon_glow ?? DEFAULT_SETTINGS.neon_glow,
    border_radius: row?.border_radius ?? DEFAULT_SETTINGS.border_radius,
    profile_opacity: row?.profile_opacity ?? DEFAULT_SETTINGS.profile_opacity,
    profile_blur: row?.profile_blur ?? DEFAULT_SETTINGS.profile_blur,
    background_type: row?.background_type ?? DEFAULT_SETTINGS.background_type,
    background_image_url: row?.background_image_url ?? null,
    background_video_url: row?.background_video_url ?? null,
    particle_effect: row?.particle_effect ?? null,
    overlay_opacity: row?.overlay_opacity ?? DEFAULT_SETTINGS.overlay_opacity,
    vignette: row?.vignette ?? DEFAULT_SETTINGS.vignette,
    noise_texture: row?.noise_texture ?? DEFAULT_SETTINGS.noise_texture,
    music_url: row?.music_url ?? null,
    music_title: row?.music_title ?? DEFAULT_SETTINGS.music_title,
    music_autoplay: row?.music_autoplay ?? DEFAULT_SETTINGS.music_autoplay,
    music_loop: row?.music_loop ?? DEFAULT_SETTINGS.music_loop,
    music_volume: row?.music_volume ?? DEFAULT_SETTINGS.music_volume,
    cursor_effect: (row?.cursor_effect ?? legacyCursor ?? DEFAULT_SETTINGS.cursor_effect) as CursorEffect,
    typing_bio: row?.typing_bio ?? DEFAULT_SETTINGS.typing_bio,
    username_effect: (row?.username_effect ?? legacyUsername ?? DEFAULT_SETTINGS.username_effect) as UsernameEffect,
    hover_animations: row?.hover_animations ?? DEFAULT_SETTINGS.hover_animations,
    page_entrance: row?.page_entrance ?? DEFAULT_SETTINGS.page_entrance,
    link_animation: row?.link_animation ?? DEFAULT_SETTINGS.link_animation,
    show_view_count: row?.show_view_count ?? DEFAULT_SETTINGS.show_view_count,
    show_join_date: row?.show_join_date ?? DEFAULT_SETTINGS.show_join_date,
    profile_status: row?.profile_status ?? DEFAULT_SETTINGS.profile_status,
    profile_status_color: row?.profile_status_color ?? DEFAULT_SETTINGS.profile_status_color,
    status_preset: (row?.status_preset ?? DEFAULT_SETTINGS.status_preset) as import("@/lib/types/settings").StatusPreset,
    status_emoji: row?.status_emoji ?? DEFAULT_SETTINGS.status_emoji,
    music_player_color: row?.music_player_color ?? DEFAULT_SETTINGS.music_player_color,
    guestbook_enabled: row?.guestbook_enabled ?? DEFAULT_SETTINGS.guestbook_enabled,
    guestbook_approval_required: row?.guestbook_approval_required ?? DEFAULT_SETTINGS.guestbook_approval_required,
    show_follow_counts: row?.show_follow_counts ?? DEFAULT_SETTINGS.show_follow_counts,
    show_activity: row?.show_activity ?? DEFAULT_SETTINGS.show_activity,
    friends_visibility: (row?.friends_visibility ?? DEFAULT_SETTINGS.friends_visibility) as "public" | "friends" | "private",
    featured_link_id: row?.featured_link_id ?? null,
    show_badges: row?.show_badges ?? DEFAULT_SETTINGS.show_badges,
    badge_display_limit: row?.badge_display_limit ?? DEFAULT_SETTINGS.badge_display_limit,
    badges_monochrome: row?.badges_monochrome ?? DEFAULT_SETTINGS.badges_monochrome,
    badge_color: row?.badge_color ?? DEFAULT_SETTINGS.badge_color,
    links_monochrome: row?.links_monochrome ?? DEFAULT_SETTINGS.links_monochrome,
    links_style: (row?.links_style ?? DEFAULT_SETTINGS.links_style) as import("@/lib/types/settings").LinksStyle,
    profile_parallax: row?.profile_parallax ?? DEFAULT_SETTINGS.profile_parallax,
    created_at: row?.created_at ?? now,
    updated_at: row?.updated_at ?? now,
  };
}

export function buildCardStyle(settings: ProfileSettings): Record<string, string | number | undefined> {
  const opacity = settings.profile_opacity / 100;
  const blur = settings.profile_blur;

  const base: Record<string, string | number | undefined> = {
    borderRadius: settings.border_radius,
    border: `1px solid rgba(255,255,255,0.06)`,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  };

  if (settings.glassmorphism) {
    return {
      ...base,
      backgroundColor: `rgba(20, 20, 20, ${opacity * 0.85})`,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
    };
  }

  return {
    ...base,
    backgroundColor: `rgba(20, 20, 20, ${opacity})`,
  };
}

export function getLinkAnimationClass(animation: LinkAnimation) {
  switch (animation) {
    case "pulse": return "bf-animate-pulse";
    case "bounce": return "bf-animate-bounce";
    case "glow": return "bf-animate-glow";
    case "slide": return "bf-animate-slide";
    default: return "";
  }
}

export function getUsernameEffectClass(effect: UsernameEffect) {
  switch (effect) {
    case "glow": return "bf-username-glow";
    case "rainbow": return "bf-username-rainbow";
    case "wave": return "bf-username-wave";
    case "pulse": return "bf-username-pulse";
    case "gradient": return "bf-username-gradient";
    default: return "";
  }
}

export function resolveProfileStatusColor(settings: ProfileSettings): string {
  const custom = settings.profile_status_color?.trim();
  return custom || settings.accent_color;
}

export function resolveMusicPlayerColor(settings: ProfileSettings): string {
  const custom = settings.music_player_color?.trim();
  return custom || settings.accent_color;
}
