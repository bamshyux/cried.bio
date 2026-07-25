import {
  PREMIUM_LITE_LIFETIME_PRICE,
  PREMIUM_LITE_MONTHLY_PRICE,
  PREMIUM_LITE_BENEFITS,
} from "@/lib/premium/constants";
import { PLAN_DEFINITIONS } from "@/lib/premium/plans";
import type { SupportCategory } from "@/lib/types/support";

export type KnowledgeEntry = {
  id: string;
  category: SupportCategory;
  keywords: string[];
  title: string;
  content: string;
  links?: Array<{ label: string; href: string }>;
};

const lite = PLAN_DEFINITIONS.premium_lite.entitlements;
const premiumBenefitsList = PREMIUM_LITE_BENEFITS.map((b) => `• ${b}`).join("\n");

/** Ground-truth facts the AI must never contradict — sourced from app constants. */
export function getCriticalFactsBlock(): string {
  return `## Critical facts (authoritative — never contradict)

**Premium Lite pricing (exact):**
- **$${PREMIUM_LITE_MONTHLY_PRICE}/month** (recurring subscription via Stripe)
- **$${PREMIUM_LITE_LIFETIME_PRICE} one-time** for lifetime Premium Lite (no recurring renewal)
- There is NO $5/month plan. Do not invent other prices.

**Profile visibility** (Dashboard → Settings → Account → Profile visibility):
- **Public** — anyone with your link can view your profile
- **Unlisted** — hidden from search/explore; still accessible via direct link
- **Private** — only you can view your profile (others see it as unavailable)

**Premium Lite includes:** animated card border effects, 20+ premium layouts, advanced analytics, premium fonts, up to ${lite.max_music_tracks} music tracks + playlists, ${lite.max_profile_pages} extra profile pages, scheduled presets, premium badge, custom domain support, 24-hour username change cooldown, early access features.

**Billing:** Stripe handles all payments. Manage subscription in Dashboard → Premium → Stripe customer portal.

**Support escalation:** If unsure about a specific account issue, billing dispute, or bug you cannot verify — offer to create a ticket for staff. Never guess account-specific details.`;
}

export const CRIED_AI_SYSTEM_PROMPT = `You are cried AI, the friendly support assistant for cried.bio — a link-in-bio and profile customization platform.

Rules (strict):
- Answer ONLY using the Critical facts and Knowledge Base below. Never invent features, prices, or policies.
- Premium Lite costs exactly $${PREMIUM_LITE_MONTHLY_PRICE}/month OR $${PREMIUM_LITE_LIFETIME_PRICE} lifetime. Never say $5 or any other price.
- Users CAN set their profile to Private, Unlisted, or Public under Settings → Account → Profile visibility.
- Be concise, warm, and helpful. Use short paragraphs and bullet points when useful.
- Only answer about cried.bio. Redirect unrelated topics politely.
- Link to dashboard pages when relevant (e.g. /dashboard/settings, /dashboard/premium).
- If you cannot answer confidently from the knowledge base, say so and offer to connect the user with support staff.
- Do not make up refund policies, response times, or features not listed in the knowledge base.

When a user confirms their issue is solved, acknowledge warmly.
When escalation is needed, offer to create a ticket with the conversation attached.`;

