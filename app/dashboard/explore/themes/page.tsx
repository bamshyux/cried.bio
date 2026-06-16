import { redirect } from "next/navigation";
import { CommunityThemesShell } from "@/components/dashboard/community-themes/community-themes-shell";
import {
  getFeaturedCommunityThemeSections,
  getMyPublishedThemes,
  searchCommunityThemes,
} from "@/lib/data/community-themes";
import { createClient } from "@/lib/supabase/server";

export default async function CommunityThemesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;

  const [initial, featured, myPublished] = await Promise.all([
    searchCommunityThemes({ page: 1, userId }),
    getFeaturedCommunityThemeSections(userId),
    getMyPublishedThemes(userId),
  ]);

  return (
    <CommunityThemesShell
      userId={userId}
      initial={initial}
      featured={featured}
      myPublished={myPublished}
    />
  );
}
