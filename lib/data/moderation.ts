import { createAdminClient } from "@/lib/supabase/admin";
import { checkTextAgainstDictionary } from "@/lib/moderation/check";
import { MODERATION_ERROR, type ModerationContentType } from "@/lib/moderation/constants";
import type { ModerationCategorySlug } from "@/lib/moderation/constants";
import type {
  ModerationAuditEntry,
  ModerationCategory,
  ModerationDictionary,
  ModerationLog,
  ModerationWord,
} from "@/lib/types/moderation";

const CACHE_TTL_MS = 30_000;

let dictionaryCache: { value: ModerationDictionary; loadedAt: number } | null = null;

function invalidateModerationCache() {
  dictionaryCache = null;
}

async function fetchDictionary(): Promise<ModerationDictionary | null> {
  const admin = createAdminClient();
  if (!admin) {
    console.warn(
      "[moderation] SUPABASE_SERVICE_ROLE_KEY is not configured — content filter is disabled.",
    );
    return null;
  }

  const [{ data: categories }, { data: words }] = await Promise.all([
    admin.from("moderation_categories").select("slug, enabled").order("sort_order"),
    admin
      .from("moderation_words")
      .select("word, enabled, category:moderation_categories(slug)")
      .eq("enabled", true),
  ]);

  if (!categories?.length) {
    return { enabledCategories: new Set(), words: [] };
  }

  const enabledCategories = new Set<ModerationCategorySlug>(
    categories.filter((c) => c.enabled).map((c) => c.slug as ModerationCategorySlug),
  );

  const dictionaryWords =
    words?.map((row) => {
      const category = row.category as { slug?: string } | null;
      return {
        word: String(row.word),
        category_slug: (category?.slug ?? "profanity") as ModerationCategorySlug,
        enabled: row.enabled !== false,
      };
    }) ?? [];

  return { enabledCategories, words: dictionaryWords };
}

async function getDictionary() {
  if (dictionaryCache && Date.now() - dictionaryCache.loadedAt < CACHE_TTL_MS) {
    return dictionaryCache.value;
  }

  const value = (await fetchDictionary()) ?? { enabledCategories: new Set(), words: [] };
  dictionaryCache = { value, loadedAt: Date.now() };
  return value;
}

export async function validateModeratedContent(
  text: string,
  contentType: ModerationContentType,
  userId?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const dictionary = await getDictionary();
  const result = checkTextAgainstDictionary(text, dictionary);

  if (result.allowed) return { ok: true };

  void logModerationBlock({
    userId: userId ?? null,
    contentType,
    categorySlug: result.categorySlug ?? null,
  });

  return { ok: false, error: result.error ?? MODERATION_ERROR };
}

async function logModerationBlock(input: {
  userId: string | null;
  contentType: ModerationContentType;
  categorySlug: string | null;
}) {
  const admin = createAdminClient();
  if (!admin) return;

  await admin.from("moderation_logs").insert({
    user_id: input.userId,
    content_type: input.contentType,
    action: "blocked",
    category_slug: input.categorySlug,
  });
}

export async function listModerationCategories(): Promise<ModerationCategory[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("moderation_categories")
    .select("*")
    .order("sort_order");

  return (data ?? []) as ModerationCategory[];
}

export async function listModerationWords(): Promise<ModerationWord[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  let query = admin
    .from("moderation_words")
    .select("id, category_id, word, enabled, created_at, category:moderation_categories(slug)")
    .order("word");

  const { data } = await query;

  return (data ?? []).map((row) => {
    const category = row.category as { slug?: string } | null;
    return {
      id: row.id as string,
      category_id: row.category_id as string,
      category_slug: (category?.slug ?? "profanity") as ModerationCategorySlug,
      word: row.word as string,
      enabled: row.enabled as boolean,
      created_at: row.created_at as string,
    };
  });
}

export async function listModerationLogs(limit = 100): Promise<ModerationLog[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("moderation_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as ModerationLog[];
}

export async function listModerationAudit(limit = 100): Promise<ModerationAuditEntry[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("moderation_audit")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as ModerationAuditEntry[];
}

async function writeModerationAudit(input: {
  adminUserId: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  if (!admin) return;

  await admin.from("moderation_audit").insert({
    admin_user_id: input.adminUserId,
    admin_email: input.adminEmail,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    details: input.details ?? null,
  });
}

export async function addModerationWord(input: {
  adminUserId: string;
  adminEmail: string;
  categorySlug: ModerationCategorySlug;
  word: string;
}) {
  const admin = createAdminClient();
  if (!admin) return { error: "Moderation service unavailable." };

  const trimmed = input.word.trim().toLowerCase();
  if (!trimmed) return { error: "Word is required." };

  const { data: category } = await admin
    .from("moderation_categories")
    .select("id")
    .eq("slug", input.categorySlug)
    .maybeSingle();

  if (!category?.id) return { error: "Category not found." };

  const { data, error } = await admin
    .from("moderation_words")
    .insert({ category_id: category.id, word: trimmed })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "That word is already in this category." };
    return { error: error.message };
  }

  invalidateModerationCache();
  await writeModerationAudit({
    adminUserId: input.adminUserId,
    adminEmail: input.adminEmail,
    action: "add_word",
    targetType: "moderation_word",
    targetId: data.id,
    details: { word: trimmed, category: input.categorySlug },
  });

  return { success: true as const };
}

export async function removeModerationWord(input: {
  adminUserId: string;
  adminEmail: string;
  wordId: string;
}) {
  const admin = createAdminClient();
  if (!admin) return { error: "Moderation service unavailable." };

  const { data: existing } = await admin
    .from("moderation_words")
    .select("word, category:moderation_categories(slug)")
    .eq("id", input.wordId)
    .maybeSingle();

  const { error } = await admin.from("moderation_words").delete().eq("id", input.wordId);
  if (error) return { error: error.message };

  invalidateModerationCache();
  await writeModerationAudit({
    adminUserId: input.adminUserId,
    adminEmail: input.adminEmail,
    action: "remove_word",
    targetType: "moderation_word",
    targetId: input.wordId,
    details: {
      word: existing?.word,
      category: (existing?.category as { slug?: string } | null)?.slug,
    },
  });

  return { success: true as const };
}

export async function setModerationCategoryEnabled(input: {
  adminUserId: string;
  adminEmail: string;
  categorySlug: ModerationCategorySlug;
  enabled: boolean;
}) {
  const admin = createAdminClient();
  if (!admin) return { error: "Moderation service unavailable." };

  const { data, error } = await admin
    .from("moderation_categories")
    .update({ enabled: input.enabled })
    .eq("slug", input.categorySlug)
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Category not found." };

  invalidateModerationCache();
  await writeModerationAudit({
    adminUserId: input.adminUserId,
    adminEmail: input.adminEmail,
    action: input.enabled ? "enable_category" : "disable_category",
    targetType: "moderation_category",
    targetId: data.id,
    details: { category: input.categorySlug },
  });

  return { success: true as const };
}

export { invalidateModerationCache };
