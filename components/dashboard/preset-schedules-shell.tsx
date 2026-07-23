"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createPresetScheduleAction,
  deletePresetScheduleAction,
  togglePresetScheduleAction,
} from "@/app/actions/preset-schedules";
import { PremiumLocked } from "@/components/premium/premium-locked";
import { cardClassName, buttonPrimaryClassName, PageHeader, FormFeedback } from "@/components/dashboard/form-fields";
import type { PresetSchedule } from "@/lib/data/preset-schedules";
import type { ProfilePreset } from "@/lib/types/profile-preset";
import type { UserEntitlements } from "@/lib/premium/types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function PresetSchedulesShell({
  schedules,
  presets,
  entitlements,
}: {
  schedules: PresetSchedule[];
  presets: ProfilePreset[];
  entitlements: UserEntitlements;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>();
  const [form, setForm] = useState({
    presetId: presets[0]?.id ?? "",
    label: "",
    startTime: "09:00",
    endTime: "17:00",
    days: [1, 2, 3, 4, 5] as number[],
  });

  const allowed = entitlements.can_use_scheduled_profiles;

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createPresetScheduleAction({
        presetId: form.presetId,
        label: form.label,
        startTime: form.startTime,
        endTime: form.endTime,
        daysOfWeek: form.days,
      });
      setFeedback(result);
      if (!result.error) router.refresh();
    });
  };

  return (
    <div>
      <PageHeader
        title="Scheduled Profiles"
        description="Automatically swap presets by time — day, night, weekend, holiday, and more."
      />

      <PremiumLocked allowed={allowed} className="mb-6">
        <div className={cardClassName}>
          <h2 className="mb-4 text-sm font-medium text-white">New schedule</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-neutral-500">Label</label>
              <input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="Day mode"
                className="bf-input w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-neutral-500">Preset</label>
              <select
                value={form.presetId}
                onChange={(e) => setForm((f) => ({ ...f, presetId: e.target.value }))}
                className="bf-input w-full"
              >
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-neutral-500">Start time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="bf-input w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-neutral-500">End time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="bf-input w-full"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {DAY_LABELS.map((day, i) => (
              <button
                key={day}
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    days: f.days.includes(i)
                      ? f.days.filter((d) => d !== i)
                      : [...f.days, i].sort(),
                  }))
                }
                className={`rounded-lg px-2.5 py-1 text-xs ${
                  form.days.includes(i)
                    ? "bg-white text-black"
                    : "bg-white/[0.06] text-neutral-400"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={isPending || !form.presetId}
            onClick={handleCreate}
            className={`${buttonPrimaryClassName} mt-4`}
          >
            {isPending ? "Saving…" : "Add schedule"}
          </button>
          <FormFeedback {...feedback} />
        </div>
      </PremiumLocked>

      <div className={cardClassName}>
        <h2 className="mb-4 text-sm font-medium text-white">Active schedules</h2>
        <div className="space-y-3">
          {schedules.map((schedule) => {
            const preset = presets.find((p) => p.id === schedule.preset_id);
            return (
              <div
                key={schedule.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] p-4"
              >
                <div>
                  <p className="font-medium text-white">{schedule.label}</p>
                  <p className="text-sm text-neutral-500">
                    {preset?.name ?? "Preset"} · {schedule.start_time.slice(0, 5)} –{" "}
                    {schedule.end_time.slice(0, 5)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!allowed || isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await togglePresetScheduleAction(schedule.id, !schedule.enabled);
                        router.refresh();
                      })
                    }
                    className="rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                  >
                    {schedule.enabled ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    disabled={!allowed || isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await deletePresetScheduleAction(schedule.id);
                        router.refresh();
                      })
                    }
                    className="rounded-lg px-3 py-1.5 text-xs text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {!schedules.length ? (
            <p className="text-sm text-neutral-600">No schedules configured.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
