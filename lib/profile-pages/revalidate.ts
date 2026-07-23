import { revalidatePath } from "next/cache";
import { revalidateProfileOg } from "@/lib/og/revalidate";
import { createClient } from "@/lib/supabase/server";
import { getProfilePageById } from "@/lib/data/profile-pages";

export async function revalidateProfilePagePaths(profileId: string, pageId: string) {
  const supabase = await createClient();
  const [{ data: profile }, page] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", profileId).maybeSingle(),
    getProfilePageById(profileId, pageId),
  ]);

  revalidatePath("/dashboard/profile-pages");
  revalidatePath(`/dashboard/profile-pages/${pageId}`, "layout");

  if (profile?.username) {
    revalidatePath(`/${profile.username}`);
    if (page?.slug) {
      revalidatePath(`/${profile.username}/${page.slug}`);
    }
    revalidateProfileOg(profile.username);
  }
}
