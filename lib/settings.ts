import { DEFAULT_DISCORD_CARD_CONFIG } from "@/lib/types/discord-widget";
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
import { clampLinksIconSize } from "@/lib/links";
import {
  cardBorderEffectStripsDefaultBorder,
  getCardBorderInnerRadius,
  parseCardBorderTargets,
} from "@/lib/card-border-effects/resolve";
import { clampCursorImageSize } from "@/lib/profile/custom-cursor";

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
  cursor_image_url: null,
  cursor_image_size: 48,
  typing_bio: false,
  bio_color: "",
  bio_font_family: "",
  bio_font_size: 16,
  bio_font_weight: 400,
  bio_italic: false,
  bio_glow: false,
  bio_letter_spacing: "normal",
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
  badges_custom_monochrome: false,
  badges_glow: true,
  badge_color: "#ffffff",
  links_monochrome: false,
  links_style: "buttons",
  links_icon_size: 24,
  links_icon_glow: false,
  links_icon_shadow: false,
  links_icon_pulse: false,
  profile_parallax: false,
  content_alignment: "left",
  enter_gate_enabled: true,
  enter_gate_title: "",
  enter_gate_subtitle: "",
  enter_gate_button: "Click to enter",
  enter_gate_show_avatar: true,
  enter_gate_blur: true,
  enter_gate_blur_strength: 12,
  enter_gate_background_type: "solid",
  enter_gate_background_color: "#090909",
  enter_gate_background_image_url: null,
  enter_gate_background_video_url: null,
  enter_gate_gradient_colors: ["#090909", "#141414", "#1a1a1a"],
  enter_gate_animated_gradient: false,
  enter_gate_overlay_opacity: 50,
  enter_gate_vignette: false,
  enter_gate_noise: false,
  enter_gate_particle_effect: null,
  enter_gate_show_username: true,
  enter_gate_show_branding: true,
  enter_gate_title_color: "",
  enter_gate_subtitle_color: "",
  enter_gate_accent_color: "",
  enter_gate_text_align: "center",
  enter_gate_button_style: "pill",
  enter_gate_animation: "pulse",
  enter_gate_glass_card: false,
  enter_gate_card_opacity: 20,
  layout_label: "",
  hide_card_border: false,
  card_border_effect: "none",
  card_border_thickness: 2,
  card_border_speed: 100,
  card_border_glow_intensity: 60,
  card_border_color: "",
  card_border_secondary_color: "",
  card_border_apply_all: true,
  card_border_targets: ["main", "discord", "roblox", "spotify", "links", "guestbook"],
  card_offset_x: 0,
  card_offset_y: 0,
  card_width: 100,
  card_max_height: 0,
  discord_user_id: "",
  discord_username: "",
  discord_avatar: "",
  discord_banner: "",
  discord_premium_type: 0,
  show_discord_status: false,
  discord_card_style: "discord",
  discord_show_lanyard_hint: false,
  discord_card_config: DEFAULT_DISCORD_CARD_CONFIG,
  custom_theme_id: null,
  active_preset_id: null,
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

export type FontOption = {
  value: string;
  label: string;
  css: string;
  /** Google Fonts CSS2 family param; omit for system/local fonts */
  google?: string;
};

