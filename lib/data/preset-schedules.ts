import { createClient } from "@/lib/supabase/server";

export type PresetSchedule = {
  id: string;
  profile_id: string;
  page_id: string | null;
  preset_id: string;
  label: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  timezone: string;
  enabled: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
};

export async function getPresetSchedules(profileId: string): Promise<PresetSchedule[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_preset_schedules")
    .select("*")
    .eq("profile_id", profileId)
    .order("priority", { ascending: false });

  return (data as PresetSchedule[]) ?? [];
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function isScheduleActiveNow(
  schedule: PresetSchedule,
  now = new Date(),
): boolean {
  if (!schedule.enabled) return false;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: schedule.timezone || "UTC",
    hour: "numeric",
    minute: "numeric",
    weekday: "short",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const weekdayShort = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const day = weekdayMap[weekdayShort] ?? 0;

  if (!schedule.days_of_week.includes(day)) return false;

  const currentMinutes = hour * 60 + minute;
  const start = parseTimeToMinutes(schedule.start_time);
  const end = parseTimeToMinutes(schedule.end_time);

  if (start <= end) {
    return currentMinutes >= start && currentMinutes < end;
  }
  return currentMinutes >= start || currentMinutes < end;
}

export async function getActiveSchedule(profileId: string): Promise<PresetSchedule | null> {
  const schedules = await getPresetSchedules(profileId);
  return schedules.find((s) => isScheduleActiveNow(s)) ?? null;
}
