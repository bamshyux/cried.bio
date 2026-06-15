import { createClient } from "@/lib/supabase/server";
import { mergeSettings } from "@/lib/settings";
import type { ProfileSettings } from "@/lib/types/settings";

export async function getSettingsByProfileId(
  profileId: string,
): Promise<ProfileSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_settings")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  const row = data as Partial<ProfileSettings> | null;
  if (row?.gradient_colors && typeof row.gradient_colors === "string") {
    try {
      row.gradient_colors = JSON.parse(row.gradient_colors as unknown as string);
    } catch {
      row.gradient_colors = undefined;
    }
  }

  return mergeSettings(row, profileId);
}
