import { getFullDashboardSearchIndex } from "@/lib/dashboard/search";
import type { SupportCategory } from "@/lib/types/support";
import type { KnowledgeEntry } from "@/lib/support/knowledge-types";

function sectionToCategory(sectionId: string): SupportCategory {
  const map: Record<string, SupportCategory> = {
    content: "widgets",
    appearance: "effects",
    explore: "profile",
    community: "widgets",
    profile: "profile",
    presets: "presets",
    analytics: "profile",
    settings: "account",
    overview: "profile",
    stats: "profile",
  };
  return map[sectionId] ?? "other";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildFeatureContent(label: string, description: string | undefined, href: string, section: string): string {
  const summary = description ?? "Configure this feature in your dashboard.";
  return `${summary}

**How to get there:**
1. Open your **Dashboard** on cried.bio
2. Go to **${label}** — \`${href}\`
3. You can also use **dashboard search** (top of the dashboard) and type "${label.toLowerCase()}" to jump there instantly

This lives under **${section}** in the dashboard sidebar.`;
}

/** Auto-generated entries from the same index that powers dashboard search. */
export function buildDashboardFeatureKnowledge(): KnowledgeEntry[] {
  const index = getFullDashboardSearchIndex();
  const seen = new Set<string>();

  return index.flatMap((entry) => {
    const key = `${entry.href}:${entry.label.toLowerCase()}`;
    if (seen.has(key)) return [];
    seen.add(key);

    const keywords = [
      ...new Set([
        ...(entry.keywords ?? []),
        entry.label.toLowerCase(),
        entry.section.toLowerCase(),
      ]),
    ];

    return [
      {
        id: `dash-${slugify(entry.label)}-${slugify(entry.href)}`,
        category: sectionToCategory(entry.sectionId),
        keywords,
        title: entry.label,
        content: buildFeatureContent(entry.label, entry.description, entry.href, entry.section),
        links: [{ label: entry.label, href: entry.href }],
        priority: entry.priority ?? 50,
      },
    ];
  });
}
