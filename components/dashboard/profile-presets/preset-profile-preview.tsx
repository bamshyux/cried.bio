"use client";

import { useMemo } from "react";
import { getProfileLayoutComponent } from "@/components/profile/public/public-profile-client";
import { ProfileBackground } from "@/components/profile/public/profile-background";
import { ProfileThemeScope } from "@/components/profile/public/profile-theme-scope";
import type { LayoutProps } from "@/components/profile/public/layout-primitives";
import { getProfileAlignClass, getFontCss, getGoogleFontsUrl } from "@/lib/settings";
import {
  buildProfileViewFromPreset,
  createPreviewBaseProfile,
} from "@/lib/profile-presets/preview";
import type { ProfileBadge } from "@/lib/types/badge";
import type { ProfilePresetData } from "@/lib/types/profile-preset";

const PREVIEW_WIDTH = 640;
const PREVIEW_SCALE = 0.36;

export function PresetProfilePreview({
  data,
  name,
  username = "user",
  badges = [],
}: {
  data: ProfilePresetData;
  name: string;
  username?: string;
  badges?: ProfileBadge[];
}) {
  const preview = useMemo(() => {
    const built = buildProfileViewFromPreset({
      baseProfile: createPreviewBaseProfile(username),
      baseBadges: badges,
      presetData: data,
    });

    if (!built.profile.display_name?.trim()) {
      built.profile.display_name = name;
    }

    return built;
  }, [badges, data, name, username]);

  const Layout = getProfileLayoutComponent(preview.settings.layout);
  const fontCss = getFontCss(preview.settings.font_family);
  const fontUrl = getGoogleFontsUrl(preview.settings.font_family);
  const alignClass = getProfileAlignClass(preview.settings.content_alignment);

  const layoutProps: LayoutProps = {
    profile: preview.profile,
    links: preview.links,
    settings: preview.settings,
    badges: preview.badges,
    viewCount: 128,
    embeds: preview.embeds,
    featured: preview.featured,
    guestbook: [],
    activity: [],
    friends: [],
    followerCount: 0,
    followingCount: 0,
    isFollowing: false,
    isLoggedIn: false,
    currentUserId: null,
    discordPresence: null,
  };

  return (
    <div className="relative h-[210px] w-full overflow-hidden bg-[#090909] sm:h-[230px]">
      {fontUrl ? <link rel="stylesheet" href={fontUrl} /> : null}
      <ProfileBackground settings={preview.settings} contained />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-3 origin-top"
          style={{
            width: PREVIEW_WIDTH,
            transform: `translateX(-50%) scale(${PREVIEW_SCALE})`,
          }}
        >
          <div
            className={`mx-auto w-full max-w-2xl ${alignClass}`}
            style={{
              color: preview.settings.text_color,
              fontFamily: fontCss,
              "--bf-accent": preview.settings.accent_color,
            } as React.CSSProperties}
          >
            <ProfileThemeScope
              scopedCss={preview.settings.layout === "custom" ? preview.scopedCustomCss : null}
            >
              <Layout {...layoutProps} />
            </ProfileThemeScope>
          </div>
        </div>
      </div>
    </div>
  );
}
