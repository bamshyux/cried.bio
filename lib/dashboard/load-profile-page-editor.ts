import { notFound, redirect } from "next/navigation";
import { getProfilePageById, getSettingsByPageId } from "@/lib/data/profile-pages";
import { getProfileByUserId } from "@/lib/data/profiles";
import { requireEntitlement } from "@/lib/premium/entitlements";
import { createClient } from "@/lib/supabase/server";

export async function loadProfilePageEditor(pageId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const gate = await requireEntitlement(userId, "can_use_multiple_profiles");
  if (!gate.ok) redirect("/dashboard/pages");

  const [page, profile, settings] = await Promise.all([
    getProfilePageById(userId, pageId),
    getProfileByUserId(userId),
    getSettingsByPageId(userId, pageId),
  ]);

  if (!page) notFound();

  return { userId, page, profile, settings, entitlements: gate.entitlements };
}
