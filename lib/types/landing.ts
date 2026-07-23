export type LandingProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  view_count?: number;
  banner_url?: string | null;
};

export type LandingStats = {
  total_users: number;
  total_profiles: number;
  total_profile_views: number;
  total_guestbook_posts: number;
  total_custom_themes: number;
  total_badges_granted: number;
};

export type LandingTestimonial = {
  id: string;
  quote: string;
  author_name: string;
  author_title: string;
  author_username: string | null;
  author_avatar_url: string | null;
  is_active?: boolean;
};

export type LandingRoadmapItem = {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in_progress" | "planned";
};

export type LandingThemePreview = {
  id: string;
  name: string;
  description: string;
  preview_style: string;
  install_count: number;
};

export type LandingFeaturedProfileRow = {
  id: string;
  sort_order: number;
  is_active: boolean;
  profile_id: string;
  profiles: { username: string | null; display_name: string | null } | null;
};

export type LandingFeaturedProfile = LandingProfile & {
  sort_order: number;
};

export type LandingShowcaseProfile = LandingFeaturedProfile & {
  banner_url?: string | null;
  layout?: string | null;
  background_type?: string | null;
  background_image_url?: string | null;
  background_color?: string | null;
  music_title?: string | null;
  page_count?: number;
};

export type CookieConsentLevel = "all" | "essential";
