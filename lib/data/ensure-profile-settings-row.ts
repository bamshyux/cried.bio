import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  let query = supabase.from("profile_settings").select("id").eq("profile_id", profileId);
  query = pageId ? query.eq("page_id", pageId) : query.is("page_id", null);
  const { data } = await query.maybeSingle();

  if (data) return {};

  const { error } = await supabase.from("profile_settings").insert(
    pageId ? { profile_id: profileId, page_id: pageId } : { profile_id: profileId },
  );

  if (!error) return {};

  if (pageId && isPageSettingsSchemaError(error.message)) {
    return { error: MIGRATION_HINT };
  }

  return { error: error.message };
}

export { MIGRATION_HINT as PAGE_SETTINGS_MIGRATION_HINT };
