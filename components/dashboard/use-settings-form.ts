"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { updateSettingsAction } from "@/app/actions/settings";
import { useClearUnsavedOnSuccess } from "@/components/dashboard/unsaved-changes";
import type { SettingsFormState, SettingsSection } from "@/lib/types/settings";

const initial: SettingsFormState = {};

export type SettingsFormValues = Record<string, string | boolean | number | null | undefined>;

function appendToFormData(fd: FormData, values: SettingsFormValues) {
  for (const [key, raw] of Object.entries(values)) {
    if (raw === undefined || raw === null) {
      fd.set(key, "");
      continue;
    }
    if (typeof raw === "boolean") {
      fd.set(key, raw ? "true" : "false");
    } else {
      fd.set(key, String(raw));
    }
  }
}

/** Sync local form fields from server only when updated_at actually changes. */
export function useSyncedSettingsState<T>(
  settingsUpdatedAt: string,
  snapshot: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(snapshot);
  const lastSyncedAt = useRef(settingsUpdatedAt);

  useEffect(() => {
    if (settingsUpdatedAt === lastSyncedAt.current) return;
    lastSyncedAt.current = settingsUpdatedAt;
    setState(snapshot);
  }, [settingsUpdatedAt, snapshot]);

  return [state, setState];
}

export function useSettingsForm(section: SettingsSection, successMessage?: string) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateSettingsAction, initial);
  useClearUnsavedOnSuccess(state);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  const submit = useCallback(
    (values: SettingsFormValues) => {
      const fd = new FormData();
      fd.set("_section", section);
      appendToFormData(fd, values);
      formAction(fd);
    },
    [formAction, section],
  );

  const displaySuccess =
    state.success === "Settings saved." && successMessage ? successMessage : state.success;

  return { state: { ...state, success: displaySuccess }, submit, isPending };
}

export function SaveConfirmation({
  success,
  error,
}: {
  success?: string;
  error?: string;
}) {
  if (!success && !error) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-lg border px-4 py-3 text-sm ${
        error
          ? "border-red-500/30 bg-red-500/10 text-red-300"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      }`}
    >
      {error ?? success}
    </div>
  );
}
