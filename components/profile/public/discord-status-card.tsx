import { getDiscordStatusColor, getDiscordStatusLabel } from "@/lib/discord/status-colors";
import type { DiscordPresence } from "@/lib/discord/types";
import type { ProfileSettings } from "@/lib/types/settings";

export function DiscordStatusCard({
  presence,
  settings,
  live = true,
}: {
  presence: DiscordPresence;
  settings: ProfileSettings;
  live?: boolean;
}) {
  const statusColor = getDiscordStatusColor(presence.status);
  const statusLabel = getDiscordStatusLabel(presence.status);
  const displayName = settings.discord_username || presence.username;

  return (
    <div className="profile-discord-status bf-profile-block mb-5 w-full max-w-md overflow-hidden rounded-xl border border-[#5865F2]/25 bg-[#5865F2]/10">
      <div className="flex items-center gap-3 px-4 py-3">
        {presence.avatarUrl ? (
          <div className="relative shrink-0">
            <img src={presence.avatarUrl} alt="" className="h-12 w-12 rounded-full" />
            <span
              className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#141414]"
              style={{ backgroundColor: statusColor }}
              title={statusLabel}
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{displayName}</p>
          <p className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
            {statusLabel}
          </p>
        </div>
      </div>

      {(presence.activity || presence.spotify) && (
        <div className="border-t border-white/[0.06] bg-black/20 px-4 py-3">
          {presence.spotify ? (
            <div className="flex items-center gap-3">
              {presence.spotify.albumArtUrl ? (
                <img
                  src={presence.spotify.albumArtUrl}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded"
                />
              ) : null}
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[#1DB954]">
                  Listening to Spotify
                </p>
                <p className="truncate text-sm text-white">{presence.spotify.song}</p>
                <p className="truncate text-xs text-neutral-500">by {presence.spotify.artist}</p>
              </div>
            </div>
          ) : presence.activity ? (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                {presence.activity.type === 4 ? "Custom status" : "Playing"}
              </p>
              <p className="truncate text-sm text-white">{presence.activity.name}</p>
              {presence.activity.details && (
                <p className="truncate text-xs text-neutral-400">{presence.activity.details}</p>
              )}
              {presence.activity.state && (
                <p className="truncate text-xs text-neutral-500">{presence.activity.state}</p>
              )}
            </div>
          ) : null}
        </div>
      )}

      {!live && !presence.activity && !presence.spotify && (
        <div className="border-t border-white/[0.06] bg-black/20 px-4 py-2.5">
          <p className="text-[10px] text-neutral-500">
            For live activity, join{" "}
            <a
              href="https://discord.gg/lanyard"
              target="_blank"
              rel="noreferrer"
              className="text-[#5865F2] hover:underline"
            >
              discord.gg/lanyard
            </a>{" "}
            with this Discord account (joining is all that’s required).
          </p>
        </div>
      )}
    </div>
  );
}
