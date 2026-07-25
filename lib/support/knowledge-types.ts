import type { SupportCategory } from "@/lib/types/support";

export type KnowledgeEntry = {
  id: string;
  category: SupportCategory;
  keywords: string[];
  title: string;
  content: string;
  links?: Array<{ label: string; href: string }>;
  /** Higher = preferred when scores tie (from dashboard search index). */
  priority?: number;
};
