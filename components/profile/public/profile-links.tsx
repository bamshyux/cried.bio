"use client";

import { formatLinkHostname, getLinksIconBoxSize } from "@/lib/links";
import { buildLinkAnimationProps, resolveLinkAnimation } from "@/lib/link-animation";
import { buildLinkIconProps } from "@/lib/link-icon-effects";
import {
  getLinksSpacingClass,
  resolveIconBoxAppearance,
  resolveLinkButtonAppearance,
} from "@/lib/links-display";
import type { ProfileLink } from "@/lib/types/link";
import type { ProfileSettings } from "@/lib/types/settings";
import { LinkIcon } from "@/components/icons/social-icons";
import { CardBorderEffect } from "@/components/profile/card-border-effect";
import { cardBorderEffectStripsDefaultBorder } from "@/lib/card-border-effects/resolve";
import { useProfileLinkClick } from "./external-link-confirm";

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
  const handleLinkClick = useProfileLinkClick(profileId);
  const { animClass, hoverClass, animStyle } = buildLinkAnimationProps(link, settings);
  const iconSize = settings.links_icon_size;
  const stripLinkBorder = cardBorderEffectStripsDefaultBorder(settings, "links");
  const appearance = resolveLinkButtonAppearance(settings, link, featured);
  const showBorder = appearance.showBorder && !stripLinkBorder;
  const hostnameVisible = settings.links_show_hostname;

  return (
    <CardBorderEffect settings={settings} target="links" borderRadius={appearance.borderRadius}>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => handleLinkClick(event, link)}
        className={`profile-link group flex items-center justify-between px-4 py-3 transition-colors ${animClass} ${hoverClass} ${
          showBorder ? "border" : ""
        } ${featured ? "border-[var(--bf-accent,#fafafa)]/30" : ""}`}
        style={{
          color: appearance.color,
          backgroundColor: appearance.backgroundColor,
          borderColor: showBorder ? appearance.borderColor : undefined,
          borderWidth: showBorder ? appearance.borderWidth : undefined,
          border: stripLinkBorder ? "none" : undefined,
          borderRadius: appearance.borderRadius,
          ...animStyle,
        }}
      >
        <span className="flex min-w-0 items-center gap-3 text-sm font-medium">
          <LinkIcon {...buildLinkIconProps(link.icon, settings, iconSize)} />
          <span className="truncate">{link.title}</span>
        </span>
        <span
          className={`ml-3 shrink-0 text-xs transition-opacity ${
            hostnameVisible ? "opacity-45" : "opacity-0 group-hover:opacity-45"
          }`}
        >
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

  const spacing = getLinksSpacingClass(settings.links_spacing);

  return (
    <div className={`profile-links bf-profile-block w-full ${spacing.stack}`}>
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

  const handleLinkClick = useProfileLinkClick(profileId);
  const iconSize = settings.links_icon_size;
  const boxSize = getLinksIconBoxSize(iconSize);
  const spacing = getLinksSpacingClass(settings.links_spacing);
  const boxAppearance = resolveIconBoxAppearance(settings);

  return (
    <div className={`bf-profile-icon-row mb-4 flex flex-wrap ${spacing.row}`}>
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
            onClick={(event) => handleLinkClick(event, link)}
            title={link.title}
            className={`profile-link flex items-center justify-center rounded-lg border transition-colors ${boxAppearance.className} ${iconAnimClass}`}
            style={{
              width: boxSize,
              height: boxSize,
              borderRadius: settings.links_border_radius > 0 ? settings.links_border_radius : settings.border_radius,
              ...(animation === "glow" ? {} : animStyle),
              ...boxAppearance.style,
            }}
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

  const handleLinkClick = useProfileLinkClick(profileId);
  const iconSize = settings.links_icon_size;
  const spacing = getLinksSpacingClass(settings.links_spacing);

  return (
    <div className={`bf-profile-icon-row mb-4 flex flex-wrap ${spacing.row}`}>
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
            onClick={(event) => handleLinkClick(event, link)}
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
