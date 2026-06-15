"use client";

import { formatLinkHostname, normalizeLinkUrl } from "@/lib/links";
import { getLinkAnimationClass } from "@/lib/settings";
import type { ProfileLink } from "@/lib/types/link";
import type { ProfileSettings } from "@/lib/types/settings";
import { LinkIcon } from "@/components/icons/social-icons";
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
  const animation = link.animation ?? settings.link_animation ?? "none";
  const animClass = getLinkAnimationClass(animation);
  const hoverClass = settings.hover_animations
    ? "transition-all duration-200 hover:scale-[1.015] hover:brightness-110"
    : "";

  return (
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
        borderRadius: settings.border_radius,
      }}
    >
      <span className="flex items-center gap-3 text-sm font-medium">
        <LinkIcon
          platform={link.icon}
          size={18}
          monochrome={settings.links_monochrome}
          monoColor={settings.text_color}
        />
        {link.title}
      </span>
      <span className="text-xs opacity-0 transition-opacity group-hover:opacity-50">
        {formatLinkHostname(link.url)}
      </span>
    </a>
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

  return (
    <div className="bf-profile-icon-row mb-4 flex flex-wrap gap-2">
      {links.slice(0, 8).map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackLinkClick(profileId, link.id)}
          title={link.title}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] transition-colors hover:border-[var(--bf-accent,#fafafa)]/30 hover:bg-[var(--bf-accent,#fafafa)]/[0.06]"
        >
          <LinkIcon
            platform={link.icon}
            size={16}
            monochrome={settings.links_monochrome}
            monoColor={settings.text_color}
          />
        </a>
      ))}
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

  const hoverClass = settings.hover_animations
    ? "transition-all duration-200 hover:scale-110"
    : "transition-opacity hover:opacity-100";

  return (
    <div className="bf-profile-icon-row mb-4 flex flex-wrap gap-3">
      {links.slice(0, 8).map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackLinkClick(profileId, link.id)}
          aria-label={link.title}
          className={`flex items-center justify-center opacity-80 ${hoverClass}`}
        >
          <LinkIcon
            platform={link.icon}
            size={18}
            monochrome={settings.links_monochrome}
            monoColor={settings.text_color}
          />
        </a>
      ))}
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
