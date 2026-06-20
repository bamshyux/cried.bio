"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { revalidateProfileOg } from "@/lib/og/revalidate";

export async function revalidateUserProfile(userId: string, extraPaths: string[] = []) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  revalidatePath("/dashboard", "layout");
  for (const path of extraPaths) revalidatePath(path);
  if (profile?.username) {
    revalidatePath(`/${profile.username}`);
    revalidateProfileOg(profile.username);
  }
}

export async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}
