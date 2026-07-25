import type { SupportCategory } from "@/lib/types/support";

export type KnowledgeEntry = {
  id: string;
  category: SupportCategory;
  keywords: string[];
  title: string;
  content: string;
  links?: Array<{ label: string; href: string }>;
};

export const CRIED_AI_SYSTEM_PROMPT = `You are cried AI, the friendly support assistant for cried.bio — a link-in-bio and profile customization platform.

Your job:
- Answer questions about cried.bio features, billing, Premium, dashboard tools, presets, layouts, widgets, music, badges, backgrounds, effects, and troubleshooting.
- Be concise, warm, and helpful. Use short paragraphs and bullet points when useful.
- Only answer about cried.bio. If asked about unrelated topics, politely redirect.
- If you cannot confidently solve an issue, say you will connect them with the support team.
- Never invent features that don't exist. Use the knowledge base provided.
- Link to dashboard pages when relevant (e.g. /dashboard/customize, /dashboard/premium).

When a user confirms their issue is solved, acknowledge and wish them well.
When escalation is needed, explain that staff can help and offer to create a ticket with the conversation attached.`;

export const SUPPORT_KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    id: "premium-overview",
    category: "premium",
    keywords: ["premium", "premium lite", "upgrade", "subscription", "paid", "pro", "features"],
    title: "Premium & Premium Lite",
    content: `cried.bio offers **Premium Lite** — a subscription that unlocks advanced customization:

• **25+ card border effects** — animated and premium-only border styles
• **20+ premium layouts** — exclusive profile layout options
• **Advanced analytics** — deeper stats beyond basic view counts
• **Music player controls** — hide/show player button on your profile
• **Animated effects** entitlement gates many premium customization options

Upgrade from **Dashboard → Premium** (/dashboard/premium). Your subscription renews automatically via Stripe until cancelled.`,
    links: [{ label: "Premium page", href: "/dashboard/premium" }],
  },
  {
    id: "billing-stripe",
    category: "billing",
    keywords: ["billing", "payment", "stripe", "charge", "invoice", "receipt", "renewal", "next renewal", "card", "refund"],
    title: "Billing & Stripe",
    content: `Billing is handled securely through **Stripe**.

• View your plan and renewal date at **Dashboard → Premium**
• Update payment method through the Stripe customer portal (linked from Premium page)
• Charges appear as cried.bio or Stripe on your statement
• **Next renewal** shows your upcoming billing date after a successful payment

For billing disputes or refund requests, our support team can review your account — I can create a ticket for you if needed.`,
    links: [{ label: "Premium & billing", href: "/dashboard/premium" }],
  },
  {
    id: "cancel-premium",
    category: "billing",
    keywords: ["cancel", "unsubscribe", "stop subscription", "end premium", "downgrade"],
    title: "Cancelling Premium",
    content: `To cancel Premium Lite:

1. Go to **Dashboard → Premium**
2. Open the Stripe customer portal
3. Cancel your subscription

You'll keep Premium features until the end of your current billing period. After that, premium-only settings may revert to defaults, but your profile and content remain.`,
    links: [{ label: "Premium page", href: "/dashboard/premium" }],
  },
  {
    id: "profile-customize",
    category: "profile",
    keywords: ["customize", "profile", "edit", "bio", "avatar", "banner", "display name", "username", "save"],
    title: "Profile Customization",
    content: `Customize your public profile from **Dashboard → Customize** (/dashboard/customize):

• **Display name, bio, avatar, banner** — basic profile info
• **Theme colors & fonts** — accent, background, text colors
• **Card styling** — border radius, shadows, opacity
• **Show/hide toggles** — view count, join date, and more

Changes save when you click Save. Your live profile updates at cried.bio/yourusername.`,
    links: [{ label: "Customize", href: "/dashboard/customize" }],
  },
  {
    id: "presets",
    category: "presets",
    keywords: ["preset", "presets", "my presets", "save preset", "load preset", "community preset", "import", "export"],
    title: "Presets",
    content: `**Presets** let you save and reuse entire profile looks.

• **My Presets** (/dashboard/presets) — save your current settings as a named preset
• **Apply a preset** — instantly switch your profile styling
• **Export** — download preset as JSON
• **Import** — upload a .json preset file (supports exported format and legacy JSON)
• **Community Presets** — browse presets shared by other users

If import fails, check that the file is valid JSON exported from cried.bio or a compatible preset format.`,
    links: [
      { label: "My Presets", href: "/dashboard/presets" },
      { label: "Community Presets", href: "/dashboard/community-presets" },
    ],
  },
  {
    id: "layouts",
    category: "layouts",
    keywords: ["layout", "layouts", "theme layout", "profile layout", "premium layout"],
    title: "Layouts",
    content: `Change your profile layout at **Dashboard → Themes** (/dashboard/themes):

• Free users have access to standard layouts
• **Premium Lite** unlocks 20+ additional premium layouts
• Locked layouts show a premium badge — upgrade to use them

Each layout changes how your links, bio, and widgets are arranged on your public profile.`,
    links: [{ label: "Themes & layouts", href: "/dashboard/themes" }],
  },
  {
    id: "border-effects",
    category: "effects",
    keywords: ["border", "effect", "effects", "card border", "animated", "glow", "premium effect"],
    title: "Card Border Effects",
    content: `Card border effects are at **Dashboard → Customize** (card border section):

• Free users get basic border options
• **Premium Lite** unlocks 25+ animated border effects
• Preview effects in the dashboard before applying

Effects apply to your profile card on your public page.`,
    links: [{ label: "Customize", href: "/dashboard/customize" }],
  },
  {
    id: "backgrounds",
    category: "backgrounds",
    keywords: ["background", "video", "image", "upload", "wallpaper", "bg"],
    title: "Backgrounds",
    content: `Set profile backgrounds in **Dashboard → Customize**:

• Upload an **image** or **video** background
• Video backgrounds work on your live profile
• File size limits apply — large files may fail to upload
• Supported formats: common image types and MP4 video

If your background isn't showing, try a smaller file or a different format.`,
    links: [{ label: "Customize", href: "/dashboard/customize" }],
  },
  {
    id: "music-player",
    category: "music",
    keywords: ["music", "player", "spotify", "song", "playlist", "audio", "hide player"],
    title: "Music Player",
    content: `Add music to your profile at **Dashboard → Music** (/dashboard/music):

• Connect a playlist or track URL
• Toggle **Show player button** on your profile
• **Premium Lite** required to hide the player button — free users always show it

If music isn't playing, check the URL is valid and publicly accessible.`,
    links: [{ label: "Music", href: "/dashboard/music" }],
  },
  {
    id: "badges",
    category: "badges",
    keywords: ["badge", "badges", "medallion", "achievement", "earned", "custom badge"],
    title: "Badges",
    content: `Badges appear on your profile to show achievements and status.

• View your badges at **Dashboard → Badges** (/dashboard/badges)
• Some badges are earned automatically (milestones, premium, founder, etc.)
• Staff-granted badges appear after admin assignment
• Customize badge display order and visibility in badge settings

Premium and special badges may have unique visual styles.`,
    links: [{ label: "Badges", href: "/dashboard/badges" }],
  },
  {
    id: "widgets-links",
    category: "widgets",
    keywords: ["widget", "widgets", "link", "links", "social", "button", "icon"],
    title: "Links & Widgets",
    content: `Manage links and widgets from the dashboard:

• **Links** (/dashboard/links) — add, reorder, style social and custom links
• Link styles: icons only, buttons, parallax effects
• **Widgets** — guestbook, Discord, and other embeddable content
• Drag to reorder links on your profile

If a link isn't working, double-check the URL includes https://`,
    links: [
      { label: "Links", href: "/dashboard/links" },
      { label: "Widgets", href: "/dashboard/widgets" },
    ],
  },
  {
    id: "analytics",
    category: "profile",
    keywords: ["analytics", "stats", "views", "clicks", "visitors", "traffic"],
    title: "Analytics",
    content: `View profile stats at **Dashboard → Analytics** (/dashboard/analytics):

• **Basic stats** (all users): total views, unique visitors, link clicks, daily charts
• **Advanced analytics** (Premium Lite): extended metrics and deeper breakdowns

View counts on your public profile update as people visit. Premium analytics unlock below the basic stats section.`,
    links: [{ label: "Analytics", href: "/dashboard/analytics" }],
  },
  {
    id: "account-access",
    category: "account",
    keywords: ["login", "password", "sign in", "sign up", "account", "email", "forgot", "reset", "locked", "verify"],
    title: "Account Access",
    content: `Account help:

• **Sign in** at /login — use email + password
• **Forgot password** — use the reset link on the login page
• **Email verification** may be required for new accounts
• **Username changes** have a cooldown period

If you can't access your account, tell me the email on the account and I can escalate to staff for manual verification.`,
    links: [{ label: "Login", href: "/login" }],
  },
  {
    id: "store",
    category: "billing",
    keywords: ["store", "shop", "buy", "purchase", "product", "gifter"],
    title: "Store",
    content: `The cried.bio **Store** offers one-time purchases like badge gifts and special items.

• Browse at **Dashboard → Store** or the public store page
• Purchases are processed via Stripe
• Gift purchases may grant badges to recipients

For store order issues, I can connect you with support.`,
    links: [{ label: "Store", href: "/dashboard/store" }],
  },
  {
    id: "troubleshoot-save",
    category: "bug",
    keywords: ["not saving", "won't save", "broken", "bug", "error", "glitch", "not working", "issue"],
    title: "Troubleshooting Save Issues",
    content: `If settings aren't saving:

1. **Hard refresh** the page (Ctrl+Shift+R / Cmd+Shift+R)
2. Make sure you're **signed in** and the session hasn't expired
3. Check for error messages after clicking Save
4. Try a different browser or incognito mode
5. Disable browser extensions that block scripts

If it still fails, tell me which dashboard page and what you're trying to save — I can escalate with those details.`,
  },
  {
    id: "troubleshoot-profile",
    category: "profile",
    keywords: ["profile not showing", "404", "not found", "public profile", "preview"],
    title: "Profile Not Showing",
    content: `If your public profile isn't loading:

• Confirm your **username** is set in account settings
• Visit cried.bio/yourusername (lowercase, no spaces)
• New accounts may take a moment to propagate
• Check if maintenance mode is active (site banner)

Share your username and I'll help figure out next steps.`,
  },
  {
    id: "import-export",
    category: "import_export",
    keywords: ["import", "export", "json", "backup", "restore", "transfer"],
    title: "Import & Export",
    content: `**Export presets** from My Presets → export button (downloads JSON with metadata).

**Import presets** from My Presets → Import JSON button:
• Supports drag-and-drop .json files
• Handles duplicate names automatically
• Works with exported cried.bio format and legacy raw preset JSON

This is the best way to backup or transfer your profile look between accounts.`,
    links: [{ label: "My Presets", href: "/dashboard/presets" }],
  },
  {
    id: "guestbook",
    category: "widgets",
    keywords: ["guestbook", "comments", "messages", "guest book"],
    title: "Guestbook",
    content: `The guestbook lets visitors leave messages on your profile.

• Enable/disable in account or widget settings
• Moderate entries from your dashboard
• Pin important guestbook posts

If guestbook isn't appearing, check that it's enabled and your profile is public.`,
  },
  {
    id: "discord",
    category: "widgets",
    keywords: ["discord", "connect", "status", "presence"],
    title: "Discord Integration",
    content: `Connect Discord from **Dashboard → Integrations** or widget settings:

• Shows your Discord status/presence on your profile
• Requires authorizing cried.bio with Discord OAuth
• Reconnect if your status stops updating

Discord connection issues often resolve by disconnecting and reconnecting.`,
  },
];

