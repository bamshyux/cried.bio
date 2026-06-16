export type CommunityThemeVisibility = "private" | "public" | "open_source";

export type CommunityThemeCategory =
  | "minimal"
  | "dark"
  | "colorful"
  | "gaming"
  | "professional"
  | "creative"
  | "retro"
  | "anime"
  | "other";

export type CommunityThemeSort =
  | "trending"
  | "newest"
  | "most_installed"
  | "most_liked"
  | "recently_updated";

export type CommunityThemeReportReason =
  | "spam"
  | "inappropriate"
  | "malicious"
  | "copyright"
  | "other";

export type CommunityThemeListing = {
  id: string;
  theme_id: string;
  author_id: string;
  title: string;
  description: string;
  tags: string[];
  category: CommunityThemeCategory;
  visibility: CommunityThemeVisibility;
  preview_image_url: string | null;
  preview_style: string;
  like_count: number;
  install_count: number;
  is_staff_pick: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  creator_username: string;
  creator_display_name: string;
  creator_avatar_url: string | null;
  liked_by_me?: boolean;
  installed_by_me?: boolean;
};

export type CommunityThemesResult = {
  themes: CommunityThemeListing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  query: string;
  category: string;
  sort: CommunityThemeSort;
};

export type CommunityThemeFormState = {
  error?: string;
  success?: string;
  listingId?: string;
  installedThemeId?: string;
};

export const COMMUNITY_THEME_CATEGORIES: { id: CommunityThemeCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "minimal", label: "Minimal" },
  { id: "dark", label: "Dark" },
  { id: "colorful", label: "Colorful" },
  { id: "gaming", label: "Gaming" },
  { id: "professional", label: "Professional" },
  { id: "creative", label: "Creative" },
  { id: "retro", label: "Retro" },
  { id: "anime", label: "Anime" },
  { id: "other", label: "Other" },
];

export const COMMUNITY_THEME_SORTS: { id: CommunityThemeSort; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "newest", label: "Newest" },
  { id: "most_installed", label: "Most Installed" },
  { id: "most_liked", label: "Most Liked" },
  { id: "recently_updated", label: "Recently Updated" },
];

export const COMMUNITY_THEME_VISIBILITY_OPTIONS: {
  id: CommunityThemeVisibility;
  label: string;
  description: string;
}[] = [
  {
    id: "private",
    label: "Private",
    description: "Only you can see it. Not listed in Community Themes.",
  },
  {
    id: "public",
    label: "Public",
    description: "Listed in Community Themes. Others can install; CSS stays hidden.",
  },
  {
    id: "open_source",
    label: "Open Source",
    description: "Listed in Community Themes. Others can install and clone the CSS.",
  },
];

export const COMMUNITY_THEMES_PAGE_SIZE = 12;
