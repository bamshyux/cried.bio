"use client";

import { getFontCss, getGoogleFontsUrl } from "@/lib/settings";
import type { MusicTrack } from "@/lib/data/music-tracks";
import type { ProfilePage } from "@/lib/profile-pages/slug";
import type { ProfileEmbed } from "@/lib/types/embed";
import type { FeaturedBlock } from "@/lib/types/featured";
import type { ProfileLink } from "@/lib/types/link";
import type { ProfileSettings } from "@/lib/types/settings";
import { CardBorderEffect } from "@/components/profile/card-border-effect";
import { buildCardStyle } from "./layout-primitives";
import { AnalyticsTracker } from "./analytics-tracker";
import { ContentPageSections } from "./content-page-sections";
import { MusicPlayer } from "./music-player";
import { ParticleCanvas } from "./particle-canvas";
import { ProfileBackground } from "./profile-background";
import { ProfileBio } from "./profile-bio";
import { ProfilePageNav } from "./profile-page-nav";
import { ProfileSiteChrome } from "./profile-site-chrome";
import { CursorEffectCanvas, CustomProfileCursor } from "./profile-effects";
import { ProfileTabBranding } from "./profile-tab-branding";

export function PublicContentPageClient({
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
  const fontCss = getFontCss(settings.font_family);
  const fontUrl = getGoogleFontsUrl(settings.font_family);
  const showParticles =
    (settings.background_type === "particles" || settings.particle_effect) &&
    settings.particle_effect;
  const pageTitle = page.label || page.slug;

  const siteNav =
    navPages.length > 0 ? (
      <ProfilePageNav
        username={username}
        homeLabel={displayName}
        pages={navPages}
        activeSlug={page.slug}
        position={settings.page_nav_position}
      />
    ) : null;

  return (
    <>
      <ProfileTabBranding
        username={username}
        displayName={pageTitle}
        faviconUrl={settings.profile_favicon_url}
        tabTitleAnimation={settings.tab_title_animation}
      />
      {fontUrl ? <link rel="stylesheet" href={fontUrl} /> : null}
      <ProfileBackground settings={settings} />
      {showParticles && settings.particle_effect ? (
        <ParticleCanvas effect={settings.particle_effect} />
      ) : null}
      <AnalyticsTracker profileId={profileId} />
      <CursorEffectCanvas effect={settings.cursor_effect} color={settings.accent_color} />
      {settings.cursor_image_url ? (
        <CustomProfileCursor
          imageUrl={settings.cursor_image_url}
          maxSize={settings.cursor_image_size}
        />
      ) : null}

      <div
        className={`relative z-10 flex min-h-screen flex-col ${settings.cursor_image_url ? "bf-custom-cursor-active" : ""}`}
        style={
          {
            color: settings.text_color,
            fontFamily: fontCss,
            "--bf-accent": settings.accent_color,
          } as React.CSSProperties
        }
      >
        <ProfileSiteChrome
          navPosition={settings.page_nav_position}
          siteNav={siteNav}
          centerContent={false}
          mainClassName="!items-start !justify-center !py-24 sm:!py-28"
        >
          <div className="mx-auto w-full max-w-2xl">
            <CardBorderEffect
              settings={settings}
              target="main"
              borderRadius={settings.border_radius}
              className="w-full"
            >
              <div className="w-full px-6 py-8 sm:px-8 sm:py-10" style={buildCardStyle(settings)}>
                <div className="mb-6 flex items-center gap-3">
                  {page.icon ? (
                    <span className="text-2xl leading-none" aria-hidden>
                      {page.icon}
                    </span>
                  ) : null}
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{pageTitle}</h1>
                </div>

                {page.bio?.trim() ? (
                  <ProfileBio text={page.bio} settings={settings} />
                ) : null}

                <ContentPageSections
                  links={links}
                  settings={settings}
                  embeds={embeds}
                  featured={featured}
                  profileId={profileId}
                  hasPageText={Boolean(page.bio?.trim())}
                />
              </div>
            </CardBorderEffect>
          </div>
        </ProfileSiteChrome>
      </div>

      {settings.music_url || musicTracks.length > 0 ? (
        <MusicPlayer settings={settings} tracks={musicTracks} />
      ) : null}
    </>
  );
}
