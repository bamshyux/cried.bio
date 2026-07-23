"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateSettingsAction } from "@/app/actions/settings";
import { updateSocialSettingsAction } from "@/app/actions/social";
import { useUnsavedChangesOptional, DASHBOARD_RESET_EVENT } from "@/components/dashboard/unsaved-changes";
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

function formatDisplayState(state: SettingsFormState, successMessage?: string): SettingsFormState {
  return {
    ...state,
    success:
      state.success === "Settings saved." && successMessage ? successMessage : state.success,
  };
}

function useManagedSettingsAction(
  action: (prev: SettingsFormState, formData: FormData) => Promise<SettingsFormState>,
  successMessage?: string,
) {
  const router = useRouter();
  const unsaved = useUnsavedChangesOptional();
  const [state, setState] = useState<SettingsFormState>(initial);
  const [isPending, setIsPending] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const finishSave = useCallback(
    (result: SettingsFormState) => {
      setState(result);
      if (result.success) {
        unsaved?.markClean();
        router.refresh();
      } else {
        unsaved?.clearSaving();
      }
    },
    [router, unsaved],
  );

  const runAction = useCallback(
    (buildFormData: () => FormData) => {
      unsaved?.markSaving();
      setIsPending(true);
      void (async () => {
        try {
          const result = await action(stateRef.current, buildFormData());
          finishSave(result);
        } catch {
          unsaved?.clearSaving();
        } finally {
          setIsPending(false);
        }
      })();
    },
    [action, finishSave, unsaved],
  );

  const displayState = useMemo(
    () => formatDisplayState(state, successMessage),
    [state, successMessage],
  );

  return { state: displayState, isPending, runAction };
}

export function useSettingsForm(
  section: SettingsSection,
  successMessage?: string,
  pageId?: string,
) {
  const action = useCallback(
    async (prev: SettingsFormState, formData: FormData) => {
      if (pageId) formData.set("_page_id", pageId);
      return updateSettingsAction(prev, formData);
    },
    [pageId],
  );

  const { state, isPending, runAction } = useManagedSettingsAction(action, successMessage);

  const submit = useCallback(
    (values: SettingsFormValues) => {
      runAction(() => {
        const fd = new FormData();
        fd.set("_section", section);
        appendToFormData(fd, values);
        return fd;
      });
    },
    [runAction, section],
  );

  return { state, submit, isPending };
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
  settingsFormId?: string,
  pageId?: string,
) {
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const skipSyncRef = useRef(false);
  const lastSyncedAt = useRef(settings.updated_at);
  const [form, setForm] = useState(() => readForm(settings));

  const { state, submit: rawSubmit, isPending } = useSettingsForm(section, successMessage, pageId);
  const unsaved = useUnsavedChangesOptional();

  useEffect(() => {
    const handleReset = () => {
      setForm(readForm(settingsRef.current));
    };
    window.addEventListener(DASHBOARD_RESET_EVENT, handleReset);
    return () => window.removeEventListener(DASHBOARD_RESET_EVENT, handleReset);
  }, [readForm]);

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

  const patchForm = useCallback(
    (partial: Partial<T>) => {
      setForm((prev) => ({ ...prev, ...partial }));
      unsaved?.markDirty();
      const selector = settingsFormId
        ? `main form[data-dashboard-settings-form="${settingsFormId}"]`
        : `main form[data-dashboard-section-form="${section}"]`;
      const sectionForm = document.querySelector<HTMLFormElement>(selector);
      if (sectionForm) unsaved?.setLastDirtyForm(sectionForm);
    },
    [section, settingsFormId, unsaved],
  );

  const submit = useCallback(
    (values: T) => {
      skipSyncRef.current = true;
      rawSubmit(values);
    },
    [rawSubmit],
  );

  return { form, setForm, patchForm, submit, state, isPending };
}

type SocialFormValues = {
  friends_visibility: string;
  show_follow_counts: boolean;
  show_activity: boolean;
};

function useFormActionSection<T extends SettingsFormValues>(
  action: (prev: SettingsFormState, formData: FormData) => Promise<SettingsFormState>,
  successMessage?: string,
) {
  const { state, isPending, runAction } = useManagedSettingsAction(action, successMessage);

  const submit = useCallback(
    (values: T) => {
      runAction(() => {
        const fd = new FormData();
        appendToFormData(fd, values);
        return fd;
      });
    },
    [runAction],
  );

  return { state, submit, isPending };
}

export function useSocialDashboardSection(
  settings: ProfileSettings,
  readForm: (settings: ProfileSettings) => SocialFormValues,
  successMessage = "Social settings saved.",
) {
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const skipSyncRef = useRef(false);
  const lastSyncedAt = useRef(settings.updated_at);
  const [form, setForm] = useState(() => readForm(settings));

  const { state, submit: rawSubmit, isPending } = useFormActionSection<SocialFormValues>(
    updateSocialSettingsAction,
    successMessage,
  );
  const unsaved = useUnsavedChangesOptional();

  useEffect(() => {
    const handleReset = () => {
      setForm(readForm(settingsRef.current));
    };
    window.addEventListener(DASHBOARD_RESET_EVENT, handleReset);
    return () => window.removeEventListener(DASHBOARD_RESET_EVENT, handleReset);
  }, [readForm]);

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

  const patchForm = useCallback(
    (partial: Partial<SocialFormValues>) => {
      setForm((prev) => ({ ...prev, ...partial }));
      unsaved?.markDirty();
    },
    [unsaved],
  );

  const submit = useCallback(
    (values: SocialFormValues) => {
      skipSyncRef.current = true;
      rawSubmit(values);
    },
    [rawSubmit],
  );

  return { form, patchForm, submit, state, isPending };
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
