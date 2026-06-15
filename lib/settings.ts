import type { DiscordCardStyle } from "@/lib/types/discord-widget";
import type {
  BackgroundType,
  ContentAlignment,
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
  badges_glow: true,
  badge_color: "#ffffff",
  links_monochrome: false,
  links_style: "buttons",
  profile_parallax: false,
  content_alignment: "left",
  enter_gate_enabled: true,
  enter_gate_title: "",
  enter_gate_subtitle: "",
  enter_gate_button: "Click to enter",
  enter_gate_show_avatar: true,
  layout_label: "",
  hide_card_border: false,
  card_offset_x: 0,
  card_offset_y: 0,
  card_width: 100,
  discord_user_id: "",
  discord_username: "",
  discord_avatar: "",
  show_discord_status: false,
  discord_card_style: "discord",
  discord_show_lanyard_hint: false,
  custom_theme_id: null,
};

export const CONTENT_ALIGNMENT_OPTIONS: { value: ContentAlignment; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

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
  { value: "sidebar", label: "Sidebar", description: "Left identity rail, content on the right", preview: "sidebar" },
  { value: "hero", label: "Hero", description: "Full-bleed banner with overlaid headline", preview: "hero" },
  { value: "polaroid", label: "Polaroid", description: "Tilted photo frame, scrapbook vibe", preview: "polaroid" },
  { value: "cinematic", label: "Cinematic", description: "Widescreen letterbox with narrow column", preview: "cinematic" },
  { value: "showcase", label: "Showcase", description: "Spotlight avatar with glow rings", preview: "showcase" },
  { value: "retro", label: "Retro", description: "90s window chrome and beveled panels", preview: "retro" },
  { value: "poster", label: "Poster", description: "Event poster with bold accent stripe", preview: "poster" },
  { value: "glass", label: "Glass", description: "Frosted panel with floating color orbs", preview: "glass" },
  { value: "vaporwave", label: "Vaporwave", description: "Retro grid, skewed type, neon strip", preview: "vaporwave" },
  { value: "brutalist", label: "Brutalist", description: "Raw borders, oversized uppercase type", preview: "brutalist" },
  { value: "newspaper", label: "Newspaper", description: "Serif headline, column body text", preview: "newspaper" },
  { value: "ticket", label: "Ticket", description: "Event stub with perforated tear line", preview: "ticket" },
  { value: "vinyl", label: "Vinyl", description: "Album cover square with track listing", preview: "vinyl" },
  { value: "discord", label: "Discord", description: "Banner header with status dot avatar", preview: "discord" },
  { value: "twitch", label: "Twitch", description: "Streamer live badge and purple accents", preview: "twitch" },
  { value: "idcard", label: "ID Card", description: "Badge-style photo ID with barcode strip", preview: "idcard" },
  { value: "blueprint", label: "Blueprint", description: "Technical grid, engineering labels", preview: "blueprint" },
  { value: "comic", label: "Comic", description: "Bold panels and speech-bubble bio", preview: "comic" },
  { value: "cyberpunk", label: "Cyberpunk", description: "Neon accent bar, scanline overlay", preview: "cyberpunk" },
  { value: "luxury", label: "Luxury", description: "Elegant serif, gold dividers, refined spacing", preview: "luxury" },
  { value: "receipt", label: "Receipt", description: "Thermal paper printout aesthetic", preview: "receipt" },
  { value: "zine", label: "Zine", description: "DIY collage, tape strips, bold headlines", preview: "zine" },
  { value: "orbit", label: "Orbit", description: "Avatar centered in spinning ring orbit", preview: "orbit" },
  { value: "wave", label: "Wave", description: "Banner header with fluid wave divider", preview: "wave" },
  { value: "mosaic", label: "Mosaic", description: "Color tile grid header with avatar", preview: "mosaic" },
  { value: "aurora", label: "Aurora", description: "Northern lights gradient header band", preview: "aurora" },
  { value: "hologram", label: "Hologram", description: "Iridescent animated border frame", preview: "hologram" },
  { value: "spotify", label: "Spotify", description: "Artist page with large square avatar", preview: "spotify" },
  { value: "spotlight", label: "Spotlight", description: "Stage spotlight on dark background", preview: "spotlight" },
  { value: "custom", label: "Custom Theme", description: "Build your own layout with scoped CSS", preview: "custom" },
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
    badges_glow: row?.badges_glow ?? DEFAULT_SETTINGS.badges_glow,
    badge_color: row?.badge_color ?? DEFAULT_SETTINGS.badge_color,
    links_monochrome: row?.links_monochrome ?? DEFAULT_SETTINGS.links_monochrome,
    links_style: (row?.links_style ?? DEFAULT_SETTINGS.links_style) as import("@/lib/types/settings").LinksStyle,
    profile_parallax: row?.profile_parallax ?? DEFAULT_SETTINGS.profile_parallax,
    content_alignment: (row?.content_alignment ?? DEFAULT_SETTINGS.content_alignment) as ContentAlignment,
    enter_gate_enabled: true,
    enter_gate_title: row?.enter_gate_title ?? DEFAULT_SETTINGS.enter_gate_title,
    enter_gate_subtitle: row?.enter_gate_subtitle ?? DEFAULT_SETTINGS.enter_gate_subtitle,
    enter_gate_button: row?.enter_gate_button ?? DEFAULT_SETTINGS.enter_gate_button,
    enter_gate_show_avatar: row?.enter_gate_show_avatar ?? DEFAULT_SETTINGS.enter_gate_show_avatar,
    layout_label: row?.layout_label ?? DEFAULT_SETTINGS.layout_label,
    hide_card_border: row?.hide_card_border ?? DEFAULT_SETTINGS.hide_card_border,
    card_offset_x: row?.card_offset_x ?? DEFAULT_SETTINGS.card_offset_x,
    card_offset_y: row?.card_offset_y ?? DEFAULT_SETTINGS.card_offset_y,
    card_width: row?.card_width ?? DEFAULT_SETTINGS.card_width,
    discord_user_id:
      (row as { widgets_discord_user_id?: string })?.widgets_discord_user_id ??
      row?.discord_user_id ??
      DEFAULT_SETTINGS.discord_user_id,
    discord_username: row?.discord_username ?? DEFAULT_SETTINGS.discord_username,
    discord_avatar: row?.discord_avatar ?? DEFAULT_SETTINGS.discord_avatar,
    show_discord_status: row?.show_discord_status ?? DEFAULT_SETTINGS.show_discord_status,
    discord_card_style:
      (row as { discord_card_style?: DiscordCardStyle })?.discord_card_style ??
      DEFAULT_SETTINGS.discord_card_style,
    discord_show_lanyard_hint:
      (row as { discord_show_lanyard_hint?: boolean })?.discord_show_lanyard_hint ??
      DEFAULT_SETTINGS.discord_show_lanyard_hint,
    custom_theme_id: row?.custom_theme_id ?? null,
    created_at: row?.created_at ?? now,
    updated_at: row?.updated_at ?? now,
  };
}

