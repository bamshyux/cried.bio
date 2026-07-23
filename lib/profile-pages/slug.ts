const RESERVED_PAGE_SLUGS = new Set([
  "followers",
  "following",
  "login",
  "signup",
  "dashboard",
  "auth",
  "api",
  "admin",
  "settings",
  "profile",
  "profiles",
  "help",
  "support",
  "terms",
  "privacy",
  "about",
  "pricing",
  "community",
  "accounts",
  "premium",
  "preview",
]);

const PAGE_SLUG_REGEX = /^[a-z0-9_-]{1,30}$/;

export type ProfilePage = {
  id: string;
  profile_id: string;
  slug: string;
  label: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  banner_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export function normalizePageSlug(value: string) {
  return value.trim().toLowerCase();
}

export function isValidPageSlug(slug: string) {
  return PAGE_SLUG_REGEX.test(slug) && !RESERVED_PAGE_SLUGS.has(slug);
}

export function formatProfilePageUrl(username: string, slug: string) {
  return `/${username}/${slug}`;
}