export const FONT_OPTIONS: FontOption[] = [
  { value: "inter", label: "Inter", css: "'Inter', sans-serif", google: "Inter:wght@400;500;600;700" },
  { value: "geist", label: "Geist", css: "var(--font-geist-sans), sans-serif" },
  { value: "helvetica", label: "Helvetica", css: "Helvetica, 'Helvetica Neue', Arial, sans-serif" },
  { value: "poppins", label: "Poppins", css: "'Poppins', sans-serif", google: "Poppins:wght@400;500;600;700" },
  { value: "montserrat", label: "Montserrat", css: "'Montserrat', sans-serif", google: "Montserrat:wght@400;500;600;700" },
  { value: "roboto", label: "Roboto", css: "'Roboto', sans-serif", google: "Roboto:wght@400;500;700" },
  { value: "open-sans", label: "Open Sans", css: "'Open Sans', sans-serif", google: "Open+Sans:wght@400;500;600;700" },
  { value: "lato", label: "Lato", css: "'Lato', sans-serif", google: "Lato:wght@400;700;900" },
  { value: "nunito", label: "Nunito", css: "'Nunito', sans-serif", google: "Nunito:wght@400;600;700" },
  { value: "raleway", label: "Raleway", css: "'Raleway', sans-serif", google: "Raleway:wght@400;500;600;700" },
  { value: "ubuntu", label: "Ubuntu", css: "'Ubuntu', sans-serif", google: "Ubuntu:wght@400;500;700" },
  { value: "oswald", label: "Oswald", css: "'Oswald', sans-serif", google: "Oswald:wght@400;500;600;700" },
  { value: "dm-sans", label: "DM Sans", css: "'DM Sans', sans-serif", google: "DM+Sans:wght@400;500;700" },
  { value: "space-grotesk", label: "Space Grotesk", css: "'Space Grotesk', sans-serif", google: "Space+Grotesk:wght@400;500;600;700" },
  { value: "manrope", label: "Manrope", css: "'Manrope', sans-serif", google: "Manrope:wght@400;500;600;700" },
  { value: "outfit", label: "Outfit", css: "'Outfit', sans-serif", google: "Outfit:wght@400;500;600;700" },
  { value: "syne", label: "Syne", css: "'Syne', sans-serif", google: "Syne:wght@400;600;700;800" },
  { value: "plus-jakarta", label: "Plus Jakarta Sans", css: "'Plus Jakarta Sans', sans-serif", google: "Plus+Jakarta+Sans:wght@400;500;600;700" },
  { value: "figtree", label: "Figtree", css: "'Figtree', sans-serif", google: "Figtree:wght@400;500;600;700" },
  { value: "sora", label: "Sora", css: "'Sora', sans-serif", google: "Sora:wght@400;500;600;700" },
  { value: "lexend", label: "Lexend", css: "'Lexend', sans-serif", google: "Lexend:wght@400;500;600;700" },
  { value: "rubik", label: "Rubik", css: "'Rubik', sans-serif", google: "Rubik:wght@400;500;600;700" },
  { value: "work-sans", label: "Work Sans", css: "'Work Sans', sans-serif", google: "Work+Sans:wght@400;500;600;700" },
  { value: "karla", label: "Karla", css: "'Karla', sans-serif", google: "Karla:wght@400;500;600;700" },
  { value: "source-sans", label: "Source Sans 3", css: "'Source Sans 3', sans-serif", google: "Source+Sans+3:wght@400;500;600;700" },
  { value: "playfair", label: "Playfair Display", css: "'Playfair Display', serif", google: "Playfair+Display:wght@400;500;600;700" },
  { value: "merriweather", label: "Merriweather", css: "'Merriweather', serif", google: "Merriweather:wght@400;700" },
  { value: "lora", label: "Lora", css: "'Lora', serif", google: "Lora:wght@400;500;600;700" },
  { value: "crimson-pro", label: "Crimson Pro", css: "'Crimson Pro', serif", google: "Crimson+Pro:wght@400;600;700" },
  { value: "libre-baskerville", label: "Libre Baskerville", css: "'Libre Baskerville', serif", google: "Libre+Baskerville:wght@400;700" },
  { value: "orbitron", label: "Orbitron", css: "'Orbitron', sans-serif", google: "Orbitron:wght@400;700" },
  { value: "bebas", label: "Bebas Neue", css: "'Bebas Neue', sans-serif", google: "Bebas+Neue" },
  { value: "press-start", label: "Press Start 2P", css: "'Press Start 2P', cursive", google: "Press+Start+2P" },
  { value: "audiowide", label: "Audiowide", css: "'Audiowide', sans-serif", google: "Audiowide" },
  { value: "russo-one", label: "Russo One", css: "'Russo One', sans-serif", google: "Russo+One" },
  { value: "black-ops-one", label: "Black Ops One", css: "'Black Ops One', sans-serif", google: "Black+Ops+One" },
  { value: "permanent-marker", label: "Permanent Marker", css: "'Permanent Marker', cursive", google: "Permanent+Marker" },
  { value: "jetbrains-mono", label: "JetBrains Mono", css: "'JetBrains Mono', monospace", google: "JetBrains+Mono:wght@400;500;600;700" },
  { value: "fira-code", label: "Fira Code", css: "'Fira Code', monospace", google: "Fira+Code:wght@400;500;600;700" },
  { value: "space-mono", label: "Space Mono", css: "'Space Mono', monospace", google: "Space+Mono:wght@400;700" },
  { value: "ibm-plex-mono", label: "IBM Plex Mono", css: "'IBM Plex Mono', monospace", google: "IBM+Plex+Mono:wght@400;500;600;700" },
];

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
  { value: "neon", label: "Neon" },
  { value: "sparkles", label: "Sparkles" },
  { value: "particles", label: "Particles" },
  { value: "comet", label: "Comet" },
  { value: "laser", label: "Laser" },
  { value: "ripple", label: "Ripple" },
  { value: "orbit", label: "Orbit" },
  { value: "crosshair", label: "Crosshair" },
  { value: "magnetic", label: "Magnetic" },
  { value: "spotlight", label: "Spotlight" },
  { value: "rainbow", label: "Rainbow" },
  { value: "flame", label: "Flame" },
  { value: "snow", label: "Snow" },
  { value: "hearts", label: "Hearts" },
  { value: "stars", label: "Stars" },
  { value: "bubbles", label: "Bubbles" },
  { value: "confetti", label: "Confetti" },
  { value: "paint", label: "Paint Splatter" },
  { value: "smoke", label: "Smoke" },
  { value: "electric", label: "Electric" },
  { value: "glitch", label: "Glitch" },
];

