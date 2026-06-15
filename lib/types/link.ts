import type { LinkAnimation } from "@/lib/types/settings";

export type ProfileLink = {
  id: string;
  profile_id: string;
  title: string;
  url: string;
  icon: string;
  color: string;
  background_color: string;
  animation: LinkAnimation;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
};

export type LinkFormState = {
  error?: string;
  success?: string;
};
