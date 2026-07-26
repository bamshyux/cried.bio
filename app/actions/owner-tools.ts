"use server";

import { revalidatePath } from "next/cache";
import { adminGrantPremiumAction } from "@/app/actions/admin";
import { logAdminAudit, logUserTimelineEvent } from "@/lib/admin/audit";
import { isFounderBadgeSlug } from "@/lib/badges/founder";
import { requireAdminAccess } from "@/lib/auth/admin-access";
import { createNotification } from "@/lib/data/notifications";
import { normalizeUsername } from "@/lib/profile";
import { syncPremiumBadge } from "@/lib/premium/badge-sync";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AdminFormState, AnnouncementType } from "@/lib/types/admin";

async function ownerGuard() {
  const access = await requireAdminAccess("owner");
  if ("error" in access) return { error: access.error } as const;
  return { access } as const;
}

async function db() {
  return createAdminClient() ?? (await createClient());
}

async function lookupProfile(usernameRaw: string) {
  const username = normalizeUsername(usernameRaw);
  if (!username) return { error: "Enter a valid username." } as const;

  const supabase = await db();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, uid, display_name, view_count, premium_tier, created_at")
    .eq("username", username)
    .maybeSingle();

  if (error) return { error: error.message } as const;
  if (!profile?.username) return { error: "Profile not found." } as const;

  return { profile } as const;
}

function revalidateSitewideBanner() {
  revalidatePath("/", "layout");
}

export async function ownerCrownDropAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const gate = await ownerGuard();
  if ("error" in gate) return { error: gate.error };

  const username = String(formData.get("username") ?? "");
  const resolved = await lookupProfile(username);
  if ("error" in resolved) return { error: resolved.error };

  const result = await adminGrantPremiumAction(resolved.profile.id, "premium_lite", null);
  if (result.error) return result;

  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    targetUserId: resolved.profile.id,
    action: "owner_crown_drop",
    details: { username: resolved.profile.username },
  });

  revalidatePath(`/${resolved.profile.username}`);
  return { success: `👑 Crown dropped on @${resolved.profile.username} — lifetime Premium Lite.` };
}

export async function ownerBadgeDropAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const gate = await ownerGuard();
  if ("error" in gate) return { error: gate.error };

  const username = String(formData.get("username") ?? "");
  const slug = String(formData.get("badge_slug") ?? "").trim().toLowerCase();
  if (!slug) return { error: "Badge slug is required." };
  if (isFounderBadgeSlug(slug)) return { error: "Founder badge cannot be injected." };

  const resolved = await lookupProfile(username);
  if ("error" in resolved) return { error: resolved.error };

  const supabase = await db();
  const { data: badge } = await supabase.from("badges").select("id, name, slug").eq("slug", slug).maybeSingle();
  if (!badge?.id) return { error: `Badge "${slug}" not found.` };

  const { data: existing } = await supabase
    .from("profile_badges")
    .select("id")
    .eq("profile_id", resolved.profile.id)
    .eq("badge_id", badge.id)
    .maybeSingle();

  if (existing) {
    return { success: `@${resolved.profile.username} already has ${badge.name}.` };
  }

  const { error } = await supabase.from("profile_badges").insert({
    profile_id: resolved.profile.id,
    badge_id: badge.id,
    award_source: "owner_drop",
  });
  if (error) return { error: error.message };

  await createNotification({
    userId: resolved.profile.id,
    type: "badge_earned",
    title: "You earned a badge",
    body: `The cried.bio owner dropped the ${badge.name} badge on your profile.`,
    actorId: gate.access.userId,
    data: { badge_slug: slug },
  });

  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    targetUserId: resolved.profile.id,
    action: "owner_badge_drop",
    details: { slug, username: resolved.profile.username },
  });

  revalidatePath(`/${resolved.profile.username}`);
  return { success: `💎 ${badge.name} injected onto @${resolved.profile.username}.` };
}

