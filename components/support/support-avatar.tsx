"use client";

import Image from "next/image";
import type { SupportProfileSummary } from "@/lib/types/support";
import { supportDisplayName } from "@/lib/support/format";

export function SupportAvatar({
  profile,
  size = 32,
  staff = false,
}: {
  profile?: SupportProfileSummary | null;
  size?: number;
  staff?: boolean;
}) {
  const label = supportDisplayName(profile);
  const initials = label
    .replace("@", "")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.06] text-[10px] font-semibold text-white/80"
        aria-hidden
      >
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt=""
            width={size}
            height={size}
            className="h-full w-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
      {staff ? (
        <span className="absolute -bottom-1 -right-1 rounded-full border border-[#120818] bg-violet-500 px-1 py-0 text-[8px] font-bold uppercase tracking-wide text-white">
          Staff
        </span>
      ) : null}
    </div>
  );
}
