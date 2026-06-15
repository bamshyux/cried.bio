import { getActivityTypeLabel } from "@/lib/discord/activity-images";
import { resolveDiscordCardAppearance } from "@/lib/discord/card-appearance";
import { configFromProfileSettings } from "@/lib/discord/card-config";
import { getDiscordStatusColor, getDiscordStatusLabel } from "@/lib/discord/status-colors";
import type { DiscordActivity, DiscordPresence } from "@/lib/discord/types";
import { resolveDiscordDisplayName } from "@/lib/discord/resolve-profile";
import type { DiscordCardConfig } from "@/lib/types/discord-widget";
import type { ProfileSettings } from "@/lib/types/settings";

function ActivityBlock({
  label,
  title,
  line1,
  line2,
  imageUrl,
  compact = false,
  shellClass,
  wrapClass,
  imageSizeClass,
  accentColor,
  secondaryClass,
  primaryClass,
}: {
  label: string;
  title: string;
  line1?: string;
  line2?: string;
  imageUrl?: string | null;
  compact?: boolean;
  shellClass: string;
  wrapClass: string;
  imageSizeClass: string;
  accentColor: string;
  secondaryClass: string;
  primaryClass: string;
}) {
  if (compact) {
    return (
      <p className={`truncate ${wrapClass} text-xs ${secondaryClass}`}>
        {label}: <span className={`font-medium ${primaryClass}`}>{title}</span>
      </p>
    );
  }

  return (
    <div className={wrapClass}>
      <div className={`${shellClass} overflow-hidden`}>
        <div className="flex min-w-0 gap-3">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className={`${imageSizeClass} shrink-0 rounded-lg object-cover`}
            />
          ) : (
            <div
              className={`${imageSizeClass} flex shrink-0 items-center justify-center rounded-lg`}
              style={{ backgroundColor: `${accentColor}33` }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={accentColor} aria-hidden>
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 12.3 12.3 0 0 0-.608 1.25 18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className={`text-[11px] font-bold uppercase leading-none tracking-wide ${secondaryClass}`}>
              {label}
            </p>
            <p className={`truncate text-sm font-semibold leading-snug ${primaryClass}`}>{title}</p>
            {line1 ? <p className={`truncate text-xs leading-snug ${secondaryClass}`}>{line1}</p> : null}
            {line2 ? <p className={`truncate text-xs leading-snug ${secondaryClass}`}>{line2}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderActivity(
  activity: DiscordActivity,
  compact: boolean,
  appearance: ReturnType<typeof resolveDiscordCardAppearance>,
) {
  const props = {
    compact,
    shellClass: appearance.activityShellClass,
    wrapClass: appearance.activityWrapClass,
    imageSizeClass: appearance.activityImageSize,
    accentColor: appearance.accentColor,
    secondaryClass: appearance.textSecondaryClass,
    primaryClass: appearance.textPrimaryClass,
  };

  if (activity.type === 4) {
    return (
      <ActivityBlock
        label="Custom Status"
        title={activity.state || activity.name}
        line1={activity.state ? activity.name : undefined}
        imageUrl={activity.largeImageUrl}
        {...props}
      />
    );
  }

  return (
    <ActivityBlock
      label={getActivityTypeLabel(activity.type)}
      title={activity.name}
      line1={activity.details}
      line2={activity.state}
      imageUrl={activity.largeImageUrl ?? activity.smallImageUrl}
      {...props}
    />
  );
}

function LanyardHint({
  hintBorderClass,
  secondaryClass,
  accentColor,
}: {
  hintBorderClass: string;
  secondaryClass: string;
  accentColor: string;
}) {
  return (
    <p className={`border-t px-3 py-2 text-[11px] leading-relaxed ${hintBorderClass} ${secondaryClass}`}>
      Join{" "}
      <a
        href="https://discord.gg/lanyard"
        target="_blank"
        rel="noreferrer"
        className="hover:underline"
        style={{ color: accentColor }}
      >
        discord.gg/lanyard
      </a>{" "}
      for live activity.
    </p>
  );
}

export function DiscordStatusCard({
  presence,
  settings,
  config: configOverride,
  live = true,
  previewActivity = false,
}: {
  presence: DiscordPresence;
  settings: ProfileSettings;
  config?: DiscordCardConfig;
  live?: boolean;
  previewActivity?: boolean;
}) {
  const config = configOverride ?? configFromProfileSettings(settings);
  const hasActivity = Boolean(presence.activity || presence.spotify) || previewActivity;
  const showHint = config.show_lanyard_hint && !live && !hasActivity;
  const showActivity = config.show_activity && config.style !== "compact";
  const hasActivityContent = showActivity && hasActivity;
  const appearance = resolveDiscordCardAppearance(config, settings.accent_color, {
    hasActivity: hasActivityContent,
  });
  const statusColor = getDiscordStatusColor(presence.status);
  const statusLabel = getDiscordStatusLabel(presence.status);
  const displayName = resolveDiscordDisplayName(settings, presence);

  const previewSpotify =
    previewActivity && !presence.spotify && !presence.activity
      ? { song: "Midnight City", artist: "M83", albumArtUrl: null as string | null }
      : null;

  return (
    <div
      className={`profile-discord-status bf-profile-block mb-5 w-full ${appearance.shellOverflowClass} ${appearance.maxWidthClass} ${appearance.shellClass}`}
      style={appearance.shellStyle}
    >
      <div
        className={`flex items-center gap-3 px-3 ${appearance.headerPadding} ${
          appearance.isPill ? "pr-4" : ""
        }`}
      >
        {config.show_avatar && presence.avatarUrl ? (
          <div className="relative shrink-0">
            <img
              src={presence.avatarUrl}
              alt=""
              className={`${appearance.avatarSize} rounded-full object-cover`}
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 box-content h-2 w-2 rounded-full border-[2px] ${appearance.statusBorderClass}`}
              style={{ backgroundColor: statusColor }}
              title={statusLabel}
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className={`truncate font-semibold leading-tight ${appearance.textPrimaryClass}`}>
            {displayName}
          </p>
          {config.show_status_text ? (
            <p className={`truncate text-sm leading-snug ${appearance.textSecondaryClass}`}>
              {statusLabel}
            </p>
          ) : null}
        </div>
      </div>

      {showActivity && presence.spotify ? (
        <ActivityBlock
          label="Listening to Spotify"
          title={presence.spotify.song}
          line1={`by ${presence.spotify.artist}`}
          imageUrl={presence.spotify.albumArtUrl}
          shellClass={appearance.activityShellClass}
          wrapClass={appearance.activityWrapClass}
          imageSizeClass={appearance.activityImageSize}
          accentColor={appearance.accentColor}
          secondaryClass={appearance.textSecondaryClass}
          primaryClass={appearance.textPrimaryClass}
        />
      ) : showActivity && presence.activity ? (
        renderActivity(presence.activity, false, appearance)
      ) : showActivity && previewSpotify ? (
        <ActivityBlock
          label="Listening to Spotify"
          title={previewSpotify.song}
          line1={`by ${previewSpotify.artist}`}
          imageUrl={previewSpotify.albumArtUrl}
          shellClass={appearance.activityShellClass}
          wrapClass={appearance.activityWrapClass}
          imageSizeClass={appearance.activityImageSize}
          accentColor={appearance.accentColor}
          secondaryClass={appearance.textSecondaryClass}
          primaryClass={appearance.textPrimaryClass}
        />
      ) : appearance.isCompact && config.show_activity && hasActivity ? (
        presence.spotify ? (
          <ActivityBlock
            label="Spotify"
            title={presence.spotify.song}
            line1={`by ${presence.spotify.artist}`}
            compact
            shellClass={appearance.activityShellClass}
            wrapClass={appearance.activityWrapClass}
            imageSizeClass={appearance.activityImageSize}
            accentColor={appearance.accentColor}
            secondaryClass={appearance.textSecondaryClass}
            primaryClass={appearance.textPrimaryClass}
          />
        ) : presence.activity ? (
          renderActivity(presence.activity, true, appearance)
        ) : previewSpotify ? (
          <ActivityBlock
            label="Spotify"
            title={previewSpotify.song}
            line1={`by ${previewSpotify.artist}`}
            compact
            shellClass={appearance.activityShellClass}
            wrapClass={appearance.activityWrapClass}
            imageSizeClass={appearance.activityImageSize}
            accentColor={appearance.accentColor}
            secondaryClass={appearance.textSecondaryClass}
            primaryClass={appearance.textPrimaryClass}
          />
        ) : null
      ) : null}

      {showHint ? (
        <LanyardHint
          hintBorderClass={appearance.hintBorderClass}
          secondaryClass={appearance.textSecondaryClass}
          accentColor={appearance.accentColor}
        />
      ) : null}
    </div>
  );
}