export async function ownerHypePingAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const gate = await ownerGuard();
  if ("error" in gate) return { error: gate.error };

  const username = String(formData.get("username") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { error: "Message is required." };

  const resolved = await lookupProfile(username);
  if ("error" in resolved) return { error: resolved.error };

  await createNotification({
    userId: resolved.profile.id,
    type: "milestone",
    title: "Message from cried.bio",
    body: message,
    actorId: gate.access.userId,
  });

  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    targetUserId: resolved.profile.id,
    action: "owner_hype_ping",
    details: { message },
  });

  return { success: `📡 Hype ping delivered to @${resolved.profile.username}.` };
}

export async function ownerSpotlightAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const gate = await ownerGuard();
  if ("error" in gate) return { error: gate.error };

  const username = String(formData.get("username") ?? "");
  const viewsRaw = Number(formData.get("views") ?? 2500);
  const views = Number.isFinite(viewsRaw) ? Math.min(50_000, Math.max(100, Math.round(viewsRaw))) : 2500;

  const resolved = await lookupProfile(username);
  if ("error" in resolved) return { error: resolved.error };

  const supabase = await db();
  await supabase.from("landing_featured_profiles").upsert(
    {
      profile_id: resolved.profile.id,
      sort_order: 0,
      is_active: true,
    },
    { onConflict: "profile_id" },
  );

  const currentViews = Number(resolved.profile.view_count) || 0;
  await supabase
    .from("profiles")
    .update({ view_count: currentViews + views })
    .eq("id", resolved.profile.id);

  await createNotification({
    userId: resolved.profile.id,
    type: "milestone",
    title: "You got spotlighted",
    body: `Your profile was featured on cried.bio and received a ${views.toLocaleString()} view boost.`,
    actorId: gate.access.userId,
  });

  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    targetUserId: resolved.profile.id,
    action: "owner_spotlight",
    details: { views, username: resolved.profile.username },
  });

  revalidatePath("/");
  revalidatePath(`/${resolved.profile.username}`);
  revalidatePath("/dashboard/admin/landing");
  return {
    success: `🚀 @${resolved.profile.username} is on the landing page +${views.toLocaleString()} views.`,
  };
}

export async function ownerFlexBannerAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const gate = await ownerGuard();
  if ("error" in gate) return { error: gate.error };

  const preset = String(formData.get("preset") ?? "");
  const presets: Record<string, { message: string; type: AnnouncementType }> = {
    owner_online: { message: "👑 Owner is online — platform running smooth.", type: "info" },
    hype: { message: "🔥 cried.bio is cooking — new drops soon.", type: "update" },
    maintenance: { message: "🛠 Scheduled maintenance tonight. Profiles stay live.", type: "warning" },
    party: { message: "🎉 Weekend flex mode activated. Go customize your page.", type: "update" },
    clear: { message: "", type: "info" },
  };

  const chosen = presets[preset];
  if (!chosen) return { error: "Unknown banner preset." };

  const supabase = await db();
  const { error } = await supabase
    .from("platform_settings")
    .update({
      global_banner: chosen.message,
      global_banner_type: chosen.type,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { error: error.message };

  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    action: "owner_flex_banner",
    details: { preset },
  });

  revalidatePath("/dashboard/admin/owner");
  revalidateSitewideBanner();
  return {
    success: preset === "clear" ? "Banner cleared." : `⚡ Flex banner live: ${chosen.message}`,
  };
}

export async function ownerProfileXrayAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const gate = await ownerGuard();
  if ("error" in gate) return { error: gate.error };

  const username = String(formData.get("username") ?? "");
  const resolved = await lookupProfile(username);
  if ("error" in resolved) return { error: resolved.error };

  const supabase = await db();
  const profileId = resolved.profile.id;

  const [links, badges, followers, following] = await Promise.all([
    supabase.from("links").select("id", { count: "exact", head: true }).eq("profile_id", profileId),
    supabase.from("profile_badges").select("id", { count: "exact", head: true }).eq("profile_id", profileId),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", profileId),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", profileId),
  ]);

  const name = resolved.profile.display_name || resolved.profile.username;
  return {
    success: `🔮 ${name} (@${resolved.profile.username}) · UID ${resolved.profile.uid ?? "—"} · ${Number(resolved.profile.view_count ?? 0).toLocaleString()} views · ${links.count ?? 0} links · ${badges.count ?? 0} badges · ${followers.count ?? 0} followers · ${following.count ?? 0} following · tier ${resolved.profile.premium_tier}`,
  };
}

