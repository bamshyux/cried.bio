import { revalidatePath } from "next/cache";
import { revalidateProfileOg } from "@/lib/og/revalidate";
import { createClient } from "@/lib/supabase/server";

export async function revalidateMusicProfilePaths(userId: string, pageId?: string | null) {
  revalidatePath("/dashboard/music");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  if (pageId) {
    const { revalidateProfilePagePaths } = await import("@/lib/profile-pages/revalidate");
    await revalidateProfilePagePaths(userId, pageId);
    return;
  }

  if (profile?.username) {
    revalidatePath(`/${profile.username}`);
    revalidateProfileOg(profile.username);
  }
}