const CURSOR_EFFECT_VALUES = new Set<string>(CURSOR_EFFECT_OPTIONS.map((o) => o.value));

export function parseCursorEffect(value: unknown, fallback: CursorEffect = "none"): CursorEffect {
  const key = String(value ?? "");
  return CURSOR_EFFECT_VALUES.has(key) ? (key as CursorEffect) : fallback;
}

export const USERNAME_EFFECT_OPTIONS: { value: UsernameEffect; label: string }[] = [
  { value: "none", label: "None" },
  { value: "glow", label: "Glow" },
  { value: "neon", label: "Neon" },
  { value: "rainbow", label: "Rainbow" },
  { value: "gradient", label: "Gradient Text" },
  { value: "shimmer", label: "Shimmer" },
  { value: "chrome", label: "Chrome" },
  { value: "fire", label: "Fire" },
  { value: "ice", label: "Ice" },
  { value: "wave", label: "Wave" },
  { value: "bounce", label: "Bounce" },
  { value: "pulse", label: "Pulse" },
  { value: "flicker", label: "Flicker" },
  { value: "glitch", label: "Glitch" },
  { value: "outline", label: "Outline" },
  { value: "shadow", label: "Shadow" },
];

const USERNAME_EFFECT_VALUES = new Set<string>(USERNAME_EFFECT_OPTIONS.map((o) => o.value));

export function parseUsernameEffect(value: unknown, fallback: UsernameEffect = "none"): UsernameEffect {
  const key = String(value ?? "");
  return USERNAME_EFFECT_VALUES.has(key) ? (key as UsernameEffect) : fallback;
}

export const BIO_FONT_WEIGHT_OPTIONS = [
  { value: 400, label: "Regular" },
  { value: 500, label: "Medium" },
  { value: 600, label: "Semibold" },
  { value: 700, label: "Bold" },
] as const;