export function getProfileAlignClass(alignment: ContentAlignment = "left") {
  return `bf-profile-align bf-profile-align--${alignment}`;
}

export function buildCardStyle(settings: ProfileSettings): Record<string, string | number | undefined> {
  const opacity = settings.profile_opacity / 100;
  const blur = settings.profile_blur;

  const base: Record<string, string | number | undefined> = {
    borderRadius: settings.border_radius,
    border: settings.hide_card_border ? "none" : "1px solid rgba(255,255,255,0.06)",
    boxShadow: settings.hide_card_border ? "none" : "0 8px 32px rgba(0,0,0,0.4)",
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

export function getCardLayoutStyle(settings: ProfileSettings): Record<string, string | number> {
  return {
    width: `${settings.card_width}%`,
    maxWidth: "100%",
    transform: `translate(${settings.card_offset_x}px, ${settings.card_offset_y}px)`,
  };
}

export function clampCardLayout(values: {
  card_offset_x: number;
  card_offset_y: number;
  card_width: number;
}) {
  return {
    card_offset_x: Math.min(500, Math.max(-500, Math.round(values.card_offset_x))),
    card_offset_y: Math.min(500, Math.max(-500, Math.round(values.card_offset_y))),
    card_width: Math.min(150, Math.max(50, Math.round(values.card_width))),
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
