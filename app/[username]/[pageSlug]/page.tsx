import { notFound } from "next/navigation";
import { PublicContentPageView } from "@/components/profile/public-content-page";
import { ProfileFaviconLinks } from "@/components/profile/profile-favicon-links";
import { getMusicTracks } from "@/lib/data/music-tracks";
import {
  getProfilePageBySlug,
  getPublishedProfilePages,
  getSettingsByPageId,
  getLinksByPageId,
  getEmbedsByPageId,
  getFeaturedBlocksByPageId,
} from "@/lib/data/profile-pages";
import { getProfileByUsername } from "@/lib/data/profiles";
import { getProfileVisibility } from "@/lib/data/account-settings";
import { isValidUsername, normalizeUsername } from "@/lib/profile";
import { isValidPageSlug, normalizePageSlug } from "@/lib/profile-pages/slug";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ username: string; pageSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, pageSlug } = await params;
  const profile = await getProfileByUsername(normalizeUsername(username));
  if (!profile) return { title: "Page Not Found — cried.bio" };
  const page = await getProfilePageBySlug(profile.id, normalizePageSlug(pageSlug));
  const label = page?.label || page?.slug || pageSlug;
  return {
    title: `${label} — ${profile.display_name || profile.username} — cried.bio`,
  };
}

export default async function ContentPage({ params }: PageProps) {
  const { username, pageSlug } = await params;
  const normalized = normalizeUsername(username);
  const slug = normalizePageSlug(pageSlug);

  if (!isValidUsername(normalized) || !isValidPageSlug(slug)) notFound();

  const profile = await getProfileByUsername(normalized);
  if (!profile) notFound();

  const page = await getProfilePageBySlug(profile.id, slug);
  if (!page) notFound();

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const currentUserId = authData?.claims?.sub as string | undefined;
  const isOwner = currentUserId === profile.id;

  const { getUserEntitlements } = await import("@/lib/premium/entitlements");
  const entitlements = await getUserEntitlements(profile.id);
  if (!entitlements.can_use_multiple_profiles && !isOwner) {
    notFound();
  }

  const visibility = await getProfileVisibility(profile.id);
  if (visibility === "private" && !isOwner) {
    notFound();
  }

  if (!page.published && !isOwner) {
    notFound();
  }

  const [settings, links, embeds, featured, musicTracks, navPages] = await Promise.all([
    getSettingsByPageId(profile.id, page.id),
    getLinksByPageId(profile.id, page.id),
    getEmbedsByPageId(profile.id, page.id),
    getFeaturedBlocksByPageId(profile.id, page.id),
    getMusicTracks(profile.id, page.id),
    getPublishedProfilePages(profile.id),
  ]);

  const { sanitizeSettingsForEntitlements, trimFeaturedForEntitlements } = await import(
    "@/lib/premium/sanitize-settings"
  );
  const publicSettings = sanitizeSettingsForEntitlements(settings, entitlements);
  const publicFeatured = trimFeaturedForEntitlements(
    featured as import("@/lib/types/featured").FeaturedBlock[],
    entitlements,
  );

  return (
    <>
      {publicSettings.profile_favicon_url ? (
        <ProfileFaviconLinks
          username={profile.username ?? normalized}
          faviconUrl={publicSettings.profile_favicon_url}
        />
      ) : null}
      <PublicContentPageView
        username={profile.username ?? normalized}
        displayName={profile.display_name?.trim() || profile.username || normalized}
        page={page}
        navPages={navPages}
        links={links as import("@/lib/types/link").ProfileLink[]}
        settings={publicSettings}
        embeds={embeds as import("@/lib/types/embed").ProfileEmbed[]}
        featured={publicFeatured}
        profileId={profile.id}
        musicTracks={musicTracks}
      />
    </>
  );
}
