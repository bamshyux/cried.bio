export type SocialPlatformId =
  | "youtube"
  | "discord"
  | "twitch"
  | "tiktok"
  | "instagram"
  | "twitter"
  | "github"
  | "spotify"
  | "steam"
  | "roblox"
  | "kick"
  | "telegram"
  | "facebook"
  | "reddit"
  | "custom"
  | "link";

export type SocialPlatform = {
  id: SocialPlatformId;
  name: string;
  placeholder: string;
  hint: string;
  buildUrl: (input: string) => string;
  buildTitle: (input: string) => string;
};

function clean(input: string) {
  return input.trim().replace(/^@/, "");
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: "youtube",
    name: "YouTube",
    placeholder: "channel or @handle",
    hint: "Username, @handle, or full URL",
    buildUrl: (input) => {
      const v = clean(input);
      if (v.startsWith("http")) return v;
      return v.startsWith("@") ? `https://youtube.com/${v}` : `https://youtube.com/@${v}`;
    },
    buildTitle: () => "YouTube",
  },
  {
    id: "discord",
    name: "Discord",
    placeholder: "invite code or URL",
    hint: "discord.gg/code or full invite link",
    buildUrl: (input) => {
      const v = clean(input);
      if (v.startsWith("http")) return v;
      return v.includes("discord.gg") ? `https://${v}` : `https://discord.gg/${v}`;
    },
    buildTitle: () => "Discord",
  },
  {
    id: "twitch",
    name: "Twitch",
    placeholder: "username",
    hint: "Your Twitch username",
    buildUrl: (input) => {
      const v = clean(input);
      if (v.startsWith("http")) return v;
      return `https://twitch.tv/${v}`;
    },
    buildTitle: () => "Twitch",
  },
  {
    id: "tiktok",
    name: "TikTok",
    placeholder: "@username",
    hint: "Your TikTok handle",
    buildUrl: (input) => {
      const v = clean(input);
      if (v.startsWith("http")) return v;
      return v.startsWith("@") ? `https://tiktok.com/${v}` : `https://tiktok.com/@${v}`;
    },
    buildTitle: () => "TikTok",
  },
  {
    id: "instagram",
    name: "Instagram",
    placeholder: "username",
    hint: "Your Instagram username",
    buildUrl: (input) => {
      const v = clean(input);
      if (v.startsWith("http")) return v;
      return `https://instagram.com/${v}`;
    },
    buildTitle: () => "Instagram",
  },
  {
    id: "twitter",
    name: "X / Twitter",
    placeholder: "username",
    hint: "Your X handle without @",
    buildUrl: (input) => {
      const v = clean(input);
      if (v.startsWith("http")) return v;
      return `https://x.com/${v}`;
    },
    buildTitle: () => "X",
  },
  {
    id: "github",
    name: "GitHub",
    placeholder: "username",
    hint: "Your GitHub username",
    buildUrl: (input) => {
      const v = clean(input);
      if (v.startsWith("http")) return v;
      return `https://github.com/${v}`;
    },
    buildTitle: () => "GitHub",
  },
  {
    id: "spotify",
    name: "Spotify",
    placeholder: "artist or profile URL",
    hint: "Spotify profile or artist link",
    buildUrl: (input) => {
      const v = input.trim();
      if (v.startsWith("http")) return v;
      return `https://open.spotify.com/user/${clean(v)}`;
    },
    buildTitle: () => "Spotify",
  },
  {
    id: "steam",
    name: "Steam",
    placeholder: "profile ID or URL",
    hint: "Steam profile URL or ID",
    buildUrl: (input) => {
      const v = input.trim();
      if (v.startsWith("http")) return v;
      return `https://steamcommunity.com/id/${clean(v)}`;
    },
    buildTitle: () => "Steam",
  },
  {
    id: "roblox",
    name: "Roblox",
    placeholder: "username or profile URL",
    hint: "Roblox username or profile link",
    buildUrl: (input) => {
      const v = input.trim();
      if (v.startsWith("http")) return v;
      return `https://www.roblox.com/users/profile?username=${encodeURIComponent(clean(v))}`;
    },
    buildTitle: () => "Roblox",
  },
  {
    id: "kick",
    name: "Kick",
    placeholder: "username",
    hint: "Your Kick username",
    buildUrl: (input) => {
      const v = clean(input);
      if (v.startsWith("http")) return v;
      return `https://kick.com/${v}`;
    },
    buildTitle: () => "Kick",
  },
  {
    id: "telegram",
    name: "Telegram",
    placeholder: "username",
    hint: "Your Telegram handle",
    buildUrl: (input) => {
      const v = clean(input);
      if (v.startsWith("http")) return v;
      return `https://t.me/${v}`;
    },
    buildTitle: () => "Telegram",
  },
  {
    id: "facebook",
    name: "Facebook",
    placeholder: "username or page URL",
    hint: "Facebook profile or page",
    buildUrl: (input) => {
      const v = input.trim();
      if (v.startsWith("http")) return v;
      return `https://facebook.com/${clean(v)}`;
    },
    buildTitle: () => "Facebook",
  },
  {
    id: "reddit",
    name: "Reddit",
    placeholder: "username",
    hint: "Your Reddit username",
    buildUrl: (input) => {
      const v = clean(input);
      if (v.startsWith("http")) return v;
      return `https://reddit.com/u/${v}`;
    },
    buildTitle: () => "Reddit",
  },
];

export function getPlatform(id: string) {
  return SOCIAL_PLATFORMS.find((p) => p.id === id);
}

export function isPlatformIcon(icon: string) {
  return SOCIAL_PLATFORMS.some((p) => p.id === icon) || icon === "link" || icon === "custom";
}
