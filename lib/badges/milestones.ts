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
