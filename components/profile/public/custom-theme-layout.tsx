"use client";

import type { LayoutProps } from "./layout-primitives";
import { ProfileAvatar, ProfileHandle, ProfileMainContent, ProfileMeta, Username, getDisplayName, getLayoutBadges, pickMainContentProps } from "./layout-primitives";
import { BadgeRow } from "@/components/badges/badge-ui";

/** Minimal layout shell for custom CSS themes — styling comes from user CSS only. */
export function CustomThemeLayout(props: LayoutProps) {
  const { profile, links, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);
  const bannerStyle = profile.banner_url
    ? { backgroundImage: `url(${profile.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: `linear-gradient(135deg, ${settings.gradient_colors.join(", ")})` };

  return (
    <div className="profile-card w-full overflow-hidden">
      <div className="profile-banner h-28 sm:h-32" style={bannerStyle} />
      <div className="profile-body px-6 pb-6 pt-4">
        <div className="profile-header bf-profile-avatar-row mb-4 flex items-end gap-4">
          <ProfileAvatar
            profile={profile}
            displayName={displayName}
            accentColor={settings.accent_color}
            settings={settings}
            className="profile-avatar h-24 w-24"
          />
          <div className="pb-1">
            <div className="bf-profile-name-row profile-badges-wrap">
              <Username
                name={displayName}
                settings={settings}
                profile={profile}
                className="username text-2xl font-semibold tracking-tight sm:text-3xl"
              />
              <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
            </div>
            <ProfileHandle profile={profile} settings={settings} className="profile-handle mb-3" />
          </div>
        </div>
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} className="profile-meta" />
        <ProfileMainContent {...pickMainContentProps(props)} />
      </div>
    </div>
  );
}
