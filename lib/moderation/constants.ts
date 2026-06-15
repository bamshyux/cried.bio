export const MODERATION_ERROR = "That content contains prohibited language.";

export type ModerationContentType =
  | "username"
  | "display_name"
  | "bio"
  | "guestbook_message"
  | "link_title"
  | "link_url"
  | "theme_name"
  | "layout_label";

export type ModerationCategorySlug =
  | "profanity"
  | "sexual"
  | "self_harm"
  | "illegal"
  | "scam";
