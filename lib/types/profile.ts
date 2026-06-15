export type Profile = {
  id: string;
  uid: number | null;
  username: string | null;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  banner_url: string | null;
  premium_tier?: "free" | "premium";
  premium_expires_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileFormState = {
  error?: string;
  success?: string;
};
