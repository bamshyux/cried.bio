export type LinkPlatformStat = {
  link_id: string;
  platform: string;
  platform_username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  follower_count: number | null;
  count_label: string;
  fetched_at: string | null;
};

export type TotalFollowersSummary = {
  total: number;
  items: LinkPlatformStat[];
};

export type PlatformStatFetchResult = {
  platform_username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  follower_count: number | null;
  count_label: string;
};
