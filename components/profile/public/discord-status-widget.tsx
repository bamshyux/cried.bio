"use client";

import { useEffect, useState } from "react";
import { useDiscordPresence } from "./discord-presence-context";
import { DiscordStatusCard } from "./discord-status-card";
import {
  buildFallbackDiscordPresence,
  mergeDiscordPresence,
  shouldShowDiscordStatus,
} from "@/lib/discord/fallback-presence";
import type { DiscordPresence } from "@/lib/discord/types";
import type { ProfileSettings } from "@/lib/types/settings";

export function DiscordStatusWidget({
  settings,
  initialPresence,
}: {
  settings: ProfileSettings;
  initialPresence: DiscordPresence | null;
}) {
  const contextPresence = useDiscordPresence();
  const resolvedInitial = initialPresence ?? contextPresence;

  const [presence, setPresence] = useState<DiscordPresence | null>(() =>
    resolvedInitial ??
    (shouldShowDiscordStatus(settings) ? buildFallbackDiscordPresence(settings) : null),
  );
  const [live, setLive] = useState(
    Boolean(resolvedInitial?.activity || resolvedInitial?.spotify || resolvedInitial?.status !== "offline"),
  );

  useEffect(() => {
    if (!shouldShowDiscordStatus(settings)) return;

    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/discord/presence/${encodeURIComponent(settings.discord_user_id)}`);
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as { presence?: DiscordPresence | null };
        if (cancelled) return;
        if (json.presence) {
          setPresence(mergeDiscordPresence(settings, json.presence));
          setLive(true);
        } else {
          setPresence((current) => current ?? buildFallbackDiscordPresence(settings));
          setLive(false);
        }
      } catch {
        if (!cancelled) {
          setPresence((current) => current ?? buildFallbackDiscordPresence(settings));
        }
      }
    };

    void load();
    const interval = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [settings.discord_user_id, settings.discord_username, settings.discord_avatar, settings.show_discord_status]);

  if (!shouldShowDiscordStatus(settings) || !presence) return null;

  return <DiscordStatusCard presence={presence} settings={settings} live={live} />;
}
