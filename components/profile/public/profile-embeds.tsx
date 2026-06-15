"use client";

import type { ProfileEmbed } from "@/lib/types/embed";
import type { ProfileSettings } from "@/lib/types/settings";
import { getEmbedIframeSrc } from "@/lib/embeds/parse";

export function ProfileEmbedsSection({
  embeds,
  settings,
}: {
  embeds: ProfileEmbed[];
  settings: ProfileSettings;
}) {
  const visible = embeds.filter((e) => e.is_visible);
  if (visible.length === 0) return null;

  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";

  return (
    <div className="mb-5 space-y-3">
      {visible.map((embed) => {
        const src = getEmbedIframeSrc(embed.embed_type, embed.embed_id) ??
          (embed.embed_type === "roblox"
            ? null
            : getEmbedIframeSrc(embed.embed_type, embed.embed_id));

        if (embed.embed_type === "roblox") {
          return (
            <a
              key={embed.id}
              href={embed.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-white/[0.08] bg-[#0f0f0f] p-4 transition-colors hover:border-[var(--bf-accent)]/30"
            >
              <p className="text-sm font-medium text-white">{embed.title}</p>
              <p className="mt-1 text-xs text-neutral-500">Play on Roblox →</p>
            </a>
          );
        }

        const iframeSrc =
          embed.embed_type === "twitch"
            ? embed.embed_id.match(/^\d+$/)
              ? `https://player.twitch.tv/?video=${embed.embed_id}&parent=${hostname}`
              : `https://player.twitch.tv/?channel=${embed.embed_id}&parent=${hostname}`
            : src;

        if (!iframeSrc) return null;

        return (
          <div
            key={embed.id}
            className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0f0f0f]"
            style={{ boxShadow: `0 0 0 1px ${settings.accent_color}10` }}
          >
            <div className="relative aspect-video w-full">
              <iframe
                src={iframeSrc}
                title={embed.title}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                loading="lazy"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
