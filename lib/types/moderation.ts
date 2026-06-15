import type { ModerationCategorySlug, ModerationContentType } from "@/lib/moderation/constants";

export type ModerationCategory = {
  id: string;
  slug: ModerationCategorySlug;
  name: string;
  enabled: boolean;
  sort_order: number;
};

export type ModerationWord = {
  id: string;
  category_id: string;
  category_slug: ModerationCategorySlug;
  word: string;
  enabled: boolean;
  created_at: string;
};

export type ModerationDictionaryWord = {
  word: string;
  category_slug: ModerationCategorySlug;
  enabled: boolean;
};

export type ModerationDictionary = {
  enabledCategories: Set<ModerationCategorySlug>;
  words: ModerationDictionaryWord[];
};

export type ModerationLog = {
  id: string;
  user_id: string | null;
  content_type: ModerationContentType;
  action: string;
  category_slug: string | null;
  created_at: string;
};

export type ModerationAuditEntry = {
  id: string;
  admin_user_id: string | null;
  admin_email: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};
