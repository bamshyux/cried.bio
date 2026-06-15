import { validateModeratedContent } from "@/lib/data/moderation";
import type { ModerationContentType } from "@/lib/moderation/constants";

/** Returns an error message when content is blocked, otherwise null. */
export async function rejectIfModerated(
  text: string,
  contentType: ModerationContentType,
  userId?: string | null,
): Promise<string | null> {
  const result = await validateModeratedContent(text, contentType, userId);
  return result.ok ? null : result.error;
}
