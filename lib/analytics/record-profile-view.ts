import {
  BAM_FROZEN_VIEW_COUNT,
  isFrozenViewCountProfile,
} from "@/lib/analytics/frozen-view-count";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type RecordProfileViewResult = {
  ok: boolean;
  recorded?: boolean;
  deduplicated?: boolean;
  skipped?: boolean;
  error?: string;
};

function isUniqueViolation(code: string | undefined): boolean {
  return code === "23505";
}

async function bumpProfileViewCount(profileId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const { error: rpcError } = await admin.rpc("increment_profile_view_count", {
    p_profile_id: profileId,
  });

  if (!rpcError) return;

  const { data: profile } = await admin
    .from("profiles")
    .select("view_count, view_count_frozen")
    .eq("id", profileId)
    .not("username", "is", null)
    .maybeSingle();

  if (!profile || isFrozenViewCountProfile(profile)) return;

  const next = (Number(profile.view_count) || 0) + 1;
  await admin.from("profiles").update({ view_count: next }).eq("id", profileId);
}

async function recordViaRpc(
  profileId: string,
  visitorHash: string,
  country: string,
): Promise<RecordProfileViewResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_profile_view", {
    p_profile_id: profileId,
    p_visitor_hash: visitorHash,
    p_country: country,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const result = (data ?? {}) as RecordProfileViewResult;
  return {
    ok: result.error !== "profile_not_found",
    recorded: !!result.recorded,
    deduplicated: !!result.deduplicated,
    skipped: !!result.skipped,
    error: result.error,
  };
}

/** Record a profile view using service role when available (bypasses analytics RLS). */
export async function recordProfileView(
  profileId: string,
  visitorHash: string,
  country: string,
  viewerUserId: string | null,
): Promise<RecordProfileViewResult> {
  if (viewerUserId && viewerUserId === profileId) {
    return { ok: true, skipped: true };
  }

  const hash = visitorHash.slice(0, 64);
  const countryLabel = country.slice(0, 64) || "Unknown";

  async function isFrozenProfile(): Promise<boolean> {
    const admin = createAdminClient();
    const client = admin ?? (await createClient());
    const { data: profile } = await client
      .from("profiles")
      .select("username, uid, view_count_frozen")
      .eq("id", profileId)
      .not("username", "is", null)
      .maybeSingle();
    return isFrozenViewCountProfile(profile);
  }

  if (await isFrozenProfile()) {
    return { ok: true, skipped: true };
  }

  const admin = createAdminClient();

  if (admin) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", profileId)
      .not("username", "is", null)
      .maybeSingle();

    if (!profile) {
      return { ok: false, error: "profile_not_found" };
    }

    const { count: existingViews } = await admin
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("event_type", "profile_view")
      .eq("visitor_hash", hash);

    if ((existingViews ?? 0) > 0) {
      return { ok: true, deduplicated: true };
    }

    const { data: inserted, error } = await admin
      .from("analytics_events")
      .insert({
        profile_id: profileId,
        event_type: "profile_view",
        visitor_hash: hash,
        country: countryLabel,
      })
      .select("id")
      .maybeSingle();

    if (!error && inserted) {
      await bumpProfileViewCount(profileId);
      return { ok: true, recorded: true };
    }

    if (isUniqueViolation(error?.code)) {
      return { ok: true, deduplicated: true };
    }

    if (error) {
      return recordViaRpc(profileId, hash, countryLabel);
    }
  }

  return recordViaRpc(profileId, hash, countryLabel);
}

async function countAnalyticsProfileViews(profileId: string): Promise<number | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { count, error } = await admin
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .eq("event_type", "profile_view");

  if (error) return null;
  return count ?? 0;
}

export async function readPublicViewCount(profileId: string): Promise<number> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, uid, view_count, view_count_frozen")
    .eq("id", profileId)
    .not("username", "is", null)
    .maybeSingle();

  if (isFrozenViewCountProfile(profile)) {
    return BAM_FROZEN_VIEW_COUNT;
  }

  if (profile?.view_count != null) {
    const stored = Number(profile.view_count);
    if (Number.isFinite(stored)) {
      return stored;
    }
  }

  const { data, error } = await supabase.rpc("get_public_profile_view_count", {
    p_profile_id: profileId,
  });

  if (!error && data != null) {
    const rpcCount = Number(data);
    if (Number.isFinite(rpcCount)) {
      return rpcCount;
    }
  }

  const analyticsCount = await countAnalyticsProfileViews(profileId);
  if (analyticsCount != null) {
    return analyticsCount;
  }

  return 0;
}
