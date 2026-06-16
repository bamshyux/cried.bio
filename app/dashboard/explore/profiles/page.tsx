import { redirect } from "next/navigation";
import { ExploreProfilesShell } from "@/components/dashboard/explore-profiles/explore-profiles-shell";
import {
  getSuggestedExploreProfiles,
  searchExploreProfiles,
} from "@/lib/data/explore-profiles";
import { createClient } from "@/lib/supabase/server";

export default async function ExploreProfilesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;

  const [initial, suggested] = await Promise.all([
    searchExploreProfiles({ page: 1, excludeUserId: userId }),
    getSuggestedExploreProfiles(userId),
  ]);

  return <ExploreProfilesShell initial={initial} suggested={suggested} />;
}
