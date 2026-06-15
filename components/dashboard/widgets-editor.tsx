"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  disconnectDiscordAction,
  saveDiscordUserIdAction,
  toggleDiscordStatusAction,
  updateDiscordCardConfigAction,
} from "@/app/actions/discord";
import {
  buttonPrimaryClassName,
  cardClassName,
  FormFeedback,
  inputClassName,
  labelClassName,
  PageHeader,
  ToggleField,
} from "@/components/dashboard/form-fields";
import { SiDiscord } from "react-icons/si";
import { DiscordStatusCard } from "@/components/profile/public/discord-status-card";
import { getDiscordCardStyleLabel } from "@/lib/discord/card-config";
import { isDiscordConnected } from "@/lib/discord/connection";
import { buildFallbackDiscordPresence } from "@/lib/discord/fallback-presence";
import { getDiscordAvatarUrl } from "@/lib/discord/config";
import type { DiscordCardConfig, DiscordCardStyle } from "@/lib/types/discord-widget";
import type { ProfileSettings } from "@/lib/types/settings";

const CARD_STYLES: DiscordCardStyle[] = ["discord", "minimal", "compact"];

const DISCORD_MESSAGES: Record<string, { type: "success" | "error"; text: string }> = {
  connected: { type: "success", text: "Discord account connected." },
  denied: { type: "error", text: "Discord authorization was cancelled." },
  invalid: { type: "error", text: "Discord sign-in expired. Try again." },
  unauthorized: { type: "error", text: "Sign in again, then connect Discord." },
  token_failed: { type: "error", text: "Could not verify Discord. Try again." },
  user_failed: { type: "error", text: "Could not load your Discord profile." },
  save_failed: { type: "error", text: "Could not save Discord account. Run v34 migration?" },
  not_configured: {
    type: "error",
    text: "Discord OAuth is not configured on this site. Use manual ID below or ask the admin to set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET.",
  },
};

