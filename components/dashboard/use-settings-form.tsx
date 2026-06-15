"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { updateSettingsAction } from "@/app/actions/settings";
import { useClearUnsavedOnSuccess } from "@/components/dashboard/unsaved-changes";
import type { ProfileSettings, SettingsFormState, SettingsSection } from "@/lib/types/settings";

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

/**
 * Dashboard settings page form: local state is source of truth while editing.
 * After our own save, skip the post-refresh server sync so a second edit on the
 * same page is not wiped.
 */
export function useDashboardSettingsSection<T extends SettingsFormValues>(
  section: SettingsSection,
  settings: ProfileSettings,
  readForm: (settings: ProfileSettings) => T,
  successMessage?: string,
) {
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const skipSyncRef = useRef(false);
  const lastSyncedAt = useRef(settings.updated_at);
  const [form, setForm] = useState(() => readForm(settings));

  const { state, submit: rawSubmit, isPending } = useSettingsForm(section, successMessage);

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      lastSyncedAt.current = settings.updated_at;
      return;
    }
    if (settings.updated_at === lastSyncedAt.current) return;
    lastSyncedAt.current = settings.updated_at;
    setForm(readForm(settingsRef.current));
  }, [settings.updated_at, readForm]);

  const patchForm = useCallback((partial: Partial<T>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const submit = useCallback(
    (values: T) => {
      skipSyncRef.current = true;
      rawSubmit(values);
    },
    [rawSubmit],
  );

  return { form, setForm, patchForm, submit, state, isPending };
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
