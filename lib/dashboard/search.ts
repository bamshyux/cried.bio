import type { SearchIconId } from "@/lib/dashboard/search-icons";
import {
  DASHBOARD_SECTIONS,
  type DashboardNavItem,
  type DashboardSearchEntry,
} from "@/lib/dashboard/navigation";

export type DashboardSearchResult = DashboardSearchEntry;

type FeatureEntry = {
  href: string;
  label: string;
  description?: string;
  section: string;
  sectionId: string;
  iconId: SearchIconId;
  keywords: string[];
  priority?: number;
};

/** Granular dashboard destinations beyond sidebar nav labels. */
const DASHBOARD_FEATURE_ENTRIES: FeatureEntry[] = [
  {
    href: "/dashboard/music",
    label: "Music",
    description: "Upload and configure profile music",
    section: "Content",
    sectionId: "content",
    iconId: "music",
    keywords: ["music", "audio", "song", "track", "player", "sound"],
    priority: 90,
  },
  {
    href: "/dashboard/music",
    label: "Autoplay Settings",
    description: "Auto-start music when visitors open your page",
    section: "Content",
    sectionId: "content",
    iconId: "music",
    keywords: ["autoplay", "auto play", "auto-play", "automatic playback", "auto start", "music"],
    priority: 85,
  },
  {
    href: "/dashboard/music",
    label: "Music Volume",
    description: "Adjust default music player volume",
    section: "Content",
    sectionId: "content",
    iconId: "music",
    keywords: ["volume", "music volume", "loudness", "quiet"],
    priority: 70,
  },
  {
    href: "/dashboard/music",
    label: "Upload Music",
    description: "Add an MP3 or audio file to your profile",
    section: "Content",
    sectionId: "content",
    iconId: "music",
    keywords: ["upload music", "mp3", "audio file", "add music", "background music"],
    priority: 80,
  },
  {
    href: "/dashboard/embeds",
    label: "Spotify Widget",
    description: "Embed Spotify tracks or playlists",
    section: "Content",
    sectionId: "content",
    iconId: "embed",
    keywords: ["spotify", "spotify widget", "spotify embed", "playlist", "music", "audio"],
    priority: 88,
  },
  {
    href: "/dashboard/embeds",
    label: "YouTube Embed",
    description: "Embed YouTube videos on your profile",
    section: "Content",
    sectionId: "content",
    iconId: "embed",
    keywords: ["youtube", "youtube embed", "video embed", "watch"],
    priority: 75,
  },
  {
    href: "/dashboard/embeds",
    label: "Embeds",
    description: "YouTube, Spotify, Twitch, Roblox, and more",
    section: "Content",
    sectionId: "content",
    iconId: "embed",
    keywords: ["embed", "embeds", "iframe", "twitch", "roblox"],
    priority: 72,
  },
  {
    href: "/dashboard/background",
    label: "Background",
    description: "Gradients, images, video, and particles",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "background",
    keywords: ["background", "wallpaper", "backdrop", "bg"],
    priority: 90,
  },
  {
    href: "/dashboard/background",
    label: "Change Background",
    description: "Update your profile background style",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "background",
    keywords: ["change background", "change bg", "new background", "set background"],
    priority: 95,
  },
  {
    href: "/dashboard/background",
    label: "Video Background",
    description: "Use a looping video behind your profile",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "video",
    keywords: ["video background", "background video", "mp4", "looping video"],
    priority: 82,
  },
  {
    href: "/dashboard/background",
    label: "Gradient Background",
    description: "Multi-color gradient backgrounds",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "background",
    keywords: ["gradient", "gradient background", "gradient colors", "animated gradient"],
    priority: 78,
  },
  {
    href: "/dashboard/background",
    label: "Particle Effects",
    description: "Snow, stars, rain, and other particles",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "effects",
    keywords: ["particles", "particle", "particle effects", "snow", "stars", "rain", "confetti"],
    priority: 76,
  },
  {
    href: "/dashboard/customize",
    label: "Customize",
    description: "Colors, fonts, card style, and accents",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "customize",
    keywords: ["customize", "colors", "fonts", "accent", "style", "theme colors"],
    priority: 80,
  },
  {
    href: "/dashboard/premium/profile-effects",
    label: "Profile Effects",
    description: "Animated borders around your profile picture",
    section: "Premium",
    sectionId: "premium",
    iconId: "premium",
    keywords: ["avatar", "pfp", "profile picture", "border", "ring", "effect", "premium"],
    priority: 78,
  },
  {
    href: "/dashboard/card-border-effects",
    label: "Card Border Effects",
    description: "Animated borders for profile cards",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "effects",
    keywords: [
      "border",
      "card border",
      "snake",
      "neon glow",
      "rgb",
      "animated border",
      "outline",
      "guns.lol",
      "card effects",
    ],
    priority: 79,
  },
  {
    href: "/dashboard/customize",
    label: "Accent Color",
    description: "Change your profile accent color",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "customize",
    keywords: ["accent", "accent color", "primary color", "color"],
    priority: 74,
  },
  {
    href: "/dashboard/custom-theme",
    label: "Custom CSS",
    description: "Write scoped CSS for your profile",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "code",
    keywords: ["css", "custom css", "stylesheet", "code", "style sheet"],
    priority: 92,
  },
  {
    href: "/dashboard/custom-theme",
    label: "Theme Builder",
    description: "Build and save custom CSS themes",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "code",
    keywords: ["theme builder", "custom theme", "scoped css", "css editor"],
    priority: 84,
  },
  {
    href: "/dashboard/themes",
    label: "Layouts",
    description: "Choose from 37 preset page layouts",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "layout",
    keywords: ["layout", "layouts", "template", "page layout", "structure"],
    priority: 78,
  },
  {
    href: "/dashboard/effects",
    label: "Effects",
    description: "Cursor, username, bio, and entrance effects",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "effects",
    keywords: ["effects", "animation", "glow", "visual effects"],
    priority: 70,
  },
  {
    href: "/dashboard/effects",
    label: "Cursor Effect",
    description: "Custom cursor styles and images",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "effects",
    keywords: ["cursor", "custom cursor", "cursor effect", "mouse"],
    priority: 76,
  },
  {
    href: "/dashboard/effects",
    label: "Enter Gate",
    description: "Click-to-enter screen before your profile loads",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "effects",
    keywords: ["enter gate", "click to enter", "gate", "splash", "landing screen"],
    priority: 74,
  },
  {
    href: "/dashboard/effects",
    label: "Profile Favicon",
    description: "Upload a custom tab icon for your profile page",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "effects",
    keywords: [
      "favicon",
      "profile favicon",
      "tab icon",
      "browser icon",
      "site icon",
      "ico",
      "profile icon",
      "tab favicon",
      "browser tab icon",
    ],
    priority: 96,
  },
  {
    href: "/dashboard/effects",
    label: "Tab Title Animation",
    description: "Animate your browser tab title with typewriter and other effects",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "effects",
    keywords: [
      "tab title",
      "title animation",
      "tab title animation",
      "typewriter",
      "browser tab",
      "animated title",
      "tab animation",
      "browser title",
    ],
    priority: 94,
  },
  {
    href: "/dashboard/effects",
    label: "Username Effect",
    description: "Glitch, rainbow, and animated username styles",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "effects",
    keywords: ["username effect", "username animation", "name effect", "glitch name", "animated username"],
    priority: 72,
  },
  {
    href: "/dashboard/effects",
    label: "Typing Bio",
    description: "Typewriter effect for your profile bio",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "effects",
    keywords: ["typing bio", "typewriter bio", "bio animation", "animated bio"],
    priority: 70,
  },
  {
    href: "/dashboard/effects",
    label: "Page Entrance Animation",
    description: "Choose how your profile animates in after visitors click to enter",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "effects",
    keywords: ["page entrance animation", "entrance animation", "fade in", "profile animation", "pop in", "unfold", "after enter gate"],
    priority: 68,
  },
  {
    href: "/dashboard/effects",
    label: "Hover Animations",
    description: "Animate links and cards when visitors hover",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "effects",
    keywords: ["hover", "hover animation", "hover effects", "link hover"],
    priority: 66,
  },
  {
    href: "/dashboard/music",
    label: "Music Player Color",
    description: "Customize the music player accent on your profile",
    section: "Content",
    sectionId: "content",
    iconId: "music",
    keywords: ["music player color", "player color", "music accent", "music player", "player accent"],
    priority: 76,
  },
  {
    href: "/dashboard/explore/themes?type=profile_preset",
    label: "Community Presets",
    description: "Browse and install profile presets shared by others",
    section: "Presets",
    sectionId: "presets",
    iconId: "presets",
    keywords: [
      "community preset",
      "community presets",
      "install preset",
      "shared preset",
      "public preset",
    ],
    priority: 84,
  },
  {
    href: "/dashboard/explore/leaderboard",
    label: "Leaderboard",
    description: "Top viewed and most followed cried.bio creators",
    section: "Explore",
    sectionId: "explore",
    iconId: "analytics",
    keywords: ["leaderboard", "rankings", "top profiles", "most viewed", "top creators", "leader board"],
    priority: 82,
  },
  {
    href: "/dashboard/explore/profiles",
    label: "Explore Profiles",
    description: "Discover cried.bio creators",
    section: "Explore",
    sectionId: "explore",
    iconId: "explore",
    keywords: ["explore profiles", "discover profiles", "find profiles", "browse profiles", "creators"],
    priority: 80,
  },
  {
    href: "/dashboard/customize",
    label: "Glassmorphism",
    description: "Frosted glass blur on profile cards",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "customize",
    keywords: ["glassmorphism", "glass", "frosted glass", "blur card", "glass effect"],
    priority: 73,
  },
  {
    href: "/dashboard/featured",
    label: "Featured Content",
    description: "Pin content blocks above your links",
    section: "Community",
    sectionId: "community",
    iconId: "badges",
    keywords: ["featured", "pinned", "highlight", "featured content", "pin content"],
    priority: 72,
  },
  {
    href: "/dashboard/social",
    label: "Followers",
    description: "View followers and friends",
    section: "Community",
    sectionId: "community",
    iconId: "links",
    keywords: ["followers", "friends", "follow", "following", "social"],
    priority: 74,
  },
  {
    href: "/dashboard/card-border-effects",
    label: "Snake Border",
    description: "Animated light traveling around card outlines",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "effects",
    keywords: ["snake", "snake border", "animated border", "moving border"],
    priority: 77,
  },
  {
    href: "/dashboard/card-border-effects",
    label: "Neon Glow Border",
    description: "Soft glowing outline on profile cards",
    section: "Appearance",
    sectionId: "appearance",
    iconId: "effects",
    keywords: ["neon glow", "neon border", "glow border", "glowing outline"],
    priority: 76,
  },
  {
    href: "/dashboard/setup",
    label: "Setup Wizard",
    description: "First-time profile setup walkthrough",
    section: "Overview",
    sectionId: "overview",
    iconId: "overview",
    keywords: ["setup", "wizard", "onboarding", "getting started", "first time"],
    priority: 65,
  },
  {
    href: "/dashboard/badges",
    label: "Badges",
    description: "Show achievements on your profile",
    section: "Community",
    sectionId: "community",
    iconId: "badges",
    keywords: ["badges", "badge", "achievements", "trophy", "flair"],
    priority: 90,
  },
  {
    href: "/dashboard/badges",
    label: "Badge Glow",
    description: "Enable glowing badge effects",
    section: "Community",
    sectionId: "community",
    iconId: "badges",
    keywords: ["badge glow", "glow", "shiny badges"],
    priority: 68,
  },
  {
    href: "/dashboard/guestbook",
    label: "Guestbook",
    description: "Let visitors leave messages on your profile",
    section: "Community",
    sectionId: "community",
    iconId: "guestbook",
    keywords: ["guestbook", "guest book", "messages", "comments", "visitor messages", "sign", "opacity", "appearance", "border", "spacing"],
    priority: 90,
  },
  {
    href: "/dashboard/widgets",
    label: "Discord Widget",
    description: "Show live Discord status via Lanyard",
    section: "Content",
    sectionId: "content",
    iconId: "widget",
    keywords: ["discord", "discord widget", "discord status", "lanyard", "presence"],
    priority: 86,
  },
  {
    href: "/dashboard/widgets",
    label: "Widgets",
    description: "Discord and custom profile widgets",
    section: "Content",
    sectionId: "content",
    iconId: "widget",
    keywords: ["widget", "widgets"],
    priority: 72,
  },
  {
    href: "/dashboard/links",
    label: "Social Links",
    description: "Add Discord, YouTube, Twitch, and more",
    section: "Profile",
    sectionId: "profile",
    iconId: "links",
    keywords: ["links", "social links", "buttons", "social media"],
    priority: 82,
  },
  {
    href: "/dashboard/profile",
    label: "Avatar & Banner",
    description: "Upload profile photo and banner image",
    section: "Profile",
    sectionId: "profile",
    iconId: "profile",
    keywords: ["avatar", "banner", "profile picture", "photo", "pfp", "header image"],
    priority: 84,
  },
  {
    href: "/dashboard/profile",
    label: "Username",
    description: "Set your cried.bio URL",
    section: "Profile",
    sectionId: "profile",
    iconId: "profile",
    keywords: ["username", "handle", "url", "link in bio"],
    priority: 80,
  },
  {
    href: "/dashboard/profile-presets",
    label: "Profile Presets",
    description: "Save and switch complete profile looks",
    section: "Presets",
    sectionId: "presets",
    iconId: "presets",
    keywords: ["preset", "presets", "save style", "profile preset"],
    priority: 70,
  },
  {
    href: "/dashboard/analytics",
    label: "Stats",
    description: "Views, visitors, and link click stats",
    section: "Stats",
    sectionId: "analytics",
    iconId: "analytics",
    keywords: ["analytics", "stats", "views", "traffic", "clicks", "visitors", "growth"],
    priority: 75,
  },
  {
    href: "/dashboard/settings",
    label: "Account Settings",
    description: "Username, email, security, and privacy",
    section: "Settings",
    sectionId: "settings",
    iconId: "settings",
    keywords: ["settings", "account", "security", "password", "email", "privacy"],
    priority: 78,
  },
];

