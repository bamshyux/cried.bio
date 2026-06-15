"use server";

import { requireSuperAdmin } from "@/lib/auth/super-admin";
import {
  addModerationWord,
  listModerationAudit,
  listModerationCategories,
  listModerationLogs,
  listModerationWords,
  removeModerationWord,
  setModerationCategoryEnabled,
} from "@/lib/data/moderation";
import type { ModerationCategorySlug } from "@/lib/moderation/constants";

export type ModerationActionState = {
  error?: string;
  success?: string;
};

async function guardSuperAdmin() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return { error: auth.error } as const;
  return auth;
}

export async function getModerationDashboardData() {
  const auth = await guardSuperAdmin();
  if ("error" in auth) return { error: auth.error };

  const [categories, words, logs, audit] = await Promise.all([
    listModerationCategories(),
    listModerationWords(),
    listModerationLogs(100),
    listModerationAudit(100),
  ]);

  return { categories, words, logs, audit };
}

export async function addBannedWordAction(
  categorySlug: ModerationCategorySlug,
  word: string,
): Promise<ModerationActionState> {
  const auth = await guardSuperAdmin();
  if ("error" in auth) return { error: auth.error };

  const result = await addModerationWord({
    adminUserId: auth.userId,
    adminEmail: auth.email,
    categorySlug,
    word,
  });

  if ("error" in result && result.error) return { error: result.error };
  return { success: "Banned word added." };
}

export async function removeBannedWordAction(wordId: string): Promise<ModerationActionState> {
  const auth = await guardSuperAdmin();
  if ("error" in auth) return { error: auth.error };

  const result = await removeModerationWord({
    adminUserId: auth.userId,
    adminEmail: auth.email,
    wordId,
  });

  if ("error" in result && result.error) return { error: result.error };
  return { success: "Banned word removed." };
}

export async function toggleModerationCategoryAction(
  categorySlug: ModerationCategorySlug,
  enabled: boolean,
): Promise<ModerationActionState> {
  const auth = await guardSuperAdmin();
  if ("error" in auth) return { error: auth.error };

  const result = await setModerationCategoryEnabled({
    adminUserId: auth.userId,
    adminEmail: auth.email,
    categorySlug,
    enabled,
  });

  if ("error" in result && result.error) return { error: result.error };
  return { success: enabled ? "Category enabled." : "Category disabled." };
}
