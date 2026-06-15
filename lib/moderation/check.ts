import { MODERATION_ERROR, type ModerationContentType } from "@/lib/moderation/constants";
import {
  isMultiWordPhrase,
  normalizeForModeration,
  tokenizeForModeration,
} from "@/lib/moderation/normalize";
import type { ModerationDictionary } from "@/lib/types/moderation";

export type ModerationCheckResult =
  | { allowed: true }
  | { allowed: false; error: string; categorySlug?: string };

function wordMatches(normalizedText: string, tokens: string[], bannedWord: string) {
  const normalizedWord = normalizeForModeration(bannedWord);
  if (!normalizedWord) return false;

  if (isMultiWordPhrase(bannedWord)) {
    return normalizedText.includes(normalizedWord);
  }

  if (normalizedWord.length <= 4) {
    return tokens.some((token) => token === normalizedWord);
  }

  return normalizedText.includes(normalizedWord);
}

export function checkTextAgainstDictionary(
  text: string,
  dictionary: ModerationDictionary,
): ModerationCheckResult {
  const trimmed = text.trim();
  if (!trimmed) return { allowed: true };

  const normalizedText = normalizeForModeration(trimmed);
  const tokens = tokenizeForModeration(trimmed);

  for (const entry of dictionary.words) {
    if (!entry.enabled || !dictionary.enabledCategories.has(entry.category_slug)) continue;
    if (wordMatches(normalizedText, tokens, entry.word)) {
      return { allowed: false, error: MODERATION_ERROR, categorySlug: entry.category_slug };
    }
  }

  return { allowed: true };
}

export function checkMultipleFields(
  fields: Array<{ value: string; contentType: ModerationContentType }>,
  dictionary: ModerationDictionary,
): ModerationCheckResult {
  for (const field of fields) {
    const result = checkTextAgainstDictionary(field.value, dictionary);
    if (!result.allowed) return result;
  }
  return { allowed: true };
}
