/** Auto-awarded when a profile has existed for at least one calendar year. */
export const ACCOUNT_1YR_BADGE_SLUG = "account-1yr";

/** View-count milestone thresholds → badge slug */
export const VIEW_MILESTONES: { minViews: number; slug: string }[] = [
  { minViews: 100_000, slug: "views-100k" },
  { minViews: 10_000, slug: "views-10k" },
  { minViews: 1_000, slug: "views-1k" },
  { minViews: 100, slug: "views-100" },
];

export function getEarnedViewMilestoneSlugs(totalViews: number): string[] {
  return VIEW_MILESTONES.filter((m) => totalViews >= m.minViews).map((m) => m.slug);
}

/** Matches Postgres: created_at <= now() - interval '1 year'. */
export function isAccountAtLeastOneYearOld(
  createdAt: string | Date,
  now = new Date(),
): boolean {
  const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;

  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  return created <= cutoff;
}
