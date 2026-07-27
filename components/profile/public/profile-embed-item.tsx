"use client";

import type { ProfileEmbed } from "@/lib/types/embed";
import type { ProfileSettings } from "@/lib/types/settings";
import {
  aspectRatioClass,
  aspectRatioStyle,
  embedAlignmentClass,
  embedAlignmentStyle,
  embedCardStyle,
  embedContentPadding,
  embedMutedTextStyle,
  embedTextStyle,
  embedTitleClass,
  resolveEmbedTitle,
} from "@/lib/embeds/config";
import { getEmbedIframeSrc } from "@/lib/embeds/parse";
import { isRobloxLinkEmbed, robloxEmbedLinkLabel } from "@/lib/embeds/roblox-profile";
import { CardBorderEffect } from "@/components/profile/card-border-effect";
import { cardBorderEffectStripsDefaultBorder } from "@/lib/card-border-effects/resolve";
import type { CardBorderTarget } from "@/lib/card-border-effects/types";

function isSpotifyEmbed(embedType: ProfileEmbed["embed_type"]) {
  return embedType === "spotify_track" || embedType === "spotify_playlist";
}

function embedStyleWithBorderEffect(
  settings: ProfileSettings,
  config: ProfileEmbed["config"],
  target: CardBorderTarget,
) {
  const style = embedCardStyle(config, settings.accent_color);
  if (!cardBorderEffectStripsDefaultBorder(settings, target)) return style;
  return { ...style, border: "none", boxShadow: "none" };
}

