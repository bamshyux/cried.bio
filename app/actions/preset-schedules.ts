"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireEntitlement } from "@/lib/premium/entitlements";
import { applyProfilePresetSnapshot } from "@/lib/profile-presets/snapshot";
import { getActiveSchedule } from "@/lib/data/preset-schedules";

type ActionResult = { error?: string; success?: string; scheduleId?: string };

async function getUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

export async function createPresetScheduleAction(input: {
  presetId: string;
  label: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  timezone?: string;
}): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { error: "You must be logged in." };

  const gate = await requireEntitlement(userId, "can_use_scheduled_profiles");
  if (!gate.ok) return { error: gate.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_preset_schedules")
    .insert({
      profile_id: userId,
      preset_id: input.presetId,
      label: input.label.trim() || "Schedule",
      start_time: input.startTime,
      end_time: input.endTime,
      days_of_week: input.daysOfWeek,
      timezone: input.timezone?.trim() || "UTC",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/preset-schedules");
  return { success: "Schedule created.", scheduleId: data.id };
}

export async function deletePresetScheduleAction(scheduleId: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_preset_schedules")
    .delete()
    .eq("id", scheduleId)
    .eq("profile_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/preset-schedules");
  return { success: "Schedule deleted." };
}

export async function togglePresetScheduleAction(
  scheduleId: string,
  enabled: boolean,
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { error: "You must be logged in." };

  const gate = await requireEntitlement(userId, "can_use_scheduled_profiles");
  if (!gate.ok) return { error: gate.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_preset_schedules")
    .update({ enabled })
    .eq("id", scheduleId)
    .eq("profile_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/preset-schedules");
  return { success: enabled ? "Schedule enabled." : "Schedule disabled." };
}

/** Apply active schedule preset if one matches current time */
export async function syncActivePresetScheduleAction(): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const gate = await requireEntitlement(userId, "can_use_scheduled_profiles");
  if (!gate.ok) return;

  const active = await getActiveSchedule(userId);
  if (!active) return;

  const supabase = await createClient();
  const { data: preset } = await supabase
    .from("profile_presets")
    .select("preset_data")
    .eq("id", active.preset_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!preset?.preset_data) return;

  const { data: settings } = await supabase
    .from("profile_settings")
    .select("last_applied_schedule_id")
    .eq("profile_id", userId)
    .is("page_id", null)
    .maybeSingle();

  if (settings?.last_applied_schedule_id === active.id) return;

  await applyProfilePresetSnapshot(userId, preset.preset_data);
  await supabase
    .from("profile_settings")
    .update({ last_applied_schedule_id: active.id })
    .eq("profile_id", userId)
    .is("page_id", null);
}
