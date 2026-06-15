/** Collapse repeated characters: fuuuuck → fuck */
export function collapseRepeatedCharacters(value: string) {
  return value.replace(/(.)\1+/g, "$1");
}

const LEET_MAP: Record<string, string> = {
  "@": "a",
  "4": "a",
  "3": "e",
  "1": "i",
  "!": "i",
  "|": "i",
  "0": "o",
  "5": "s",
  "$": "s",
  "7": "t",
  "8": "b",
  "9": "g",
  "*": "",
};

export function applyLeetspeak(value: string) {
  let out = "";
  for (const char of value) {
    out += LEET_MAP[char] ?? char;
  }
  return out;
}

/** Lowercase, leetspeak, strip separators, collapse repeats. */
export function normalizeForModeration(value: string) {
  const lowered = applyLeetspeak(value.toLowerCase());
  const stripped = lowered.replace(/[\s._\-·*/\\]+/g, "");
  return collapseRepeatedCharacters(stripped);
}

export function tokenizeForModeration(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((part) => normalizeForModeration(part))
    .filter(Boolean);
}

export function isMultiWordPhrase(word: string) {
  return /\s/.test(word.trim());
}
