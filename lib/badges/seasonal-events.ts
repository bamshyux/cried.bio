/** Summer 2026 limited claim — disable when the event ends. */
export const SUMMER_2026_BADGE_SLUG = "summer-2026";

export const SUMMER_2026_BADGE_COLOR = "#fbbf24";

export const SUMMER_2026_BADGE_GRADIENT =
  "linear-gradient(135deg, #fde047 0%, #fbbf24 42%, #f97316 100%)";

export const SUMMER_2026_CLAIM_SESSION_KEY = "bf-summer-2026-modal-dismissed";

export function isSummer2026ClaimActive(): boolean {
  return true;
}

export function isSummer2026BadgeSlug(slug: string): boolean {
  return slug === SUMMER_2026_BADGE_SLUG;
}
