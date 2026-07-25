import type { SupportCategory } from "@/lib/types/support";

export type SupportTopicOption = {
  icon: string;
  label: string;
  category: SupportCategory;
};

export const SUPPORT_WIDGET_TOPICS: SupportTopicOption[] = [
  { icon: "🐛", label: "Report a bug", category: "bug" },
  { icon: "💳", label: "Billing & premium", category: "billing" },
  { icon: "🔐", label: "Account access", category: "account" },
  { icon: "✨", label: "Profile help", category: "profile" },
];

export function getTopicByLabel(label: string | null | undefined): SupportTopicOption | null {
  if (!label?.trim()) return null;
  const normalized = label.trim().toLowerCase();
  return SUPPORT_WIDGET_TOPICS.find((t) => t.label.toLowerCase() === normalized) ?? null;
}

export function buildTopicGreeting(topic: SupportTopicOption): string {
  const intros: Record<SupportCategory, string> = {
    bug: "I see you want to **report a bug**. Sorry you're running into trouble!",
    billing: "Looks like you need help with **billing or Premium**.",
    account: "I'll help with **account access** — login, password, or verification.",
    profile: "You're here for **profile help** — customization, saving, or how something looks.",
    premium: "Happy to help with **Premium** questions.",
    presets: "I can help with **presets** — saving, applying, import/export.",
    layouts: "I'll help with **layouts and themes**.",
    widgets: "I can help with **widgets and links**.",
    music: "I'll help with the **music player** on your profile.",
    backgrounds: "I'll help with **backgrounds** — images or video.",
    effects: "I can help with **border effects and animations**.",
    badges: "I'll help with **badges**.",
    import_export: "I can help with **import and export**.",
    other: "I'm here to help.",
  };

  const intro = intros[topic.category] ?? intros.other;

  return `${intro}

Tell me what's going wrong — what you tried, what you expected, and any error messages. The more detail, the better I can help.

If we can't fix it here, I can send everything to our support team in one click.`;
}
