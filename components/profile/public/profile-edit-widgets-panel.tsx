"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toggleDiscordStatusAction } from "@/app/actions/discord";
import { isDiscordConnected } from "@/lib/discord/connection";
import type { ProfileEmbed } from "@/lib/types/embed";
import type { ProfileSettings } from "@/lib/types/settings";
import { SiDiscord } from "react-icons/si";

export function ProfileEditWidgetsPanel({
  settings,
  embeds,
  username,
}: {
  settings: ProfileSettings;
  embeds: ProfileEmbed[];
  username: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const connected = isDiscordConnected(settings);
  const visibleEmbeds = embeds.filter((e) => e.is_visible).length;

  const toggleDiscord = () => {
    startTransition(async () => {
      await toggleDiscordStatusAction(!settings.show_discord_status);
      router.refresh();
    });
  };

  return (
    <div className="pointer-events-auto w-full max-w-md rounded-xl border border-white/10 bg-black/80 p-4 backdrop-blur-md">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        Profile widgets
      </p>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#0f0f0f] px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-[#5865F2]">
              <SiDiscord size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white">Discord status</p>
              <p className="truncate text-[10px] text-neutral-500">
                {connected
                  ? settings.discord_username || settings.discord_user_id
                  : "Not connected"}
              </p>
            </div>
          </div>
          {connected ? (
            <button
              type="button"
              disabled={isPending}
              onClick={toggleDiscord}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                settings.show_discord_status
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-white/5 text-neutral-400 hover:text-white"
              }`}
            >
              {settings.show_discord_status ? "On" : "Off"}
            </button>
          ) : (
            <Link
              href="/dashboard/widgets"
              className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--bf-accent)] hover:underline"
            >
              Connect
            </Link>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#0f0f0f] px-3 py-2.5">
          <div>
            <p className="text-xs font-medium text-white">Embeds</p>
            <p className="text-[10px] text-neutral-500">
              {visibleEmbeds} visible on profile
            </p>
          </div>
          <Link
            href="/dashboard/embeds"
            className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--bf-accent)] hover:underline"
          >
            Add
          </Link>
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] text-neutral-600">
        <Link href={`/${username}`} className="hover:text-neutral-400">
          View live profile
        </Link>
        {" · "}
        <Link href="/dashboard/widgets" className="hover:text-neutral-400">
          Widget settings
        </Link>
      </p>
    </div>
  );
}
