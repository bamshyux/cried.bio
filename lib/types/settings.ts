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
  | "bento";

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

export type CursorEffect = "none" | "trail" | "glow" | "particles" | "sparkles";

export type UsernameEffect =
  | "none"
  | "glow"
  | "rainbow"
  | "wave"
  | "pulse"
  | "gradient";

export type LinkAnimation = "none" | "pulse" | "bounce" | "glow" | "slide";

export type LinksStyle = "buttons" | "icons";

export type StatusPreset =
  | "online"
  | "away"
  | "busy"
  | "streaming"
  | "building"
  | "recording"
  | "custom";

export type SettingsSection =
  | "customize"
  | "background"
  | "themes"
  | "music"
  | "effects"
  | "links"
  | "guestbook"
  | "social";

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
  typing_bio: boolean;
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
  show_follow_counts: boolean;
  show_activity: boolean;
  friends_visibility: "public" | "friends" | "private";
  featured_link_id: string | null;
  show_badges: boolean;
  badge_display_limit: number;
  badges_monochrome: boolean;
  badge_color: string;
  links_monochrome: boolean;
  links_style: LinksStyle;
  profile_parallax: boolean;
  content_alignment: ContentAlignment;
  created_at: string;
  updated_at: string;
};

export type SettingsFormState = {
  error?: string;
  success?: string;
};
