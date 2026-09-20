import { createClient } from "@/lib/supabase/server";
import {
  isDatabaseUnavailableError,
  logDatabaseError,
} from "@/lib/db/errors";
import { normalizeUsername } from "@/lib/profile";
import type { Profile } from "@/lib/types/profile";

export type LoadedProfile = Profile & {
  is_admin?: boolean | null;
  role?: string | null;
};

export type ProfileLookupResult =
  | { status: "ok"; profile: LoadedProfile }
  | { status: "not_found" }
  | { status: "unavailable" };

async function lookupProfile(
  column: "id" | "username",
  value: string,
  context: string,
): Promise<ProfileLookupResult> {
  try {
    const supabase = await createClient();
    const query = supabase.from("profiles").select("*");
    const { data, error } =
      column === "id"
        ? await query.eq("id", value).maybeSingle()
        : await query.eq("username", value).maybeSingle();

    if (error) {
      logDatabaseError(context, error);
      return { status: isDatabaseUnavailableError(error) ? "unavailable" : "not_found" };
    }

    if (!data) return { status: "not_found" };
    return { status: "ok", profile: data as LoadedProfile };
  } catch (error) {
    logDatabaseError(context, error);
    return { status: "unavailable" };
  }
}

export async function getProfileByUserId(userId: string) {
  const result = await lookupProfile("id", userId, "getProfileByUserId");
  if (result.status !== "ok") return null;
  return result.profile;
}

export async function lookupProfileByUsername(username: string): Promise<ProfileLookupResult> {
  return lookupProfile("username", normalizeUsername(username), "lookupProfileByUsername");
}

export async function getProfileByUsername(username: string) {
  const result = await lookupProfileByUsername(username);
  if (result.status !== "ok") return null;
  return result.profile;
}
