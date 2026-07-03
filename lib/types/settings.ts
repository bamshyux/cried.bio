export type ContentAlignment = "left" | "center" | "right";

export type ProfileLayout =
  | "classic"
  | "modern"
  | "gaming"
  | "portfolio"
  | "minimal"
  | "stacked"
  | "split"
  | "terminal"
  | "compact"
  | "card"
  | "neon"
  | "magazine"
  | "bento"
  | "sidebar"
  | "hero"
  | "polaroid"
  | "cinematic"
  | "showcase"
  | "retro"
  | "poster"
  | "glass"
  | "vaporwave"
  | "brutalist"
  | "newspaper"
  | "ticket"
  | "vinyl"
  | "discord"
  | "twitch"
  | "idcard"
  | "blueprint"
  | "comic"
  | "cyberpunk"
  | "luxury"
  | "receipt"
  | "zine"
  | "orbit"
  | "wave"
  | "mosaic"
  | "aurora"
  | "hologram"
  | "spotify"
  | "spotlight"
  | "custom";

export type BackgroundType =
  | "solid"
  | "image"
  | "video"
  | "animated_gradient"
  | "particles";

export type ParticleEffect =
  | "snow"
  | "rain"
  | "stars"
  | "floating"
  | "fireflies"
  | "matrix"
  | "sakura"
  | "leaves"
  | "bubbles"
  | "starfield";

export type CursorEffect =
  | "none"
  | "trail"
  | "glow"
  | "particles"
  | "sparkles"
  | "neon"
  | "comet"
  | "ripple"
  | "flame"
  | "snow"
  | "hearts"
  | "stars"
  | "bubbles"
  | "rainbow"
  | "orbit"
  | "crosshair"
  | "magnetic"
  | "paint"
  | "spotlight"
  | "glitch"
  | "confetti"
  | "laser"
  | "smoke"
  | "electric";

export type UsernameEffect =
  | "none"
  | "glow"
  | "rainbow"
  | "wave"
  | "pulse"
  | "gradient"
  | "shimmer"
  | "neon"
  | "glitch"
  | "fire"
  | "ice"
  | "bounce"
  | "flicker"
  | "outline"
  | "chrome"
  | "shadow";

export type LinkAnimation = "none" | "pulse" | "bounce" | "glow" | "slide";

export type LinksStyle = "buttons" | "icons" | "icons_only";

export type EnterGateBackgroundType = "solid" | "image" | "video" | "gradient" | "profile";

export type EnterGateButtonStyle = "pill" | "outline" | "ghost" | "minimal" | "glow";

export type EnterGateAnimation = "none" | "pulse" | "fade" | "bounce" | "glow";

export type EnterGateTextAlign = "left" | "center" | "right";

export type StatusPreset =
  | "online"
  | "away"
  | "busy"
  | "streaming"
  | "building"
  | "recording"
  | "custom";

export type BioLetterSpacing = "normal" | "wide" | "wider";

export type GuestbookBorderStyle = "none" | "accent-left" | "subtle-full";
export type GuestbookSpacing = "compact" | "default" | "relaxed";

export type SettingsSection =
  | "customize"
  | "background"
  | "themes"
  | "music"
  | "effects"
  | "card_border"
  | "links"
  | "guestbook"
  | "social"
  | "profile";

export type CardBorderEffectPreset =
  | "none"
  | "standard"
  | "neon-glow"
  | "snake"
  | "dual-snake"
  | "energy-flow"
  | "pulse"
  | "lightning"
  | "rgb-flow"
  | "white-aura"
  | "particle-trail"
  | "liquid-chrome"
  | "cyber-scan"
  | "fire"
  | "ice"
  | "void";

export type CardBorderTarget =
  | "main"
  | "discord"
  | "roblox"
  | "spotify"
  | "links"
  | "guestbook";

