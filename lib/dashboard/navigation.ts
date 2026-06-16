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
    description: "Identity, bio, and links",
    Icon: IconProfile,
    items: [
      {
        href: "/dashboard/profile",
        label: "Profile info",
        description: "Display name, bio, and details",
        keywords: ["name", "bio", "display"],
        Icon: IconProfile,
      },
      {
        href: "/dashboard/profile",
        label: "Username",
        description: "Your cried.bio URL",
        keywords: ["username", "url", "handle"],
        Icon: IconProfile,
      },
      {
        href: "/dashboard/profile",
        label: "Avatar & banner",
        description: "Profile images",
        keywords: ["avatar", "banner", "photo", "picture"],
        Icon: IconProfile,
      },
      {
        href: "/dashboard/links",
        label: "Social links",
        description: "Links shown on your page",
        keywords: ["links", "social", "discord", "twitch"],
        Icon: IconLinks,
      },
    ],
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
        href: "/dashboard/background",
        label: "Background",
        description: "Gradients, video, and particles",
        keywords: ["background", "gradient", "video", "particles"],
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
        description: "Cursor, username, bio, enter gate",
        keywords: ["effects", "cursor", "glow", "animation"],
        Icon: IconEffects,
      },
      {
        href: "/dashboard/custom-theme",
        label: "Custom Themes",
        description: "Scoped CSS editor",
        keywords: ["css", "custom", "code"],
        Icon: IconEffects,
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
        keywords: ["music", "audio", "player"],
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
    label: "Analytics",
    href: "/dashboard/analytics",
    description: "Track your growth",
    Icon: IconAnalytics,
    items: [
      {
        href: "/dashboard/analytics",
        label: "Views",
        description: "Profile view counts",
        keywords: ["views", "traffic"],
        Icon: IconAnalytics,
      },
      {
        href: "/dashboard/analytics",
        label: "Visitors",
        description: "Unique visitor stats",
        keywords: ["visitors", "unique"],
        Icon: IconAnalytics,
      },
      {
        href: "/dashboard/analytics",
        label: "Link clicks",
        description: "Which links get clicked",
        keywords: ["clicks", "links"],
        Icon: IconAnalytics,
      },
      {
        href: "/dashboard/analytics",
        label: "Growth",
        description: "Trends over time",
        keywords: ["growth", "chart", "trends"],
        Icon: IconAnalytics,
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    href: "/dashboard/settings",
    description: "Account and preferences",
    Icon: IconSettings,
    items: [
      {
        href: "/dashboard/settings",
        label: "Account",
        description: "Username, email, visibility",
        keywords: ["account", "email", "username"],
        Icon: IconSettings,
      },
      {
        href: "/dashboard/settings",
        label: "Security",
        description: "Password and MFA",
        keywords: ["security", "password", "mfa", "2fa"],
        Icon: IconSettings,
      },
      {
        href: "/dashboard/settings",
        label: "Notifications",
        description: "Contact preferences",
        keywords: ["notifications", "email", "contact"],
        Icon: IconSettings,
      },
      {
        href: "/dashboard/premium",
        label: "Premium",
        description: "Upgrade your account",
        keywords: ["premium", "upgrade", "pro"],
        Icon: IconBadges,
      },
    ],
  },
];

export type DashboardSearchEntry = DashboardNavItem & {
  section: string;
  sectionId: string;
};

export function getDashboardSearchIndex(): DashboardSearchEntry[] {
  const entries: DashboardSearchEntry[] = [];

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
      });
      continue;
    }

    for (const item of section.items) {
      entries.push({
        ...item,
        section: section.label,
        sectionId: section.id,
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
      });
    }
  }

  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.href}:${entry.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getSectionForPath(pathname: string): DashboardSection | undefined {
  if (pathname === "/dashboard") return DASHBOARD_SECTIONS[0];
  if (pathname.startsWith("/dashboard/admin")) return undefined;

  return DASHBOARD_SECTIONS.find((section) => {
    if (pathname === section.href) return true;
    if (section.id === "settings" && pathname.startsWith("/dashboard/premium")) return true;
    return section.items.some((item) => pathname.startsWith(item.href) && item.href !== "/dashboard");
  }) ?? DASHBOARD_SECTIONS.find((section) =>
    section.href !== "/dashboard" && pathname.startsWith(section.href),
  );
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/appearance") {
    return ["/dashboard/appearance", "/dashboard/customize", "/dashboard/background", "/dashboard/themes", "/dashboard/effects", "/dashboard/custom-theme"].some((p) => pathname.startsWith(p));
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
    return pathname.startsWith("/dashboard/profile") || pathname.startsWith("/dashboard/links");
  }
  if (href === "/dashboard/settings") {
    return pathname.startsWith("/dashboard/settings") || pathname.startsWith("/dashboard/premium");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
