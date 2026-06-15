import type { DiscordPresence } from "@/lib/discord/types";
import type { ActivityEvent } from "@/lib/types/activity";
import type { FeaturedBlock } from "@/lib/types/featured";
import type { GuestbookEntry } from "@/lib/types/guestbook";
import type { ProfileEmbed } from "@/lib/types/embed";
import type { ProfileLink } from "@/lib/types/link";
import type { Profile } from "@/lib/types/profile";
import type { ProfileSettings } from "@/lib/types/settings";
import type { SocialProfile } from "@/lib/types/social";
import { shouldShowDiscordStatus } from "@/lib/discord/fallback-presence";
import { DiscordStatusWidget } from "./discord-status-widget";
import { ProfileActivitySection } from "./profile-activity";
import { ProfileEmbedsSection } from "./profile-embeds";
import { ProfileFeaturedSection } from "./profile-featured";
import { ProfileGuestbookSection } from "./profile-guestbook";
import { ProfileFriendsSection, ProfileSocialBar, ProfileStatusLine } from "./profile-social";
import { ProfileLinks, SocialIconRow } from "./profile-links";
import { TypingBio } from "./profile-effects";

export function ProfileContentSections({
  profile,
  links,
  settings,
  embeds,
  featured,
  guestbook,
  activity,
  friends,
  followerCount,
  followingCount,
  isFollowing,
  isLoggedIn,
  currentUserId,
  hideBio = false,
  discordPresence = null,
}: {
  profile: Profile;
  links: ProfileLink[];
  settings: ProfileSettings;
  embeds: ProfileEmbed[];
  featured: FeaturedBlock[];
  guestbook: GuestbookEntry[];
  activity: ActivityEvent[];
  friends: SocialProfile[];
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isLoggedIn: boolean;
  currentUserId?: string | null;
  hideBio?: boolean;
  discordPresence?: DiscordPresence | null;
}) {
  return (
    <>
      <ProfileStatusLine settings={settings} />
      {shouldShowDiscordStatus(settings) && (
        <DiscordStatusWidget settings={settings} initialPresence={discordPresence} />
      )}
      {profile.username && (
        <ProfileSocialBar
          profileId={profile.id}
          username={profile.username}
          followerCount={followerCount}
          followingCount={followingCount}
          isFollowing={isFollowing}
          isLoggedIn={isLoggedIn}
          showCounts={settings.show_follow_counts}
          currentUserId={currentUserId}
        />
      )}
      <ProfileFriendsSection friends={friends} visibility={settings.friends_visibility} />
      {!hideBio && profile.bio && (
        <div className="bf-profile-block bf-profile-bio-block profile-bio mb-5 max-w-2xl text-neutral-300">
          <TypingBio text={profile.bio} enabled={settings.typing_bio} />
        </div>
      )}
      <ProfileEmbedsSection embeds={embeds} settings={settings} />
      <ProfileFeaturedSection blocks={featured} settings={settings} />
      {settings.links_style === "icons" ? (
        <SocialIconRow links={links} settings={settings} profileId={profile.id} />
      ) : (
        <LinksSectionInner links={links} settings={settings} profileId={profile.id} />
      )}
      <ProfileActivitySection events={activity} enabled={settings.show_activity} />
      <ProfileGuestbookSection
        profileId={profile.id}
        settings={settings}
        entries={guestbook}
        currentUserId={currentUserId}
      />
    </>
  );
}

function LinksSectionInner({
  links,
  settings,
  profileId,
}: {
  links: ProfileLink[];
  settings: ProfileSettings;
  profileId: string;
}) {
  if (links.length === 0) {
    return <p className="text-sm text-neutral-600">No links yet.</p>;
  }

  const featured = links.find((l) => l.is_featured);
  const rest = featured ? links.filter((l) => l.id !== featured.id) : links;

  if (!featured) {
    return <ProfileLinks links={links} settings={settings} profileId={profileId} />;
  }

  return (
    <>
      <div className="mb-4">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-neutral-500">Featured link</p>
        <ProfileLinks links={[featured]} settings={settings} profileId={profileId} featured />
      </div>
      {rest.length > 0 && <ProfileLinks links={rest} settings={settings} profileId={profileId} />}
    </>
  );
}
