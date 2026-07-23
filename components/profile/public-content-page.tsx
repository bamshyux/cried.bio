import { PublicContentPageClient } from "./public/public-content-page-client";
import type { MusicTrack } from "@/lib/data/music-tracks";
import type { ProfilePage } from "@/lib/profile-pages/slug";
import type { ProfileEmbed } from "@/lib/types/embed";
import type { FeaturedBlock } from "@/lib/types/featured";
import type { ProfileLink } from "@/lib/types/link";
import type { ProfileSettings } from "@/lib/types/settings";

export function PublicContentPageView({
  username,
  displayName,
  page,
  navPages,
  links,
  settings,
  embeds,
  featured,
  profileId,
  musicTracks = [],
}: {
  username: string;
  displayName: string;
  page: ProfilePage;
  navPages: ProfilePage[];
  links: ProfileLink[];
  settings: ProfileSettings;
  embeds: ProfileEmbed[];
  featured: FeaturedBlock[];
  profileId: string;
  musicTracks?: MusicTrack[];
}) {
  return (
    <PublicContentPageClient
      username={username}
      displayName={displayName}
      page={page}
      navPages={navPages}
      links={links}
      settings={settings}
      embeds={embeds}
      featured={featured}
      profileId={profileId}
      musicTracks={musicTracks}
    />
  );
}
