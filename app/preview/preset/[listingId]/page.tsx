import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PublicProfileView } from "@/components/profile/public-profile";
import { getBadgesByProfileId } from "@/lib/data/badges";
import {
  getCommunityThemeListingById,
  getPresetPreviewData,
} from "@/lib/data/community-themes";
import { getProfileByUserId } from "@/lib/data/profiles";
import {
  buildProfileViewFromPreset,
  guestbookEntriesForPresetPreview,
} from "@/lib/profile-presets/preview";
import { parsePresetData } from "@/lib/profile-presets/snapshot";
import { createClient } from "@/lib/supabase/server";

export default async function CommunityPresetPreviewPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims) redirect("/login");

  const userId = authData.claims.sub as string;
  const { listingId } = await params;

  const listing = await getCommunityThemeListingById(listingId, userId);
  if (!listing || listing.listing_type !== "profile_preset") notFound();

  const isPublic = listing.visibility === "public" || listing.visibility === "open_source";
  if (!isPublic && listing.author_id !== userId) notFound();

  const preset = await getPresetPreviewData(listingId, userId);
  const presetData = preset?.preset_data ? parsePresetData(preset.preset_data) : null;
  if (!presetData) notFound();

  const baseProfile = await getProfileByUserId(userId);
  if (!baseProfile?.username) redirect("/dashboard/profile");

  const badges = await getBadgesByProfileId(userId);
  const preview = buildProfileViewFromPreset({
    baseProfile,
    baseBadges: badges,
    presetData,
    preserveViewerIdentity: true,
  });

  const previewGuestbook = guestbookEntriesForPresetPreview(
    baseProfile.id,
    preview.settings,
    [],
    false,
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#090909]">
      <div className="sticky top-0 z-50 flex shrink-0 items-center justify-between gap-4 border-b border-violet-500/25 bg-[#120818]/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <p className="min-w-0 text-sm text-violet-100">
          <span className="font-semibold text-white">Preview mode</span>
          {" — "}
          Viewing <span className="font-medium text-white">{listing.title}</span> on your profile.
          Nothing has been saved.
        </p>
        <Link
          href="/dashboard/explore/themes"
          className="shrink-0 rounded-lg border border-violet-500/30 px-3 py-1.5 text-xs text-violet-100 transition-colors hover:border-violet-400/50 hover:text-white"
        >
          Back to themes
        </Link>
      </div>

      <div className="relative min-h-0 flex-1">
        <PublicProfileView
          profile={preview.profile}
          links={preview.links}
          settings={preview.settings}
          badges={preview.badges}
          viewCount={0}
          embeds={preview.embeds}
          featured={preview.featured}
          guestbook={previewGuestbook}
          activity={[]}
          friends={[]}
          followerCount={0}
          followingCount={0}
          isFollowing={false}
          isLoggedIn
          currentUserId={userId}
          discordPresence={null}
          scopedCustomCss={preview.scopedCustomCss}
          presetPreviewMode
        />
      </div>
    </div>
  );
}