function GenericLinkCard({
  embed,
  settings,
  minimal = false,
}: {
  embed: ProfileEmbed;
  settings: ProfileSettings;
  minimal?: boolean;
}) {
  const config = embed.config;
  const title = resolveEmbedTitle(embed);
  const style = embedCardStyle(config, settings.accent_color);
  const textStyle = embedTextStyle(config, settings.text_color);
  const mutedStyle = embedMutedTextStyle(config);
  const titleClass = embedTitleClass(config.title_size);

  if (minimal) {
    return (
      <a
        href={embed.url}
        target="_blank"
        rel="noopener noreferrer"
        className="profile-embed block text-sm transition-colors hover:text-white"
        style={{ ...textStyle, opacity: config.opacity / 100 }}
      >
        {title} →
      </a>
    );
  }

  return (
    <a
      href={embed.url}
      target="_blank"
      rel="noopener noreferrer"
      className="profile-embed block overflow-hidden transition-colors hover:opacity-95"
      style={style}
      data-embed-type={embed.embed_type}
    >
      <div className="flex items-center gap-4" style={embedContentPadding(config)}>
        <div className="min-w-0 flex-1" style={textStyle}>
          {config.show_title ? (
            <p className={`truncate text-white ${titleClass}`}>{title}</p>
          ) : null}
          {config.show_description ? (
            <p
              className={`truncate text-xs ${config.show_title ? "mt-1" : ""}`}
              style={mutedStyle.color ? mutedStyle : { color: "rgb(163 163 163)" }}
            >
              {config.description || embed.url}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 text-xs font-medium text-[var(--bf-accent)]">Open →</span>
      </div>
    </a>
  );
}

function RobloxCard({
  embed,
  settings,
}: {
  embed: ProfileEmbed;
  settings: ProfileSettings;
}) {
  const config = embed.config;
  const title = resolveEmbedTitle(embed);
  const style = embedStyleWithBorderEffect(settings, config, "roblox");
  const textStyle = embedTextStyle(config, settings.text_color);
  const mutedStyle = embedMutedTextStyle(config);
  const titleClass = embedTitleClass(config.title_size);
  const isProfile = embed.embed_type === "roblox_profile";
  const imageUrl = isProfile ? config.avatar_url : config.thumbnail_url;
  const showImage = isProfile ? config.show_avatar : config.show_thumbnail;
  const subtitle = isProfile
    ? config.show_username && config.username
      ? `@${config.username}`
      : robloxEmbedLinkLabel(embed.embed_type)
    : config.description || robloxEmbedLinkLabel(embed.embed_type);

  if (config.display_mode === "minimal") {
    return <GenericLinkCard embed={embed} settings={settings} minimal />;
  }

  return (
    <CardBorderEffect settings={settings} target="roblox" borderRadius={settings.border_radius}>
      <a
        href={embed.url}
        target="_blank"
        rel="noopener noreferrer"
        className="profile-embed block overflow-hidden transition-colors hover:opacity-95"
        style={style}
        data-embed-type={embed.embed_type}
      >
        <div
          className={`flex items-center gap-4 ${config.card_style === "minimal" ? "px-0 py-2" : ""}`}
          style={config.card_style === "minimal" ? undefined : embedContentPadding(config)}
        >
        {showImage && imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className={`shrink-0 rounded-xl object-cover ${isProfile ? "h-16 w-16" : "h-14 w-14"}`}
            draggable={false}
          />
        ) : null}
        <div className="min-w-0 flex-1" style={textStyle}>
          {config.show_title ? (
            <p className={`truncate text-white ${titleClass}`}>{title}</p>
          ) : null}
          {config.show_description ? (
            <p
              className={`truncate text-xs ${config.show_title ? "mt-1" : ""}`}
              style={mutedStyle.color ? mutedStyle : { color: "rgb(163 163 163)" }}
            >
              {subtitle}
            </p>
          ) : null}
          {config.description && !isProfile && config.show_description ? (
            <p
              className="mt-2 line-clamp-2 text-xs"
              style={mutedStyle.color ? mutedStyle : { color: "rgb(115 115 115)" }}
            >
              {config.description}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 text-xs font-medium text-[var(--bf-accent)]">Open →</span>
        </div>
      </a>
    </CardBorderEffect>
  );
}

function IframeEmbed({
  embed,
  settings,
  hostname,
}: {
  embed: ProfileEmbed;
  settings: ProfileSettings;
  hostname: string;
}) {
  const config = embed.config;
  const src = getEmbedIframeSrc(embed.embed_type, embed.embed_id, config, hostname);
  if (!src) return null;

  const title = resolveEmbedTitle(embed);
  const style = isSpotifyEmbed(embed.embed_type)
    ? embedStyleWithBorderEffect(settings, config, "spotify")
    : embedCardStyle(config, settings.accent_color);
  const textStyle = embedTextStyle(config, settings.text_color);
  const mutedStyle = embedMutedTextStyle(config);
  const titleClass = embedTitleClass(config.title_size);
  const ratioClass = aspectRatioClass(config.aspect_ratio);
  const ratioStyle = aspectRatioStyle(config.aspect_ratio, config.compact_player);

  const body = (
    <div className="profile-embed overflow-hidden" style={style} data-embed-type={embed.embed_type}>
      {config.show_title ? (
        <div
          className="border-b border-white/[0.06]"
          style={embedContentPadding(config)}
        >
          <p className={`truncate text-white ${titleClass}`} style={textStyle}>
            {title}
          </p>
          {config.show_description && config.description ? (
            <p
              className="mt-0.5 truncate text-xs"
              style={mutedStyle.color ? mutedStyle : { color: "rgb(115 115 115)" }}
            >
              {config.description}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className={`relative w-full ${ratioClass}`} style={ratioStyle}>
        <iframe
          src={src}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="lazy"
        />
      </div>
    </div>
  );

  if (!isSpotifyEmbed(embed.embed_type)) return body;

  return (
    <CardBorderEffect settings={settings} target="spotify" borderRadius={settings.border_radius}>
      {body}
    </CardBorderEffect>
  );
}

export function ProfileEmbedItem({
  embed,
  settings,
  hostname,
}: {
  embed: ProfileEmbed;
  settings: ProfileSettings;
  hostname: string;
}) {
  const config = embed.config;
  const alignmentClass = embedAlignmentClass(config.alignment);
  const alignmentStyle = embedAlignmentStyle(config);

  const wrap = (node: React.ReactNode) => (
    <div className={alignmentClass} style={alignmentStyle}>
      {node}
    </div>
  );

  if (config.display_mode === "minimal") {
    return wrap(
      isRobloxLinkEmbed(embed.embed_type) ? (
        <RobloxCard embed={embed} settings={settings} />
      ) : (
        <GenericLinkCard embed={embed} settings={settings} minimal />
      ),
    );
  }

  if (config.display_mode === "card") {
    return wrap(
      isRobloxLinkEmbed(embed.embed_type) ? (
        <RobloxCard embed={embed} settings={settings} />
      ) : (
        <GenericLinkCard embed={embed} settings={settings} />
      ),
    );
  }

  return wrap(<IframeEmbed embed={embed} settings={settings} hostname={hostname} />);
}
