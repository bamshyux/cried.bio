import { createClient } from "@/lib/supabase/server";
import {
  DATABASE_UNAVAILABLE_USER_MESSAGE,
  isDatabaseUnavailableError,
  isGenuineSchemaError,
  logDatabaseError,
} from "@/lib/db/errors";
import { formatSchemaError } from "@/lib/db/schema";

const MIGRATION_HINT =
  "Page settings could not be saved. Run supabase/v82_profile_settings_pages.sql in the Supabase SQL Editor, then try again.";

function isPageSettingsSchemaError(message: string) {
  return (
    message.includes("duplicate key") ||
    message.includes("profile_settings_pkey") ||
    message.includes("unique constraint")
  );
}

export async function ensureProfileSettingsRow(
  profileId: string,
  pageId?: string | null,
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    let query = supabase.from("profile_settings").select("id").eq("profile_id", profileId);
    query = pageId ? query.eq("page_id", pageId) : query.is("page_id", null);
    const { data, error: selectError } = await query.maybeSingle();

    if (selectError) {
      logDatabaseError("ensureProfileSettingsRow select", selectError);
      if (isDatabaseUnavailableError(selectError)) {
        return { error: DATABASE_UNAVAILABLE_USER_MESSAGE };
      }
      return { error: formatSchemaError(selectError.message) };
    }

    if (data) return {};

    const { error } = await supabase.from("profile_settings").insert(
      pageId ? { profile_id: profileId, page_id: pageId } : { profile_id: profileId },
    );

    if (!error) return {};

    logDatabaseError("ensureProfileSettingsRow insert", error);
    if (isDatabaseUnavailableError(error)) {
      return { error: DATABASE_UNAVAILABLE_USER_MESSAGE };
    }

    if (pageId && isPageSettingsSchemaError(error.message)) {
      return { error: MIGRATION_HINT };
    }

    return { error: formatSchemaError(error.message) };
  } catch (error) {
    logDatabaseError("ensureProfileSettingsRow", error);
    if (isGenuineSchemaError(error) && !isDatabaseUnavailableError(error)) {
      return { error: formatSchemaError(error instanceof Error ? error.message : String(error)) };
    }
    return { error: DATABASE_UNAVAILABLE_USER_MESSAGE };
  }
}

export { MIGRATION_HINT as PAGE_SETTINGS_MIGRATION_HINT };