export const BIO_LETTER_SPACING_OPTIONS: { value: import("@/lib/types/settings").BioLetterSpacing; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "wide", label: "Wide" },
  { value: "wider", label: "Wider" },
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
  const family = FONT_OPTIONS.find((f) => f.value === fontKey)?.google;
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
    cursor_effect: parseCursorEffect(row?.cursor_effect ?? legacyCursor, DEFAULT_SETTINGS.cursor_effect),
    cursor_image_url: row?.cursor_image_url ?? null,
    cursor_image_size: clampCursorImageSize(row?.cursor_image_size, DEFAULT_SETTINGS.cursor_image_size),
    typing_bio: row?.typing_bio ?? DEFAULT_SETTINGS.typing_bio,
    bio_color: row?.bio_color ?? DEFAULT_SETTINGS.bio_color,
    bio_font_family: row?.bio_font_family ?? DEFAULT_SETTINGS.bio_font_family,
    bio_font_size: row?.bio_font_size ?? DEFAULT_SETTINGS.bio_font_size,
    bio_font_weight: row?.bio_font_weight ?? DEFAULT_SETTINGS.bio_font_weight,
    bio_italic: row?.bio_italic ?? DEFAULT_SETTINGS.bio_italic,
    bio_glow: row?.bio_glow ?? DEFAULT_SETTINGS.bio_glow,
    bio_letter_spacing:
      (row?.bio_letter_spacing ?? DEFAULT_SETTINGS.bio_letter_spacing) as import("@/lib/types/settings").BioLetterSpacing,
    username_effect: parseUsernameEffect(row?.username_effect ?? legacyUsername, DEFAULT_SETTINGS.username_effect),
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
    badges_custom_monochrome:
      row?.badges_custom_monochrome ?? DEFAULT_SETTINGS.badges_custom_monochrome,
    badges_glow: row?.badges_glow ?? DEFAULT_SETTINGS.badges_glow,
    badge_color: row?.badge_color ?? DEFAULT_SETTINGS.badge_color,
    links_monochrome: row?.links_monochrome ?? DEFAULT_SETTINGS.links_monochrome,
    links_style: (row?.links_style ?? DEFAULT_SETTINGS.links_style) as import("@/lib/types/settings").LinksStyle,
    links_icon_size: clampLinksIconSize(row?.links_icon_size ?? DEFAULT_SETTINGS.links_icon_size),
    links_icon_glow: row?.links_icon_glow ?? DEFAULT_SETTINGS.links_icon_glow,
    links_icon_shadow: row?.links_icon_shadow ?? DEFAULT_SETTINGS.links_icon_shadow,
    links_icon_pulse: row?.links_icon_pulse ?? DEFAULT_SETTINGS.links_icon_pulse,
    profile_parallax: row?.profile_parallax ?? DEFAULT_SETTINGS.profile_parallax,
    content_alignment: (row?.content_alignment ?? DEFAULT_SETTINGS.content_alignment) as ContentAlignment,
    enter_gate_enabled: true,
    enter_gate_title: row?.enter_gate_title ?? DEFAULT_SETTINGS.enter_gate_title,
    enter_gate_subtitle: row?.enter_gate_subtitle ?? DEFAULT_SETTINGS.enter_gate_subtitle,
    enter_gate_button: row?.enter_gate_button ?? DEFAULT_SETTINGS.enter_gate_button,
    enter_gate_show_avatar: row?.enter_gate_show_avatar ?? DEFAULT_SETTINGS.enter_gate_show_avatar,
    enter_gate_blur: row?.enter_gate_blur ?? DEFAULT_SETTINGS.enter_gate_blur,
    enter_gate_blur_strength: row?.enter_gate_blur_strength ?? DEFAULT_SETTINGS.enter_gate_blur_strength,
    enter_gate_background_type:
      (row?.enter_gate_background_type ?? DEFAULT_SETTINGS.enter_gate_background_type) as import("@/lib/types/settings").EnterGateBackgroundType,
    enter_gate_background_color: row?.enter_gate_background_color ?? DEFAULT_SETTINGS.enter_gate_background_color,
    enter_gate_background_image_url: row?.enter_gate_background_image_url ?? null,
    enter_gate_background_video_url: row?.enter_gate_background_video_url ?? null,
    enter_gate_gradient_colors: Array.isArray(row?.enter_gate_gradient_colors)
      ? row.enter_gate_gradient_colors
      : DEFAULT_SETTINGS.enter_gate_gradient_colors,
    enter_gate_animated_gradient: row?.enter_gate_animated_gradient ?? DEFAULT_SETTINGS.enter_gate_animated_gradient,
    enter_gate_overlay_opacity: row?.enter_gate_overlay_opacity ?? DEFAULT_SETTINGS.enter_gate_overlay_opacity,
    enter_gate_vignette: row?.enter_gate_vignette ?? DEFAULT_SETTINGS.enter_gate_vignette,
    enter_gate_noise: row?.enter_gate_noise ?? DEFAULT_SETTINGS.enter_gate_noise,
    enter_gate_particle_effect: row?.enter_gate_particle_effect ?? null,
    enter_gate_show_username: row?.enter_gate_show_username ?? DEFAULT_SETTINGS.enter_gate_show_username,
    enter_gate_show_branding: row?.enter_gate_show_branding ?? DEFAULT_SETTINGS.enter_gate_show_branding,
    enter_gate_title_color: row?.enter_gate_title_color ?? DEFAULT_SETTINGS.enter_gate_title_color,
    enter_gate_subtitle_color: row?.enter_gate_subtitle_color ?? DEFAULT_SETTINGS.enter_gate_subtitle_color,
    enter_gate_accent_color: row?.enter_gate_accent_color ?? DEFAULT_SETTINGS.enter_gate_accent_color,
    enter_gate_text_align:
      (row?.enter_gate_text_align ?? DEFAULT_SETTINGS.enter_gate_text_align) as import("@/lib/types/settings").EnterGateTextAlign,
    enter_gate_button_style:
      (row?.enter_gate_button_style ?? DEFAULT_SETTINGS.enter_gate_button_style) as import("@/lib/types/settings").EnterGateButtonStyle,
    enter_gate_animation:
      (row?.enter_gate_animation ?? DEFAULT_SETTINGS.enter_gate_animation) as import("@/lib/types/settings").EnterGateAnimation,
    enter_gate_glass_card: row?.enter_gate_glass_card ?? DEFAULT_SETTINGS.enter_gate_glass_card,
    enter_gate_card_opacity: row?.enter_gate_card_opacity ?? DEFAULT_SETTINGS.enter_gate_card_opacity,
    layout_label: row?.layout_label ?? DEFAULT_SETTINGS.layout_label,
    hide_card_border: row?.hide_card_border ?? DEFAULT_SETTINGS.hide_card_border,
    card_border_effect:
      (row?.card_border_effect ?? DEFAULT_SETTINGS.card_border_effect) as import("@/lib/types/settings").CardBorderEffectPreset,
    card_border_thickness: row?.card_border_thickness ?? DEFAULT_SETTINGS.card_border_thickness,
    card_border_speed: row?.card_border_speed ?? DEFAULT_SETTINGS.card_border_speed,
    card_border_glow_intensity:
      row?.card_border_glow_intensity ?? DEFAULT_SETTINGS.card_border_glow_intensity,
    card_border_color: row?.card_border_color ?? DEFAULT_SETTINGS.card_border_color,
    card_border_secondary_color:
      row?.card_border_secondary_color ?? DEFAULT_SETTINGS.card_border_secondary_color,
    card_border_apply_all: row?.card_border_apply_all ?? DEFAULT_SETTINGS.card_border_apply_all,
    card_border_targets: parseCardBorderTargets(
      row?.card_border_targets ?? DEFAULT_SETTINGS.card_border_targets,
    ),
    card_offset_x: row?.card_offset_x ?? DEFAULT_SETTINGS.card_offset_x,
    card_offset_y: row?.card_offset_y ?? DEFAULT_SETTINGS.card_offset_y,
    card_width: row?.card_width ?? DEFAULT_SETTINGS.card_width,
    card_max_height: row?.card_max_height ?? DEFAULT_SETTINGS.card_max_height,
    discord_user_id:
      (row as { widgets_discord_user_id?: string })?.widgets_discord_user_id ??
      row?.discord_user_id ??
      DEFAULT_SETTINGS.discord_user_id,
    discord_username: row?.discord_username ?? DEFAULT_SETTINGS.discord_username,
    discord_avatar: row?.discord_avatar ?? DEFAULT_SETTINGS.discord_avatar,
    discord_banner: row?.discord_banner ?? DEFAULT_SETTINGS.discord_banner,
    discord_premium_type: Number(row?.discord_premium_type ?? DEFAULT_SETTINGS.discord_premium_type) || 0,
    show_discord_status: row?.show_discord_status ?? DEFAULT_SETTINGS.show_discord_status,
    discord_card_style:
      (row as { discord_card_style?: DiscordCardStyle })?.discord_card_style ??
      DEFAULT_SETTINGS.discord_card_style,
    discord_show_lanyard_hint:
      (row as { discord_show_lanyard_hint?: boolean })?.discord_show_lanyard_hint ??
      DEFAULT_SETTINGS.discord_show_lanyard_hint,
    discord_card_config: DEFAULT_DISCORD_CARD_CONFIG,
    custom_theme_id: row?.custom_theme_id ?? null,
    active_preset_id: row?.active_preset_id ?? null,
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
  const borderHandledExternally = cardBorderEffectStripsDefaultBorder(settings, "main");
  const cardRadius = borderHandledExternally
    ? getCardBorderInnerRadius(settings, "main")
    : settings.border_radius;

  const base: Record<string, string | number | undefined> = {
    borderRadius: cardRadius,
    border:
      settings.hide_card_border || borderHandledExternally
        ? "none"
        : "1px solid rgba(255,255,255,0.06)",
    boxShadow:
      settings.hide_card_border || borderHandledExternally ? "none" : "0 8px 32px rgba(0,0,0,0.4)",
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

export const CARD_LAYOUT_MIN_HEIGHT = 280;

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
  card_max_height: number;
}) {
  const maxHeight = Math.round(values.card_max_height);
  return {
    card_offset_x: Math.min(500, Math.max(-500, Math.round(values.card_offset_x))),
    card_offset_y: Math.min(500, Math.max(-500, Math.round(values.card_offset_y))),
    card_width: Math.min(150, Math.max(50, Math.round(values.card_width))),
    card_max_height:
      maxHeight <= 0 ? 0 : Math.min(2000, Math.max(CARD_LAYOUT_MIN_HEIGHT, maxHeight)),
  };
}

export { getLinkAnimationClass } from "@/lib/link-animation";

export function getUsernameEffectClass(effect: UsernameEffect) {
  switch (effect) {
    case "glow":
      return "bf-username-glow";
    case "neon":
      return "bf-username-neon";
    case "rainbow":
      return "bf-username-rainbow";
    case "wave":
      return "bf-username-wave";
    case "bounce":
      return "bf-username-bounce";
    case "pulse":
      return "bf-username-pulse";
    case "flicker":
      return "bf-username-flicker";
    case "gradient":
      return "bf-username-gradient";
    case "shimmer":
      return "bf-username-shimmer";
    case "chrome":
      return "bf-username-chrome";
    case "fire":
      return "bf-username-fire";
    case "ice":
      return "bf-username-ice";
    case "glitch":
      return "bf-username-glitch";
    case "outline":
      return "bf-username-outline";
    case "shadow":
      return "bf-username-shadow";
    default:
      return "";
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