function buildNavSearchEntries(): DashboardSearchResult[] {
  const entries: DashboardSearchResult[] = [];

  for (const section of DASHBOARD_SECTIONS) {
    if (section.href === "/dashboard") {
      entries.push({
        href: section.href,
        label: section.label,
        description: section.description,
        section: section.label,
        sectionId: section.id,
        Icon: section.Icon,
        keywords: ["home", "overview", "dashboard"],
        priority: 50,
      });
      continue;
    }

    for (const item of section.items) {
      entries.push({
        ...item,
        section: section.label,
        sectionId: section.id,
        priority: 60,
      });
    }

    if (!section.items.some((item) => item.href === section.href)) {
      entries.push({
        href: section.href,
        label: section.label,
        description: section.description,
        section: section.label,
        sectionId: section.id,
        Icon: section.Icon,
        priority: 55,
      });
    }
  }

  return entries;
}

function dedupeEntries(entries: DashboardSearchResult[]): DashboardSearchResult[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.href}:${entry.label.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

let cachedIndex: DashboardSearchResult[] | null = null;

export function getFullDashboardSearchIndex(): DashboardSearchResult[] {
  if (cachedIndex) return cachedIndex;

  const navEntries = buildNavSearchEntries();
  const featureEntries: DashboardSearchResult[] = DASHBOARD_FEATURE_ENTRIES.map((entry) => ({
    href: entry.href,
    label: entry.label,
    description: entry.description,
    section: entry.section,
    sectionId: entry.sectionId,
    iconId: entry.iconId,
    keywords: entry.keywords,
    priority: entry.priority,
  }));

  cachedIndex = dedupeEntries([...featureEntries, ...navEntries]);
  return cachedIndex;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,./+|]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

function scoreSearchEntry(entry: DashboardSearchResult, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return entry.priority ?? 1;

  const label = entry.label.toLowerCase();
  const description = (entry.description ?? "").toLowerCase();
  const section = entry.section.toLowerCase();
  const keywords = (entry.keywords ?? []).map((keyword) => keyword.toLowerCase());
  const haystack = [label, description, section, ...keywords].join(" ");
  const tokens = tokenize(q);

  if (label === q) return 300;
  if (keywords.some((keyword) => keyword === q)) return 280;
  if (label.startsWith(q)) return 270;
  if (q.length >= 3 && keywords.some((keyword) => keyword.startsWith(q))) return 265;
  if (label.includes(q)) return 260;
  if (keywords.some((keyword) => keyword.includes(q))) return 240;
  if (description.includes(q)) return 230;
  if (haystack.includes(q)) return 200;

  if (tokens.length > 0 && tokens.every((token) => haystack.includes(token))) {
    const labelHits = tokens.filter((token) => label.includes(token)).length;
    const keywordHits = tokens.filter((token) =>
      keywords.some((keyword) => keyword.includes(token)),
    ).length;
    return 150 + labelHits * 25 + keywordHits * 20 + tokens.length * 5;
  }

  const matchedTokens = tokens.filter((token) => haystack.includes(token)).length;
  if (matchedTokens > 0) {
    return 40 + matchedTokens * 30 + (entry.priority ?? 0) * 0.1;
  }

  return 0;
}

export function searchDashboardIndex(query: string, limit = 16): DashboardSearchResult[] {
  const index = getFullDashboardSearchIndex();
  const q = query.trim();

  if (!q) {
    return [...index]
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      .slice(0, limit);
  }

  return index
    .map((entry) => ({ entry, score: scoreSearchEntry(entry, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || (b.entry.priority ?? 0) - (a.entry.priority ?? 0))
    .map(({ entry }) => entry)
    .slice(0, limit);
}

/** Back-compat helper for callers expecting nav-only index shape. */
export function getDashboardSearchIndex(): Array<DashboardNavItem & { section: string; sectionId: string }> {
  return getFullDashboardSearchIndex();
}
