export type AdminAccountSummary = {
  id: string;
  email: string | null;
  uid: number | null;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  is_admin: boolean;
  premium_tier: string;
  premium_expires_at: string | null;
  created_at: string;
};

export type AdminAccountFormState = {
  error?: string;
  success?: string;
};