export function searchKnowledgeBase(query: string, limit = 3): KnowledgeEntry[] {
  const normalized = query.toLowerCase();
  const tokens = normalized.split(/\s+/).filter((t) => t.length > 2);

  const scored = SUPPORT_KNOWLEDGE_BASE.map((entry) => {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (normalized.includes(keyword)) score += 3;
      for (const token of tokens) {
        if (keyword.includes(token) || token.includes(keyword)) score += 1;
      }
    }
    if (normalized.includes(entry.category)) score += 2;
    return { entry, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry);
}

export function detectSupportCategory(message: string): SupportCategory {
  const normalized = message.toLowerCase();
  const categoryKeywords: Array<[SupportCategory, string[]]> = [
    ["billing", ["billing", "payment", "stripe", "charge", "refund", "invoice", "cancel subscription"]],
    ["premium", ["premium", "upgrade", "subscription", "premium lite"]],
    ["presets", ["preset", "import", "export", "json"]],
    ["layouts", ["layout", "theme layout"]],
    ["effects", ["border", "effect", "animated", "glow"]],
    ["backgrounds", ["background", "video", "wallpaper"]],
    ["music", ["music", "spotify", "playlist", "player"]],
    ["badges", ["badge", "medallion"]],
    ["widgets", ["widget", "guestbook", "discord"]],
    ["account", ["login", "password", "sign in", "account access", "email"]],
    ["bug", ["bug", "broken", "error", "not working", "glitch"]],
    ["profile", ["profile", "customize", "bio", "avatar", "save"]],
  ];

  for (const [category, keywords] of categoryKeywords) {
    if (keywords.some((kw) => normalized.includes(kw))) return category;
  }
  return "other";
}

export function formatKnowledgeForPrompt(entries: KnowledgeEntry[]): string {
  if (entries.length === 0) return "No specific knowledge entries matched.";
  return entries
    .map(
      (e) =>
        `### ${e.title} (${e.category})\n${e.content}${e.links?.length ? `\nLinks: ${e.links.map((l) => `${l.label}: ${l.href}`).join(", ")}` : ""}`,
    )
    .join("\n\n");
}
