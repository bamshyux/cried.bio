import { redirect } from "next/navigation";
import { ProfilePresetsShell } from "@/components/dashboard/profile-presets/profile-presets-shell";
import { getMyPublishedThemes } from "@/lib/data/community-themes";
import { getProfilePresetsByUserId, resolveAppliedPresetId } from "@/lib/data/profile-presets";
import { getProfileByUserId } from "@/lib/data/profiles";
import { getBadgesByProfileId } from "@/lib/data/badges";
import type { CommunityThemeListing } from "@/lib/types/community-theme";
import { createClient } from "@/lib/supabase/server";

function buildPresetListingMap(listings: CommunityThemeListing[]) {
  const map: Record<
    string,
    Pick<
      CommunityThemeListing,
      "id" | "title" | "description" | "tags" | "category" | "visibility" | "preview_image_url"
    >
  > = {};

  for (const listing of listings) {
    if (listing.listing_type !== "profile_preset" || !listing.profile_preset_id) continue;
    map[listing.profile_preset_id] = {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      tags: listing.tags,
      category: listing.category,
      visibility: listing.visibility,
      preview_image_url: listing.preview_image_url,
    };
  }

  return map;
}

export default async function ProfilePresetsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const [presets, activePresetId, myPublished, profile, earnedBadges] = await Promise.all([
    getProfilePresetsByUserId(userId),
    resolveAppliedPresetId(userId),
    getMyPublishedThemes(userId),
    getProfileByUserId(userId),
    getBadgesByProfileId(userId),
  ]);

  const presetListings = buildPresetListingMap(myPublished);

  return (
    <ProfilePresetsShell
      presets={presets}
      activePresetId={activePresetId}
      presetListings={presetListings}
      username={profile?.username ?? "user"}
      badges={earnedBadges}
    />
  );
}
