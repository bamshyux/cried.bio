import { revalidateUserProfile } from "@/lib/actions/auth";
import { markProfileAppearanceChanged } from "@/lib/data/profile-presets";

/** Clear the applied preset and refresh dashboard pages after a live profile edit. */
export async function revalidateAfterProfileAppearanceChange(
  userId: string,
  extraPaths: string[] = [],
) {
  await markProfileAppearanceChanged(userId);
  await revalidateUserProfile(userId, ["/dashboard/profile-presets", ...extraPaths]);
}
