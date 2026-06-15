export type FeaturedBlockType =
  | "text"
  | "image"
  | "video"
  | "link"
  | "discord"
  | "roblox";

export type FeaturedBlock = {
  id: string;
  profile_id: string;
  block_type: FeaturedBlockType;
  title: string;
  description: string;
  thumbnail_url: string | null;
  url: string;
  accent_color: string;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type FeaturedFormState = { error?: string; success?: string };

export const FEATURED_BLOCK_OPTIONS: { value: FeaturedBlockType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "link", label: "External Link" },
  { value: "discord", label: "Discord Server" },
  { value: "roblox", label: "Roblox Game" },
];

export const MAX_FEATURED_BLOCKS = 6;
export const MAX_FEATURED_BLOCKS_PREMIUM = 12;
