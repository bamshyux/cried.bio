import type { ProfileEmbed } from "@/lib/types/embed";
import type { FeaturedBlock } from "@/lib/types/featured";
import type { ProfileLink } from "@/lib/types/link";
import type { ProfileSettings } from "@/lib/types/settings";
import { ProfileEmbedsSection } from "./profile-embeds";
import { ProfileFeaturedSection } from "./profile-featured";
import { ProfileLinks, SocialIconOnlyRow, SocialIconRow } from "./profile-links";

export function ContentPageSections({
  links,
  settings,
  embeds,
  featured,
  profileId,
  hasPageText = false,
}: {
  links: ProfileLink[];
  settings: ProfileSettings;
  embeds: ProfileEmbed[];
  featured: FeaturedBlock[];
  profileId: string;
  hasPageText?: boolean;
}) {
  const hasContent =
    hasPageText || links.length > 0 || embeds.length > 0 || featured.length > 0;

  if (!hasContent) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500">
        This page is empty. Add text, links, or other content from your dashboard.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <ProfileEmbedsSection embeds={embeds} settings={settings} />
      <ProfileFeaturedSection blocks={featured} settings={settings} />
      {settings.links_style === "icons" ? (
        <SocialIconRow links={links} settings={settings} profileId={profileId} />
      ) : settings.links_style === "icons_only" ? (
        <SocialIconOnlyRow links={links} settings={settings} profileId={profileId} />
      ) : links.length > 0 ? (
        <ProfileLinks links={links} settings={settings} profileId={profileId} />
      ) : null}
    </div>
  );
}
