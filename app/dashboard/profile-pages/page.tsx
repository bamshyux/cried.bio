import { redirect } from "next/navigation";
import { ProfilePagesShell } from "@/components/dashboard/profile-pages-shell";
import { getProfilePages } from "@/lib/data/profile-pages";
import { getProfileByUserId } from "@/lib/data/profiles";
import { getUserEntitlements } from "@/lib/premium/entitlements";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePagesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const [pages, profile, entitlements] = await Promise.all([
    getProfilePages(userId),
    getProfileByUserId(userId),
    getUserEntitlements(userId),
  ]);

  return (
    <ProfilePagesShell
      pages={pages}
      username={profile?.username ?? null}
      entitlements={entitlements}
    />
  );
}