export async function ownerCacheNukeAction(
  _prev: AdminFormState,
  _formData: FormData,
): Promise<AdminFormState> {
  const gate = await ownerGuard();
  if ("error" in gate) return { error: gate.error };

  const paths = [
    "/",
    "/dashboard",
    "/dashboard/admin",
    "/dashboard/admin/owner",
    "/explore",
  ];

  for (const path of paths) {
    revalidatePath(path);
  }
  revalidatePath("/", "layout");
  revalidateSitewideBanner();

  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    action: "owner_cache_nuke",
  });

  return { success: "🧨 Cache nuke complete — sitewide paths revalidated." };
}

export async function ownerRouletteAction(
  _prev: AdminFormState,
  _formData: FormData,
): Promise<AdminFormState> {
  const gate = await ownerGuard();
  if ("error" in gate) return { error: gate.error };

  const supabase = await db();
  const { data, error } = await supabase
    .from("profiles")
    .select("username, display_name, view_count")
    .not("username", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return { error: error.message };
  const pool = (data ?? []).filter((row) => row.username);
  if (pool.length === 0) return { error: "No profiles in the roulette pool." };

  const pick = pool[Math.floor(Math.random() * pool.length)]!;
  return {
    success: `🎲 Roulette landed on @${pick.username} (${pick.display_name || pick.username}) — ${Number(pick.view_count ?? 0).toLocaleString()} views. Visit /${pick.username}`,
  };
}

export async function ownerShockwaveAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const gate = await ownerGuard();
  if ("error" in gate) return { error: gate.error };

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title) return { error: "Title is required." };

  const supabase = await db();
  const { error } = await supabase.from("admin_notifications").insert({
    user_id: null,
    title,
    body,
    created_by: gate.access.userId,
  });
  if (error) return { error: error.message };

  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    action: "owner_shockwave",
    details: { title },
  });

  revalidatePath("/dashboard/admin/notifications");
  return { success: "📢 Shockwave broadcast queued for all users." };
}

export async function ownerSleepModeAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const gate = await ownerGuard();
  if ("error" in gate) return { error: gate.error };

  const enable = formData.get("enable") === "true";
  const supabase = await db();
  const { error } = await supabase
    .from("platform_settings")
    .update({
      maintenance_mode: enable,
      global_banner: enable
        ? "🌙 Maintenance mode — cried.bio is sleeping. Back soon."
        : "",
      global_banner_type: "maintenance",
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { error: error.message };

  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    action: enable ? "owner_sleep_on" : "owner_sleep_off",
  });

  revalidatePath("/dashboard/admin/owner");
  revalidateSitewideBanner();
  return { success: enable ? "🌙 Sleep mode ON." : "☀️ Sleep mode OFF — site awake." };
}

export async function ownerPremiumRevokeAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const gate = await ownerGuard();
  if ("error" in gate) return { error: gate.error };

  const username = String(formData.get("username") ?? "");
  const resolved = await lookupProfile(username);
  if ("error" in resolved) return { error: resolved.error };

  const supabase = await db();
  await supabase
    .from("profiles")
    .update({ premium_tier: "free", premium_expires_at: null })
    .eq("id", resolved.profile.id);

  await syncPremiumBadge(resolved.profile.id, false);

  await logUserTimelineEvent({
    userId: resolved.profile.id,
    eventType: "premium_revoked",
    title: "Premium revoked by owner",
  });

  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    targetUserId: resolved.profile.id,
    action: "owner_premium_revoke",
  });

  revalidatePath(`/${resolved.profile.username}`);
  return { success: `🪓 Premium stripped from @${resolved.profile.username}.` };
}
