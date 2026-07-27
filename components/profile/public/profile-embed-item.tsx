"use client";

import type { CSSProperties, ReactNode } from "react";
import type { ProfileEmbed } from "@/lib/types/embed";
import type { ProfileSettings } from "@/lib/types/settings";
import {
  aspectRatioClass,
  aspectRatioStyle,
  embedAlignmentClass,
  embedAlignmentStyle,
  embedCardStyles,
  embedContentPadding,
  embedMutedTextStyle,
  embedPlatformLabel,
  embedTextStyle,
  embedTitleClass,
  resolveEmbedTitle,
  type EmbedCardStyles,
} from "@/lib/embeds/config";
import { getEmbedIframeSrc } from "@/lib/embeds/parse";
import { isRobloxLinkEmbed, robloxEmbedLinkLabel } from "@/lib/embeds/roblox-profile";
import { CardBorderEffect } from "@/components/profile/card-border-effect";
import { cardBorderEffectStripsDefaultBorder } from "@/lib/card-border-effects/resolve";
import type { CardBorderTarget } from "@/lib/card-border-effects/types";

function isSpotifyEmbed(embedType: ProfileEmbed["embed_type"]) {
  return embedType === "spotify_track" || embedType === "spotify_playlist";
}

function embedStylesWithBorderEffect(
  settings: ProfileSettings,
  config: ProfileEmbed["config"],
  target: CardBorderTarget,
): EmbedCardStyles {
  const styles = embedCardStyles(config, settings.accent_color);
  if (!cardBorderEffectStripsDefaultBorder(settings, target)) return styles;
  return {
    shell: { ...styles.shell, border: "none", boxShadow: "none" },
    background: styles.background,
  };
}

function EmbedOpenButton() {
  return (
    <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-neutral-300 transition-colors group-hover:border-[var(--bf-accent)]/35 group-hover:bg-[var(--bf-accent)]/10 group-hover:text-[var(--bf-accent)]">
      Open →
    </span>
  );
}

function EmbedCardShell({
  href,
  embedType,
  styles,
  className = "",
  children,
}: {
  href?: string;
  embedType: ProfileEmbed["embed_type"];
  styles: EmbedCardStyles;
  className?: string;
  children: ReactNode;
}) {
  const shellClassName = `profile-embed group relative block overflow-hidden transition-[transform,box-shadow] duration-200 ${href ? "hover:-translate-y-px" : ""} ${className}`.trim();
  const inner = (
    <>
      <div className="pointer-events-none absolute inset-0" style={styles.background} aria-hidden />
      <div className="relative z-10">{children}</div>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={shellClassName}
        style={styles.shell}
        data-embed-type={embedType}
      >
        {inner}
      </a>
    );
  }

  return (
    <div className={shellClassName} style={styles.shell} data-embed-type={embedType}>
      {inner}
    </div>
  );
}

function EmbedTextBlock({
  embed,
  title,
  subtitle,
  textStyle,
  mutedStyle,
  titleClass,
  config,
}: {
  embed: ProfileEmbed;
  title: string;
  subtitle?: string;
  textStyle: CSSProperties;
  mutedStyle: CSSProperties;
  titleClass: string;
  config: ProfileEmbed["config"];
}) {
  const mutedColor = mutedStyle.color ? mutedStyle : { color: "rgb(163 163 163)" };

  return (
    <div className="min-w-0 flex-1">
      {config.show_title ? (
        <>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            {embedPlatformLabel(embed.embed_type)}
          </p>
          <p className={`truncate ${titleClass}`} style={textStyle}>
            {title}
          </p>
        </>
      ) : null}
      {config.show_description && subtitle ? (
        <p
          className={`truncate text-xs ${config.show_title ? "mt-0.5" : titleClass}`}
          style={config.show_title ? mutedColor : textStyle}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
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
  const styles = embedCardStyles(config, settings.accent_color);
  const textStyle = embedTextStyle(config, settings.text_color);
  const mutedStyle = embedMutedTextStyle(config);
  const titleClass = embedTitleClass(config.title_size);

  if (minimal) {
    return (
      <a
        href={embed.url}
        target="_blank"
        rel="noopener noreferrer"
        className="profile-embed inline-flex items-center gap-1.5 text-sm transition-colors hover:text-white"
        style={textStyle}
      >
        {title} →
      </a>
    );
  }

  return (
    <EmbedCardShell href={embed.url} embedType={embed.embed_type} styles={styles}>
      <div className="flex items-center gap-3.5" style={embedContentPadding(config)}>
        <EmbedTextBlock
          embed={embed}
          title={title}
          subtitle={config.description || embed.url}
          textStyle={textStyle}
          mutedStyle={mutedStyle}
          titleClass={titleClass}
          config={config}
        />
        <EmbedOpenButton />
      </div>
    </EmbedCardShell>
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
  const styles = embedStylesWithBorderEffect(settings, config, "roblox");
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

  const content = (
    <div
      className={`flex items-center gap-3.5 ${config.card_style === "minimal" ? "px-0 py-2" : ""}`}
      style={config.card_style === "minimal" ? undefined : embedContentPadding(config)}
    >
      {showImage && imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className={`shrink-0 rounded-xl object-cover ring-1 ring-white/10 ${isProfile ? "h-12 w-12" : "h-11 w-11"}`}
          draggable={false}
        />
      ) : null}
      <EmbedTextBlock
        embed={embed}
        title={title}
        subtitle={subtitle}
        textStyle={textStyle}
        mutedStyle={mutedStyle}
        titleClass={titleClass}
        config={config}
      />
      <EmbedOpenButton />
    </div>
  );

  return (
    <CardBorderEffect settings={settings} target="roblox" borderRadius={settings.border_radius}>
      <EmbedCardShell href={embed.url} embedType={embed.embed_type} styles={styles}>
        {content}
      </EmbedCardShell>
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
  const styles = isSpotifyEmbed(embed.embed_type)
    ? embedStylesWithBorderEffect(settings, config, "spotify")
    : embedCardStyles(config, settings.accent_color);
  const textStyle = embedTextStyle(config, settings.text_color);
  const mutedStyle = embedMutedTextStyle(config);
  const titleClass = embedTitleClass(config.title_size);
  const ratioClass = aspectRatioClass(config.aspect_ratio);
  const ratioStyle = aspectRatioStyle(config.aspect_ratio, config.compact_player);

  const body = (
    <EmbedCardShell embedType={embed.embed_type} styles={styles}>
      {config.show_title ? (
        <div className="border-b border-white/[0.06]" style={embedContentPadding(config)}>
          <p className={`truncate ${titleClass}`} style={textStyle}>
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
    </EmbedCardShell>
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
