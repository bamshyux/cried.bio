"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type UnsavedChangesContextValue = {
  isDirty: boolean;
  isSaving: boolean;
  markDirty: () => void;
  markClean: () => void;
  setLastDirtyForm: (form: HTMLFormElement | null) => void;
  saveChanges: () => void;
};

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

function findDashboardSaveForm(lastForm: HTMLFormElement | null): HTMLFormElement | null {
  if (lastForm?.isConnected) return lastForm;

  const primary = document.querySelector<HTMLFormElement>("main form[data-dashboard-primary-form]");
  if (primary) return primary;

  const forms = document.querySelectorAll<HTMLFormElement>("main form");
  if (forms.length === 1) return forms[0] ?? null;

  return (
    Array.from(forms).find((form) => form.querySelector('button[type="submit"]')) ?? forms[0] ?? null
  );
}

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const lastDirtyFormRef = useRef<HTMLFormElement | null>(null);
  const savingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  const markClean = useCallback(() => {
    setIsDirty(false);
    setIsSaving(false);
    if (savingTimeoutRef.current) {
      clearTimeout(savingTimeoutRef.current);
      savingTimeoutRef.current = null;
    }
  }, []);

  const setLastDirtyForm = useCallback((form: HTMLFormElement | null) => {
    lastDirtyFormRef.current = form;
  }, []);

  const saveChanges = useCallback(() => {
    const form = findDashboardSaveForm(lastDirtyFormRef.current);
    if (!form) return;

    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]:not(:disabled)');
    if (!submit) {
      form.querySelector("button[type=\"submit\"]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSaving(true);
    form.requestSubmit();

    if (savingTimeoutRef.current) clearTimeout(savingTimeoutRef.current);
    savingTimeoutRef.current = setTimeout(() => {
      setIsSaving(false);
      savingTimeoutRef.current = null;
    }, 30000);
  }, []);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(
    () => () => {
      if (savingTimeoutRef.current) clearTimeout(savingTimeoutRef.current);
    },
    [],
  );

  const value = useMemo(
    () => ({ isDirty, isSaving, markDirty, markClean, setLastDirtyForm, saveChanges }),
    [isDirty, isSaving, markDirty, markClean, setLastDirtyForm, saveChanges],
  );

  return (
    <UnsavedChangesContext.Provider value={value}>{children}</UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error("useUnsavedChanges must be used within UnsavedChangesProvider");
  }
  return context;
}

/** Optional hook for components outside the provider (no-op fallback). */
export function useUnsavedChangesOptional() {
  return useContext(UnsavedChangesContext);
}

export function UnsavedChangesNotice() {
  const context = useUnsavedChangesOptional();
  if (!context?.isDirty) return null;

  const { isSaving, saveChanges } = context;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bf-unsaved-notice pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4"
    >
      <div className="pointer-events-auto flex w-full max-w-lg items-center gap-3 rounded-xl border border-amber-500/25 bg-[#141414]/95 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs text-amber-300">
          !
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-100">You have unsaved changes</p>
          <p className="mt-0.5 hidden text-xs leading-relaxed text-neutral-400 sm:block">
            Save before leaving this page, or your updates will be lost.
          </p>
        </div>
        <button
          type="button"
          onClick={saveChanges}
          disabled={isSaving}
          className="shrink-0 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-semibold text-[#090909] transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

export function DashboardFormTracker({ children }: { children: ReactNode }) {
  const context = useUnsavedChangesOptional();

  const handleMarkDirty = useCallback(
    (event: React.FormEvent<HTMLDivElement>) => {
      if (!context) return;

      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const form = target.closest("form");
      if (!form) return;

      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        context.setLastDirtyForm(form);
        context.markDirty();
      }
    },
    [context],
  );

  return (
    <div onInput={handleMarkDirty} onChange={handleMarkDirty}>
      {children}
    </div>
  );
}

/** Clear the unsaved banner after a successful form save. */
export function useClearUnsavedOnSuccess(state: { success?: string | boolean | null }) {
  const context = useUnsavedChangesOptional();

  useEffect(() => {
    if (state.success) {
      context?.markClean();
    }
  }, [state.success, context]);
}
