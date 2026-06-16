"use client";

import type { ProfileEmbed } from "@/lib/types/embed";
import type { ProfileSettings } from "@/lib/types/settings";
import { ProfileEmbedItem } from "@/components/profile/public/profile-embed-item";

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
    <div className="profile-embeds bf-profile-block mb-5 space-y-3">
      {visible.map((embed) => (
        <ProfileEmbedItem key={embed.id} embed={embed} settings={settings} hostname={hostname} />
      ))}
    </div>
  );
}
