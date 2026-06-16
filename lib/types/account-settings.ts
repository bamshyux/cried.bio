import type { UsernameChangeCooldownInfo } from "@/lib/username-cooldown";

export type ProfileVisibility = "public" | "unlisted" | "private";

export type AccountPreferences = {
  profile_id: string;
  phone_number: string;
  email_notifications: boolean;
  marketing_emails: boolean;
  profile_visibility: ProfileVisibility;
  show_in_search: boolean;
  hide_view_counts: boolean;
  allow_direct_contact: boolean;
  created_at: string;
  updated_at: string;
};

export type LoginHistoryEntry = {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  device_label: string | null;
  success: boolean;
  created_at: string;
};

export type UserSession = {
  id: string;
  user_id: string;
  session_token_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  device_label: string | null;
  last_active_at: string;
  created_at: string;
  revoked_at: string | null;
};

export type MfaRecoveryCodeSummary = {
  total: number;
  remaining: number;
};

export type AccountSettingsData = {
  email: string;
  username: string | null;
  usernameChangeCooldown: UsernameChangeCooldownInfo;
  preferences: AccountPreferences;
  mfaEnabled: boolean;
  mfaFactorId: string | null;
  recoveryCodes: MfaRecoveryCodeSummary;
  loginHistory: LoginHistoryEntry[];
  sessions: UserSession[];
  guestbookEnabled: boolean;
  showViewCount: boolean;
};

export type AccountSettingsFormState = {
  error?: string;
  success?: string;
  recoveryCodes?: string[];
};

export type SettingsCategory = "account" | "security" | "contact" | "privacy" | "danger";
