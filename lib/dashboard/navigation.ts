import type { ComponentType } from "react";
import {
  IconAnalytics,
  IconBackground,
  IconBadges,
  IconCustomize,
  IconEffects,
  IconLayout,
  IconLinks,
  IconMusic,
  IconOverview,
  IconProfile,
  IconExplore,
  IconSettings,
  IconPresets,
  IconPremium,
  IconHome,
} from "@/components/icons/dashboard-icons";

export type DashboardNavItem = {
  href: string;
  label: string;
  description?: string;
  keywords?: string[];
  Icon?: ComponentType<{ size?: number; className?: string }>;
};

export type DashboardSection = {
  id: string;
  label: string;
  href: string;
  description: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
  items: DashboardNavItem[];
};

export const DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/dashboard",
    description: "Your dashboard home",
    Icon: IconOverview,
    items: [],
  },
  {
    id: "profile",
    label: "Profile",
    href: "/dashboard/profile",
    description: "Display name, username, bio, avatar, and banner",
    Icon: IconProfile,
    items: [],
  },
  {
    id: "appearance",
    label: "Appearance",
    href: "/dashboard/appearance",
    description: "Look and feel of your page",
    Icon: IconCustomize,
    items: [
      {
        href: "/dashboard/customize",
        label: "Customize",
        description: "Colors, fonts, and card style",
        keywords: ["colors", "fonts", "accent", "theme"],
        Icon: IconCustomize,
      },
      {
        href: "/dashboard/card-border-effects",
        label: "Card Border Effects",
        description: "Animated borders for profile cards",
        keywords: ["border", "glow", "snake", "neon", "card effects", "outline", "animated border"],
        Icon: IconEffects,
      },
      {
        href: "/dashboard/background",
        label: "Background",
        description: "Gradients, video, and particles",
        keywords: ["background", "gradient", "video", "particles", "change background", "wallpaper", "bg"],
        Icon: IconBackground,
      },
      {
        href: "/dashboard/themes",
        label: "Layouts",
        description: "37 preset page layouts",
        keywords: ["layout", "theme", "template"],
        Icon: IconLayout,
      },
      {
        href: "/dashboard/effects",
        label: "Effects",
        description: "Cursor, tab favicon, title animations, enter gate",
        keywords: ["effects", "cursor", "favicon", "tab title", "typewriter", "animation"],
        Icon: IconEffects,
      },
      {
        href: "/dashboard/custom-theme",
        label: "Custom Themes",
        description: "Scoped CSS editor",
        keywords: ["css", "custom", "code", "stylesheet"],
        Icon: IconEffects,
      },
    ],
  },
  {
    id: "presets",
    label: "Presets",
    href: "/dashboard/presets",
    description: "Save and share complete profile looks",
    Icon: IconPresets,
    items: [
      {
        href: "/dashboard/profile-presets",
        label: "My presets",
        description: "Save and switch full profile styles",
        keywords: ["preset", "saved", "profile", "switch", "scene"],
        Icon: IconPresets,
      },
      {
        href: "/dashboard/explore/themes?type=profile_preset",
        label: "Community presets",
        description: "Browse presets shared by others",
        keywords: ["community", "preset", "share", "install"],
        Icon: IconExplore,
      },
    ],
  },
  {
    id: "content",
    label: "Content",
    href: "/dashboard/content",
    description: "What visitors see on your page",
    Icon: IconLinks,
    items: [
      {
        href: "/dashboard/links",
        label: "Links",
        description: "Add and reorder links",
        keywords: ["links", "buttons"],
        Icon: IconLinks,
      },
      {
        href: "/dashboard/embeds",
        label: "Embeds",
        description: "YouTube, Spotify, and more",
        keywords: ["embed", "youtube", "spotify"],
        Icon: IconLayout,
      },
      {
        href: "/dashboard/widgets",
        label: "Widgets",
        description: "Discord and custom widgets",
        keywords: ["widget", "discord"],
        Icon: IconEffects,
      },
      {
        href: "/dashboard/music",
        label: "Music",
        description: "Background music player",
        keywords: ["music", "audio", "player", "autoplay", "spotify"],
        Icon: IconMusic,
      },
    ],
  },
  {
    id: "explore",
    label: "Explore",
    href: "/dashboard/explore",
    description: "Discover profiles and community themes",
    Icon: IconExplore,
    items: [
      {
        href: "/dashboard/explore/profiles",
        label: "Explore Profiles",
        description: "Browse cried.bio creators",
        keywords: ["explore", "profiles", "users", "discover"],
        Icon: IconExplore,
      },
      {
        href: "/dashboard/explore/themes",
        label: "Community Themes",
        description: "Install themes from the community",
        keywords: ["themes", "marketplace", "css", "community"],
        Icon: IconLayout,
      },
      {
        href: "/dashboard/explore/leaderboard",
        label: "Leaderboard",
        description: "Top viewed and most followed creators",
        keywords: ["leaderboard", "rankings", "views", "followers", "top"],
        Icon: IconAnalytics,
      },
    ],
  },
  {
    id: "community",
    label: "Community",
    href: "/dashboard/community",
    description: "Engage with your audience",
    Icon: IconBadges,
    items: [
      {
        href: "/dashboard/guestbook",
        label: "Guestbook",
        description: "Visitor messages and reactions",
        keywords: ["guestbook", "messages", "comments"],
        Icon: IconProfile,
      },
      {
        href: "/dashboard/social",
        label: "Followers",
        description: "Friends and follow counts",
        keywords: ["followers", "friends", "social"],
        Icon: IconLinks,
      },
      {
        href: "/dashboard/badges",
        label: "Badges",
        description: "Show off achievements",
        keywords: ["badges", "achievements"],
        Icon: IconBadges,
      },
      {
        href: "/dashboard/featured",
        label: "Featured",
        description: "Pinned content blocks",
        keywords: ["featured", "pinned", "highlight"],
        Icon: IconBadges,
      },
    ],
  },
  {
    id: "analytics",
    label: "Stats",
    href: "/dashboard/analytics",
    description: "Views, visitors, link clicks, and growth",
    Icon: IconAnalytics,
    items: [],
  },
  {
    id: "premium",
    label: "Premium",
    href: "/dashboard/premium",
    description: "Upgrade and manage your plan",
    Icon: IconPremium,
    items: [
      {
        href: "/dashboard/premium",
        label: "Plans",
        description: "Upgrade and manage billing",
        keywords: ["premium", "upgrade", "billing"],
        Icon: IconPremium,
      },
      {
        href: "/dashboard/pages",
        label: "Pages",
        description: "Content pages for your personal site",
        keywords: ["pages", "content", "gallery", "about"],
        Icon: IconHome,
      },
      {
        href: "/dashboard/preset-schedules",
        label: "Scheduled presets",
        description: "Auto-swap presets by time",
        keywords: ["schedule", "preset", "day", "night"],
        Icon: IconPresets,
      },
      {
        href: "/dashboard/premium/custom-effect",
        label: "Custom effect",
        description: "Request a bespoke profile effect",
        keywords: ["effect", "custom", "request"],
        Icon: IconEffects,
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    href: "/dashboard/settings",
    description: "Account and preferences",
    Icon: IconSettings,
    items: [],
  },
];

import type { SearchIconId } from "@/lib/dashboard/search-icons";

export type DashboardSearchEntry = DashboardNavItem & {
  section: string;
  sectionId: string;
  iconId?: SearchIconId;
  priority?: number;
};

export function getSectionForPath(pathname: string): DashboardSection | undefined {
  if (pathname === "/dashboard") return DASHBOARD_SECTIONS[0];
  if (pathname.startsWith("/dashboard/admin")) return undefined;

  return DASHBOARD_SECTIONS.find((section) => {
    if (pathname === section.href) return true;
    if (section.id === "premium" && pathname.startsWith("/dashboard/premium")) return true;
    return section.items.some((item) => pathname.startsWith(item.href) && item.href !== "/dashboard");
  }) ?? DASHBOARD_SECTIONS.find((section) =>
    section.href !== "/dashboard" && pathname.startsWith(section.href),
  );
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/appearance") {
    return ["/dashboard/appearance", "/dashboard/customize", "/dashboard/card-border-effects", "/dashboard/background", "/dashboard/themes", "/dashboard/effects", "/dashboard/custom-theme"].some((p) => pathname.startsWith(p));
  }
  if (href === "/dashboard/presets") {
    return ["/dashboard/presets", "/dashboard/profile-presets"].some((p) => pathname.startsWith(p));
  }
  if (href === "/dashboard/content") {
    return ["/dashboard/content", "/dashboard/links", "/dashboard/embeds", "/dashboard/widgets", "/dashboard/music"].some((p) => pathname.startsWith(p));
  }
  if (href === "/dashboard/explore") {
    return ["/dashboard/explore", "/dashboard/explore/profiles", "/dashboard/explore/themes", "/dashboard/explore/leaderboard"].some((p) => pathname.startsWith(p));
  }
  if (href === "/dashboard/community") {
    return ["/dashboard/community", "/dashboard/guestbook", "/dashboard/social", "/dashboard/badges", "/dashboard/featured"].some((p) => pathname.startsWith(p));
  }
  if (href === "/dashboard/profile") {
    return pathname.startsWith("/dashboard/profile");
  }
  if (href === "/dashboard/premium") {
    return [
      "/dashboard/premium",
      "/dashboard/pages",
      "/dashboard/profile-pages",
      "/dashboard/preset-schedules",
      "/dashboard/premium/custom-effect",
    ].some((p) => pathname.startsWith(p));
  }
  if (href === "/dashboard/settings") {
    return pathname.startsWith("/dashboard/settings");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Only one submenu item should look active — longest / exact href wins; ties go to first item. */
export function isSubNavItemActive(
  pathname: string,
  item: DashboardNavItem,
  items: DashboardNavItem[],
): boolean {
  let bestScore = -1;
  let bestIndex = -1;

  items.forEach((it, index) => {
    let score = -1;
    if (pathname === it.href) {
      score = 1000 + it.href.length * 100;
    } else if (it.href !== "/dashboard" && pathname.startsWith(`${it.href}/`)) {
      score = it.href.length * 100;
    }

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    } else if (score === bestScore && score >= 0 && index < bestIndex) {
      bestIndex = index;
    }
  });

  const itemIndex = items.findIndex((it) => it.href === item.href && it.label === item.label);
  return itemIndex === bestIndex && bestScore >= 0;
}