export type ProfileSettings = {
  profile_id: string;
  layout: ProfileLayout;
  accent_color: string;
  text_color: string;
  background_color: string;
  font_family: string;
  animated_gradient: boolean;
  gradient_colors: string[];
  glassmorphism: boolean;
  neon_glow: boolean;
  border_radius: number;
  profile_opacity: number;
  profile_blur: number;
  background_type: BackgroundType;
  background_image_url: string | null;
  background_video_url: string | null;
  particle_effect: ParticleEffect | null;
  overlay_opacity: number;
  vignette: boolean;
  noise_texture: boolean;
  music_url: string | null;
  music_title: string;
  music_autoplay: boolean;
  music_loop: boolean;
  music_volume: number;
  cursor_effect: CursorEffect;
  cursor_image_url: string | null;
  cursor_image_size: number;
  typing_bio: boolean;
  bio_color: string;
  bio_font_family: string;
  bio_font_size: number;
  bio_font_weight: number;
  bio_italic: boolean;
  bio_glow: boolean;
  bio_letter_spacing: BioLetterSpacing;
  username_effect: UsernameEffect;
  hover_animations: boolean;
  page_entrance: boolean;
  link_animation: LinkAnimation;
  show_view_count: boolean;
  show_join_date: boolean;
  profile_status: string;
  profile_status_color: string;
  status_preset: StatusPreset;
  status_emoji: string;
  music_player_color: string;
  guestbook_enabled: boolean;
  guestbook_approval_required: boolean;
  guestbook_use_profile_card: boolean;
  guestbook_opacity: number;
  guestbook_blur: number;
  guestbook_glassmorphism: boolean;
  guestbook_show_background: boolean;
  guestbook_background_color: string;
  guestbook_message_opacity: number;
  guestbook_author_opacity: number;
  guestbook_label_opacity: number;
  guestbook_text_color: string;
  guestbook_border_style: GuestbookBorderStyle;
  guestbook_spacing: GuestbookSpacing;
  guestbook_padding_y: number;
  show_follow_counts: boolean;
  show_activity: boolean;
  friends_visibility: "public" | "friends" | "private";
  featured_link_id: string | null;
  show_badges: boolean;
  badge_display_limit: number;
  badges_monochrome: boolean;
  badges_custom_monochrome: boolean;
  badges_glow: boolean;
  badge_color: string;
  links_monochrome: boolean;
  links_style: LinksStyle;
  links_icon_size: number;
  links_icon_glow: boolean;
  links_icon_shadow: boolean;
  links_icon_pulse: boolean;
  profile_parallax: boolean;
  content_alignment: ContentAlignment;
  enter_gate_enabled: boolean;
  enter_gate_title: string;
  enter_gate_subtitle: string;
  enter_gate_button: string;
  enter_gate_show_avatar: boolean;
  enter_gate_blur: boolean;
  enter_gate_blur_strength: number;
  enter_gate_background_type: EnterGateBackgroundType;
  enter_gate_background_color: string;
  enter_gate_background_image_url: string | null;
  enter_gate_background_video_url: string | null;
  enter_gate_gradient_colors: string[];
  enter_gate_animated_gradient: boolean;
  enter_gate_overlay_opacity: number;
  enter_gate_vignette: boolean;
  enter_gate_noise: boolean;
  enter_gate_particle_effect: ParticleEffect | null;
  enter_gate_show_username: boolean;
  enter_gate_show_branding: boolean;
  enter_gate_title_color: string;
  enter_gate_subtitle_color: string;
  enter_gate_accent_color: string;
  enter_gate_text_align: EnterGateTextAlign;
  enter_gate_button_style: EnterGateButtonStyle;
  enter_gate_animation: EnterGateAnimation;
  enter_gate_glass_card: boolean;
  enter_gate_card_opacity: number;
  enter_gate_font_family: string;
  layout_label: string;
  hide_card_border: boolean;
  card_border_effect: CardBorderEffectPreset;
  card_border_thickness: number;
  card_border_speed: number;
  card_border_glow_intensity: number;
  card_border_color: string;
  card_border_secondary_color: string;
  card_border_apply_all: boolean;
  card_border_targets: CardBorderTarget[];
  card_offset_x: number;
  card_offset_y: number;
  card_width: number;
  card_max_height: number;
  discord_user_id: string;
  discord_username: string;
  discord_avatar: string;
  discord_banner: string;
  discord_premium_type: number;
  show_discord_status: boolean;
  discord_card_style: import("@/lib/types/discord-widget").DiscordCardStyle;
  discord_show_lanyard_hint: boolean;
  discord_card_config: import("@/lib/types/discord-widget").DiscordCardConfig;
  custom_theme_id: string | null;
  active_preset_id: string | null;
  created_at: string;
  updated_at: string;
};

export type SettingsFormState = {
  error?: string;
  success?: string;
};
