"use client";

import { formatLinkHostname, getLinksIconBoxSize } from "@/lib/links";
import { getCardBorderInnerRadius } from "@/lib/card-border-effects/resolve";
import { buildLinkAnimationProps, resolveLinkAnimation } from "@/lib/link-animation";
import { buildLinkIconProps } from "@/lib/link-icon-effects";
import type { ProfileLink } from "@/lib/types/link";
import type { ProfileSettings } from "@/lib/types/settings";
import { LinkIcon } from "@/components/icons/social-icons";
import { CardBorderEffect } from "@/components/profile/card-border-effect";
import { trackLinkClick } from "./analytics-tracker";

export function ProfileLinkButton({
  link,
  settings,
  profileId,
  featured = false,
}: {
  link: ProfileLink;
  settings: ProfileSettings;
  profileId: string;
  featured?: boolean;
}) {
  const { animClass, hoverClass, animStyle } = buildLinkAnimationProps(link, settings);
  const iconSize = settings.links_icon_size;

  const linkRadius = getCardBorderInnerRadius(settings, "links");

  return (
    <CardBorderEffect settings={settings} target="links" borderRadius={settings.border_radius}>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackLinkClick(profileId, link.id)}
        className={`profile-link group flex items-center justify-between border px-4 py-3 ${animClass} ${hoverClass} ${
          featured ? "border-[var(--bf-accent,#fafafa)]/30 bg-[var(--bf-accent,#fafafa)]/[0.06]" : ""
        }`}
        style={{
          color: link.color ?? settings.text_color,
          backgroundColor: featured ? undefined : (link.background_color ?? "rgba(255,255,255,0.03)"),
          borderColor: featured ? undefined : `${settings.accent_color}15`,
          borderRadius: linkRadius,
          ...animStyle,
        }}
      >
        <span className="flex items-center gap-3 text-sm font-medium">
          <LinkIcon {...buildLinkIconProps(link.icon, settings, iconSize)} />
          {link.title}
        </span>
        <span className="text-xs opacity-0 transition-opacity group-hover:opacity-50">
          {formatLinkHostname(link.url)}
        </span>
      </a>
    </CardBorderEffect>
  );
}

export function ProfileLinks({
  links,
  settings,
  profileId,
  featured = false,
}: {
  links: ProfileLink[];
  settings: ProfileSettings;
  profileId: string;
  featured?: boolean;
}) {
  if (links.length === 0) return null;

  return (
    <div className="profile-links bf-profile-block w-full space-y-2">
      {links.map((link) => (
        <ProfileLinkButton
          key={link.id}
          link={link}
          settings={settings}
          profileId={profileId}
          featured={featured}
        />
      ))}
    </div>
  );
}

export function SocialIconRow({
  links,
  settings,
  profileId,
}: {
  links: ProfileLink[];
  settings: ProfileSettings;
  profileId: string;
}) {
  if (links.length === 0) return null;

  const iconSize = settings.links_icon_size;
  const boxSize = getLinksIconBoxSize(iconSize);

  return (
    <div className="bf-profile-icon-row mb-4 flex flex-wrap gap-2">
      {links.map((link) => {
        const animation = resolveLinkAnimation(link, settings);
        const { animClass, animStyle } = buildLinkAnimationProps(link, settings);
        const iconAnimClass = animation === "glow" ? "" : animClass;

        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackLinkClick(profileId, link.id)}
            title={link.title}
            className={`profile-link flex items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] transition-colors hover:border-[var(--bf-accent,#fafafa)]/30 hover:bg-[var(--bf-accent,#fafafa)]/[0.06] ${iconAnimClass}`}
            style={{ width: boxSize, height: boxSize, ...(animation === "glow" ? {} : animStyle) }}
          >
            <LinkIcon {...buildLinkIconProps(link.icon, settings, iconSize, animation)} />
          </a>
        );
      })}
    </div>
  );
}

export function SocialIconOnlyRow({
  links,
  settings,
  profileId,
}: {
  links: ProfileLink[];
  settings: ProfileSettings;
  profileId: string;
}) {
  if (links.length === 0) return null;

  const iconSize = settings.links_icon_size;

  return (
    <div className="bf-profile-icon-row mb-4 flex flex-wrap gap-3">
      {links.map((link) => {
        const animation = resolveLinkAnimation(link, settings);
        const { animClass, hasAnim, animStyle } = buildLinkAnimationProps(link, settings);
        const iconAnimClass = animation === "glow" ? "" : animClass;
        const hoverClass =
          settings.hover_animations && !hasAnim
            ? "transition-all duration-200 hover:scale-110"
            : "transition-opacity hover:opacity-100";

        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackLinkClick(profileId, link.id)}
            aria-label={link.title}
            className={`flex items-center justify-center opacity-80 ${hoverClass} ${iconAnimClass}`}
            style={animation === "glow" ? undefined : animStyle}
          >
            <LinkIcon {...buildLinkIconProps(link.icon, settings, iconSize, animation)} />
          </a>
        );
      })}
    </div>
  );
}

/** Split links for display: optional featured + remaining list */
export function splitLinksForDisplay(links: ProfileLink[]) {
  const featured = links.find((l) => l.is_featured);
  if (featured) {
    return { featured, rest: links.filter((l) => l.id !== featured.id) };
  }
  return { featured: null, rest: links };
}