export function WidgetsEditor({
  settings,
  oauthConfigured,
}: {
  settings: ProfileSettings;
  oauthConfigured: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>({});
  const [manualId, setManualId] = useState("");
  const [cardConfig, setCardConfig] = useState<DiscordCardConfig>({
    style: settings.discord_card_style ?? "discord",
    show_lanyard_hint: settings.discord_show_lanyard_hint ?? false,
  });
  const [isPending, startTransition] = useTransition();

  const connected = isDiscordConnected(settings);
  const avatarUrl = connected
    ? getDiscordAvatarUrl(settings.discord_user_id, settings.discord_avatar || null)
    : null;

  useEffect(() => {
    const code = searchParams.get("discord");
    if (!code) return;
    const message = DISCORD_MESSAGES[code];
    if (message) {
      setFeedback(message.type === "success" ? { success: message.text } : { error: message.text });
    }
    router.replace("/dashboard/widgets");
  }, [router, searchParams]);

  useEffect(() => {
    setCardConfig({
      style: settings.discord_card_style ?? "discord",
      show_lanyard_hint: settings.discord_show_lanyard_hint ?? false,
    });
  }, [settings.discord_card_style, settings.discord_show_lanyard_hint, settings.updated_at]);

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      const result = await toggleDiscordStatusAction(checked);
      setFeedback(result.error ? { error: result.error } : { success: checked ? "Discord status enabled on your profile." : "Discord status hidden." });
      router.refresh();
    });
  };

  const handleDisconnect = () => {
    startTransition(async () => {
      const result = await disconnectDiscordAction();
      setFeedback(result.error ? { error: result.error } : { success: "Discord account disconnected." });
      router.refresh();
    });
  };

  const handleManualSave = () => {
    startTransition(async () => {
      const result = await saveDiscordUserIdAction(manualId);
      setFeedback(result.error ? { error: result.error } : { success: "Discord user ID saved." });
      if (!result.error) {
        setManualId("");
        router.refresh();
      }
    });
  };

  const saveCardConfig = (next: DiscordCardConfig) => {
    setCardConfig(next);
    startTransition(async () => {
      const result = await updateDiscordCardConfigAction(next);
      setFeedback(
        result.error
          ? { error: result.error }
          : { success: "Discord card appearance updated." },
      );
      router.refresh();
    });
  };

  const previewPresence = connected
    ? buildFallbackDiscordPresence({
        ...settings,
        discord_card_style: cardConfig.style,
        discord_show_lanyard_hint: cardConfig.show_lanyard_hint,
      })
    : null;

  return (
    <>
      <PageHeader
        title="Widgets"
        description="Connect Discord for live status, and manage embeds on your public profile."
      />
      <FormFeedback error={feedback.error} success={feedback.success} />

      <div className={`${cardClassName} mb-6`}>
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5865F2]/20 text-[#5865F2]">
            <SiDiscord size={22} />
          </span>
          <div>
            <h2 className="text-sm font-medium text-white">Discord account</h2>
            <p className="text-xs text-neutral-500">Connect to show live status on your biolink</p>
          </div>
        </div>

        {connected ? (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-white/[0.06] bg-[#0f0f0f] p-4">
            {avatarUrl && (
              <img src={avatarUrl} alt="" className="h-12 w-12 rounded-full" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {settings.discord_username || "Discord user"}
              </p>
              <p className="truncate text-xs text-neutral-500">ID {settings.discord_user_id}</p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={handleDisconnect}
              className="shrink-0 text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              Disconnect
            </button>
          </div>
        ) : oauthConfigured ? (
          <a
            href="/api/discord/connect"
            className={`${buttonPrimaryClassName} mb-4 inline-flex items-center gap-2`}
          >
            <SiDiscord size={18} />
            Connect Discord
          </a>
        ) : (
          <p className="mb-4 text-xs text-neutral-500">
            One-click connect requires Discord OAuth env vars. You can paste your Discord user ID below instead.
          </p>
        )}

        {!connected && (
          <div className="space-y-3 border-t border-white/[0.06] pt-4">
            <div>
              <label htmlFor="discord_user_id" className={labelClassName}>
                Or paste Discord user ID
              </label>
              <input
                id="discord_user_id"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="123456789012345678"
                className={inputClassName}
              />
              <p className="mt-1.5 text-xs text-neutral-600">
                Enable Developer Mode in Discord → right-click your profile → Copy User ID
              </p>
            </div>
            <button
              type="button"
              disabled={isPending || !manualId.trim()}
              onClick={handleManualSave}
              className={buttonPrimaryClassName}
            >
              Save Discord ID
            </button>
          </div>
        )}

        {connected && (
          <div className="border-t border-white/[0.06] pt-4">
            <ToggleField
              key={`discord-status-${settings.updated_at}-${settings.show_discord_status}`}
              name="show_discord_status"
              label="Show Discord status on profile"
              description="Requires a connected Discord account. Turn this on to display your live presence on your public biolink."
              defaultChecked={settings.show_discord_status && connected}
              onCheckedChange={handleToggle}
            />
            <p className="mt-3 text-xs text-neutral-600">
              Live activity uses{" "}
              <a href="https://lanyard.rest" target="_blank" rel="noreferrer" className="text-[var(--bf-accent)] hover:underline">
                Lanyard
              </a>
              . Join the{" "}
              <a href="https://discord.gg/lanyard" target="_blank" rel="noreferrer" className="text-[var(--bf-accent)] hover:underline">
                Lanyard Discord server
              </a>{" "}
              with the same account — no commands needed. You can mute the server after joining.
            </p>

            <div className="mt-6 border-t border-white/[0.06] pt-4">
              <h3 className="mb-1 text-sm font-medium text-white">Card appearance</h3>
              <p className="mb-4 text-xs text-neutral-500">
                Choose how the Discord status block looks on your public profile.
              </p>

              <div className="mb-4 grid gap-2 sm:grid-cols-3">
                {CARD_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    disabled={isPending}
                    onClick={() => saveCardConfig({ ...cardConfig, style })}
                    className={`rounded-lg border px-3 py-2.5 text-left text-xs transition-colors disabled:opacity-50 ${
                      cardConfig.style === style
                        ? "border-[#5865F2]/60 bg-[#5865F2]/10 text-white"
                        : "border-white/[0.06] bg-[#0f0f0f] text-neutral-400 hover:border-white/15 hover:text-white"
                    }`}
                  >
                    <span className="block font-medium">{getDiscordCardStyleLabel(style)}</span>
                  </button>
                ))}
              </div>

              <ToggleField
                key={`discord-hint-${settings.updated_at}-${cardConfig.show_lanyard_hint}`}
                name="discord_show_lanyard_hint"
                label="Show Lanyard setup hint"
                description="When offline, show a small note about joining the Lanyard server for live activity."
                defaultChecked={cardConfig.show_lanyard_hint}
                onCheckedChange={(checked) =>
                  saveCardConfig({ ...cardConfig, show_lanyard_hint: checked })
                }
              />

              {previewPresence ? (
                <div className="mt-4 rounded-lg border border-white/[0.06] bg-[#0a0a0a] p-4">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                    Preview
                  </p>
                  <DiscordStatusCard
                    presence={previewPresence}
                    settings={{
                      ...settings,
                      discord_card_style: cardConfig.style,
                      discord_show_lanyard_hint: cardConfig.show_lanyard_hint,
                    }}
                    live={false}
                  />
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <div className={cardClassName}>
        <h2 className="mb-2 text-sm font-medium text-white">Embeds & blocks</h2>
        <p className="mb-4 text-xs text-neutral-500">
          Add YouTube, Twitch, Spotify, Discord server widgets, and more from the dashboard — or use Edit profile mode on your live page to preview layout while you customize.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/embeds" className={buttonPrimaryClassName}>
            Manage embeds
          </Link>
          <Link
            href="/dashboard/featured"
            className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:border-white/20 hover:text-white"
          >
            Featured blocks
          </Link>
        </div>
      </div>
    </>
  );
}
