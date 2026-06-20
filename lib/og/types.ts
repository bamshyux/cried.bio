export type OgBadgeChip = {
  name: string;
  color: string;
  slug: string;
};

export type OgBackground =
  | { kind: "image"; url: string }
  | { kind: "gradient"; colors: string[] }
  | { kind: "solid"; color: string };

export type OgProfileSnapshot = {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  background: OgBackground;
  accentColor: string;
  textColor: string;
  cardOpacity: number;
  badges: OgBadgeChip[];
  followers: number;
  views: number | null;
  showViews: boolean;
};