export const SUPPORT_KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    id: "premium-pricing",
    category: "premium",
    keywords: [
      "cost",
      "price",
      "how much",
      "pricing",
      "monthly",
      "lifetime",
      "pay",
      "$",
      "dollar",
      "subscription fee",
      "premium cost",
    ],
    title: "Premium Lite Pricing",
    content: `**Premium Lite** on cried.bio has two payment options:

• **$${PREMIUM_LITE_MONTHLY_PRICE}/month** — recurring subscription (cancel anytime via Stripe)
• **$${PREMIUM_LITE_LIFETIME_PRICE} one-time** — lifetime Premium Lite, no monthly renewals

Upgrade at **Dashboard → Premium** (/dashboard/premium). Payments are processed securely through Stripe.`,
    links: [{ label: "Premium page", href: "/dashboard/premium" }],
  },
  {
    id: "premium-overview",
    category: "premium",
    keywords: ["premium", "premium lite", "upgrade", "subscription", "paid", "pro", "features", "what do i get"],
    title: "Premium Lite Features",
    content: `**Premium Lite** unlocks advanced customization on cried.bio:

${premiumBenefitsList}

Also includes:
• **25+ animated card border effects** and premium layouts
• **Advanced analytics** beyond basic view counts
• **Hide/show music player button** on your profile (free users always show the player)
• **Animated effects** entitlement for premium-only customization

Pricing: **$${PREMIUM_LITE_MONTHLY_PRICE}/mo** or **$${PREMIUM_LITE_LIFETIME_PRICE} lifetime**.`,
    links: [{ label: "Premium page", href: "/dashboard/premium" }],
  },
  {
    id: "profile-visibility",
    category: "account",
    keywords: [
      "private",
      "privacy",
      "visibility",
      "hidden",
      "unlisted",
      "public profile",
      "make profile private",
      "hide profile",
      "who can see",
    ],
    title: "Profile Visibility",
    content: `You control who can see your cried.bio profile under **Dashboard → Settings → Account → Profile visibility** (/dashboard/settings).

Three options:
• **Public** — anyone with the link can view your profile (default)
• **Unlisted** — hidden from search and explore; still works via direct link
• **Private** — only you can view your profile; others cannot access it

Save after selecting your option. This is separate from individual toggles like hiding view counts in customize settings.`,
    links: [{ label: "Account settings", href: "/dashboard/settings" }],
  },
  {
    id: "billing-stripe",
    category: "billing",
    keywords: ["billing", "payment", "stripe", "charge", "invoice", "receipt", "renewal", "next renewal", "card", "refund"],
    title: "Billing & Stripe",
    content: `Billing is handled securely through **Stripe**.

• View your plan and renewal date at **Dashboard → Premium**
• **Lifetime** plans do not renew — you pay $${PREMIUM_LITE_LIFETIME_PRICE} once
• **Monthly** plans renew at **$${PREMIUM_LITE_MONTHLY_PRICE}/month** until cancelled
• Update payment method through the Stripe customer portal (linked from Premium page)
• **Next renewal** shows your upcoming billing date after a successful monthly payment

For billing disputes or refund requests, staff can review your account — I can create a ticket if needed.`,
    links: [{ label: "Premium & billing", href: "/dashboard/premium" }],
  },
  {
    id: "cancel-premium",
    category: "billing",
    keywords: ["cancel", "unsubscribe", "stop subscription", "end premium", "downgrade"],
    title: "Cancelling Premium",
    content: `To cancel a **monthly** Premium Lite subscription:

1. Go to **Dashboard → Premium**
2. Open the Stripe customer portal
3. Cancel your subscription

You'll keep Premium features until the end of your current billing period. **Lifetime** plans do not need cancellation — they don't renew.

After Premium ends, premium-only settings may revert to defaults, but your profile and content remain.`,
    links: [{ label: "Premium page", href: "/dashboard/premium" }],
  },
  {
    id: "profile-customize",
    category: "profile",
    keywords: ["customize", "profile", "edit", "bio", "avatar", "banner", "display name", "username", "save"],
    title: "Profile Customization",
    content: `Customize your public profile from **Dashboard → Customize** (/dashboard/customize):

• **Display name, bio, avatar, banner** — basic profile info
• **Theme colors & fonts** — accent, background, text colors (premium fonts require Premium Lite)
• **Card styling** — border radius, shadows, opacity, border effects
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
• **Scheduled presets** — Premium Lite can auto-switch presets by time/date

If import fails, check that the file is valid JSON exported from cried.bio.`,
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
    content: `Card border effects are in **Dashboard → Customize** (card border section):

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
• Video backgrounds work on your live profile and link previews
• File size limits apply — large files may fail to upload

If your background isn't showing, try a smaller file or a different format.`,
    links: [{ label: "Customize", href: "/dashboard/customize" }],
  },
  {
    id: "music-player",
    category: "music",
    keywords: ["music", "player", "spotify", "song", "playlist", "audio", "hide player"],
    title: "Music Player",
    content: `Add music to your profile at **Dashboard → Music** (/dashboard/music):

• Free: **1 track**
• **Premium Lite:** up to **${lite.max_music_tracks} tracks** with playlist mode
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
• Premium Lite includes a **Premium badge** on your profile
• Staff-granted badges appear after admin assignment

Customize badge display order and visibility in badge settings.`,
    links: [{ label: "Badges", href: "/dashboard/badges" }],
  },
  {
    id: "widgets-links",
    category: "widgets",
    keywords: ["widget", "widgets", "link", "links", "social", "button", "icon"],
    title: "Links & Widgets",
    content: `Manage links and widgets from the dashboard:

• **Links** (/dashboard/links) — add, reorder, style social and custom links
• **Featured blocks** — free: ${PLAN_DEFINITIONS.free.entitlements.max_featured_blocks}, Premium Lite: ${lite.max_featured_blocks}
• **Widgets** — guestbook, Discord, Spotify, GitHub, and more
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
• **Advanced analytics** (Premium Lite only): extended metrics below the basic stats section

View counts on your public profile update as people visit.`,
    links: [{ label: "Analytics", href: "/dashboard/analytics" }],
  },
  {
    id: "account-access",
    category: "account",
    keywords: ["login", "password", "sign in", "sign up", "account", "email", "forgot", "reset", "locked", "verify", "settings"],
    title: "Account & Settings",
    content: `Account help:

• **Sign in** at /login — email + password
• **Account settings** at /dashboard/settings — username, email, password, profile visibility, privacy, sessions
• **Forgot password** — reset link on the login page
• **Username changes:** 7-day cooldown (free) or 24-hour cooldown (Premium Lite)
• **Profile visibility:** Public, Unlisted, or Private — under Settings → Account

If you can't access your account, tell me your email and I can escalate to staff.`,
    links: [
      { label: "Settings", href: "/dashboard/settings" },
      { label: "Login", href: "/login" },
    ],
  },
  {
    id: "store",
    category: "billing",
    keywords: ["store", "shop", "buy", "purchase", "product", "gifter", "gift premium"],
    title: "Store & Gifts",
    content: `The cried.bio **Store** offers one-time purchases and Premium gifts.

• Browse at **Dashboard → Store** (/dashboard/store)
• Gift Premium Lite (monthly or lifetime) to another user
• Purchases processed via Stripe

Premium pricing for gifts matches regular pricing: $${PREMIUM_LITE_MONTHLY_PRICE}/mo or $${PREMIUM_LITE_LIFETIME_PRICE} lifetime.`,
    links: [{ label: "Store", href: "/dashboard/store" }],
  },
  {
    id: "troubleshoot-save",
    category: "bug",
    keywords: ["not saving", "won't save", "broken", "bug", "error", "glitch", "not working", "issue"],
    title: "Troubleshooting Save Issues",
    content: `If settings aren't saving:

1. **Hard refresh** (Ctrl+Shift+R / Cmd+Shift+R)
2. Confirm you're **signed in** and the session hasn't expired
3. Check for error messages after clicking Save
4. Try a different browser or incognito mode
5. Disable browser extensions that block scripts

Tell me which dashboard page and what you're saving — I can escalate with details.`,
  },
  {
    id: "troubleshoot-profile",
    category: "profile",
    keywords: ["profile not showing", "404", "not found", "public profile", "preview"],
    title: "Profile Not Showing",
    content: `If your public profile isn't loading:

• Confirm your **username** is set in account settings
• Check **Profile visibility** — Private profiles aren't viewable by others
• Visit cried.bio/yourusername (lowercase, no spaces)
• Check if maintenance mode is active (site banner)

Share your username and I'll help with next steps.`,
  },
  {
    id: "import-export",
    category: "import_export",
    keywords: ["import", "export", "json", "backup", "restore", "transfer"],
    title: "Import & Export",
    content: `**Export presets** from My Presets → export button (downloads JSON with metadata).

**Import presets** from My Presets → Import JSON:
• Drag-and-drop .json files
• Handles duplicate names automatically
• Works with exported cried.bio format and legacy JSON

Best way to backup or transfer your profile look between accounts.`,
    links: [{ label: "My Presets", href: "/dashboard/presets" }],
  },
  {
    id: "guestbook",
    category: "widgets",
    keywords: ["guestbook", "comments", "messages", "guest book"],
    title: "Guestbook",
    content: `The guestbook lets visitors leave messages on your profile.

• Enable/disable in dashboard widget or account settings
• Moderate and pin entries from your dashboard

Won't appear if disabled or if your profile is set to Private.`,
  },
  {
    id: "discord",
    category: "widgets",
    keywords: ["discord", "connect", "status", "presence"],
    title: "Discord Integration",
    content: `Connect Discord from dashboard integrations or widget settings:

• Shows Discord status/presence on your profile
• Requires OAuth authorization with Discord
• Reconnect if status stops updating`,
  },
  {
    id: "username-change",
    category: "account",
    keywords: ["username change", "change username", "rename", "cooldown"],
    title: "Username Changes",
    content: `Change your username at **Dashboard → Settings → Account**.

• **Free accounts:** once every **7 days**
• **Premium Lite:** once every **24 hours**

If a username is taken or reserved, pick a different one.`,
    links: [{ label: "Settings", href: "/dashboard/settings" }],
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
    if (normalized.includes(entry.category.replace("_", " "))) score += 2;
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
    ["billing", ["billing", "payment", "stripe", "charge", "refund", "invoice", "cancel subscription", "cost", "price"]],
    ["premium", ["premium", "upgrade", "subscription", "premium lite", "lifetime", "how much"]],
    ["presets", ["preset", "import", "export", "json"]],
    ["layouts", ["layout", "theme layout"]],
    ["effects", ["border", "effect", "animated", "glow"]],
    ["backgrounds", ["background", "video", "wallpaper"]],
    ["music", ["music", "spotify", "playlist", "player"]],
    ["badges", ["badge", "medallion"]],
    ["widgets", ["widget", "guestbook", "discord"]],
    ["account", ["login", "password", "sign in", "account access", "email", "private", "visibility", "settings"]],
    ["bug", ["bug", "broken", "error", "not working", "glitch"]],
    ["profile", ["profile", "customize", "bio", "avatar", "save"]],
  ];

  for (const [category, keywords] of categoryKeywords) {
    if (keywords.some((kw) => normalized.includes(kw))) return category;
  }
  return "other";
}

export function formatKnowledgeForPrompt(entries: KnowledgeEntry[]): string {
  const critical = getCriticalFactsBlock();
  if (entries.length === 0) return `${critical}\n\nNo specific knowledge entries matched.`;
  const matched = entries
    .map(
      (e) =>
        `### ${e.title} (${e.category})\n${e.content}${e.links?.length ? `\nLinks: ${e.links.map((l) => `${l.label}: ${l.href}`).join(", ")}` : ""}`,
    )
    .join("\n\n");
  return `${critical}\n\n## Matched topics\n${matched}`;
}

export function formatFullKnowledgeForPrompt(): string {
  return `${getCriticalFactsBlock()}\n\n## Full knowledge base\n${SUPPORT_KNOWLEDGE_BASE.map((e) => `### ${e.title}\n${e.content}`).join("\n\n")}`;
}
