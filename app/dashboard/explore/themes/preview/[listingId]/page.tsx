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
    <div className="min-h-screen bg-[#090909]">
      <div className="border-b border-white/[0.08] bg-[#0a0a0a]/95 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <p className="text-sm text-neutral-400">
            Previewing <span className="font-medium text-white">{listing.title}</span>
            {listing.creator_username ? (
              <>
                {" "}
                by <span className="text-neutral-300">@{listing.creator_username}</span>
              </>
            ) : null}
          </p>
          <Link
            href="/dashboard/explore/themes"
            className="shrink-0 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:border-white/[0.16] hover:text-white"
          >
            Back to themes
          </Link>
        </div>
      </div>

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
        presetPreviewTitle={listing.title}
      />
    </div>
  );
}
