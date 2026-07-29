import { parseSocialLink } from "@/lib/platform-followers/parse-link";
import { buildTotalFollowersSummary } from "@/lib/platform-followers/build-summary";
import type { ProfileLink } from "@/lib/types/link";
import type { TotalFollowersSummary } from "@/lib/types/link-platform-stats";

/** Build a display summary from profile links when cached stats are not available yet. */
export function summaryFromLinks(links: ProfileLink[]): TotalFollowersSummary | null {
  const socialLinks = links
    .map(parseSocialLink)
    .filter((link): link is NonNullable<ReturnType<typeof parseSocialLink>> => link !== null);

  if (socialLinks.length === 0) return null;

  return buildTotalFollowersSummary(
    socialLinks.map((link) => ({
      link_id: link.linkId,
      platform: link.platformId,
      platform_username: null,
      display_name: link.title,
      avatar_url: null,
      follower_count: null,
      count_label: "Followers",
      fetched_at: null,
    })),
  );
}
