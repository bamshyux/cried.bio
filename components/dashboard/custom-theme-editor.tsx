"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  applyCustomThemeAction,
  createCustomThemeAction,
  deleteCustomThemeAction,
  duplicateCustomThemeAction,
  saveCustomThemeAction,
} from "@/app/actions/custom-themes";
import { PublishThemeModal } from "@/components/dashboard/community-themes/publish-theme-modal";
import {
  buttonPrimaryClassName,
  cardClassName,
  FormFeedback,
  inputClassName,
  labelClassName,
  PageHeader,
} from "@/components/dashboard/form-fields";
import {
  CustomThemePreview,
  CustomThemeSelectorHelp,
  DEFAULT_CUSTOM_THEME_CSS,
} from "@/components/dashboard/custom-theme-preview";
import type { CustomTheme } from "@/lib/types/custom-theme";
import type { CommunityThemeListing } from "@/lib/types/community-theme";
import type { ProfileSettings } from "@/lib/types/settings";

export function CustomThemeEditor({
  themes: initialThemes,
  settings,
  publishedByThemeId = {},
}: {
  themes: CustomTheme[];
  settings: ProfileSettings;
  publishedByThemeId?: Record<string, CommunityThemeListing>;
}) {
  const router = useRouter();
  const [themes, setThemes] = useState(initialThemes);
  const [activeId, setActiveId] = useState<string | null>(
    settings.custom_theme_id ?? initialThemes[0]?.id ?? null,
  );
  const [name, setName] = useState("");
  const [css, setCss] = useState(DEFAULT_CUSTOM_THEME_CSS);
  const [savedCss, setSavedCss] = useState(DEFAULT_CUSTOM_THEME_CSS);
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>({});
  const [importOpen, setImportOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTheme = themes.find((t) => t.id === activeId) ?? null;
  const dirty = css !== savedCss || (activeTheme && name !== activeTheme.name);

  useEffect(() => {
    setThemes(initialThemes);
  }, [initialThemes]);

  useEffect(() => {
    if (activeTheme) {
      setName(activeTheme.name);
      setCss(activeTheme.css);
      setSavedCss(activeTheme.css);
    }
  }, [activeTheme?.id, activeTheme?.updated_at]);

  const selectTheme = (theme: CustomTheme) => {
    setActiveId(theme.id);
    setName(theme.name);
    setCss(theme.css);
    setSavedCss(theme.css);
    setFeedback({});
  };

  const handleSave = () => {
    if (!activeId) {
      startTransition(async () => {
        const result = await createCustomThemeAction(name || "My Theme", css);
        setFeedback(result.error ? { error: result.error } : { success: result.success });
        if (result.themeId) {
          setActiveId(result.themeId);
          setSavedCss(css);
          router.refresh();
        }
      });
      return;
    }

    startTransition(async () => {
      const result = await saveCustomThemeAction(activeId, name, css);
      setFeedback(result.error ? { error: result.error } : { success: result.success });
      if (!result.error) {
        setSavedCss(css);
        router.refresh();
      }
    });
  };

  const handleDuplicate = () => {
    if (!activeId) return;
    startTransition(async () => {
      const result = await duplicateCustomThemeAction(activeId);
      setFeedback(result.error ? { error: result.error } : { success: result.success });
      if (result.themeId) {
        setActiveId(result.themeId);
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    if (!activeId || !confirm("Delete this theme? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteCustomThemeAction(activeId);
      setFeedback(result.error ? { error: result.error } : { success: result.success });
      if (!result.error) {
        const remaining = themes.filter((t) => t.id !== activeId);
        setThemes(remaining);
        const next = remaining[0];
        if (next) selectTheme(next);
        else {
          setActiveId(null);
          setName("My Theme");
          setCss(DEFAULT_CUSTOM_THEME_CSS);
          setSavedCss(DEFAULT_CUSTOM_THEME_CSS);
        }
        router.refresh();
      }
    });
  };

  const handleApply = () => {
    if (!activeId) {
      handleSave();
      return;
    }
    startTransition(async () => {
      if (dirty) {
        const saveResult = await saveCustomThemeAction(activeId, name, css);
        if (saveResult.error) {
          setFeedback({ error: saveResult.error });
          return;
        }
        setSavedCss(css);
      }
      const result = await applyCustomThemeAction(activeId);
      setFeedback(result.error ? { error: result.error } : { success: result.success ?? "Applied to profile." });
      router.refresh();
    });
  };

  const handleReset = () => {
    setCss(DEFAULT_CUSTOM_THEME_CSS);
    setFeedback({ success: "Reset to default template. Save to keep changes." });
  };

  const handleExport = useCallback(() => {
    const blob = new Blob([css], { type: "text/css;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(name || "my-theme").replace(/\s+/g, "-").toLowerCase()}.css`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback({ success: "Theme exported." });
  }, [css, name]);

  const handleCopyExport = async () => {
    try {
      await navigator.clipboard.writeText(css);
      setFeedback({ success: "CSS copied to clipboard." });
    } catch {
      setFeedback({ error: "Could not copy to clipboard." });
    }
  };

  const handleImportConfirm = () => {
    const trimmed = importText.trim();
    if (!trimmed) return;
    setCss(trimmed);
    setImportOpen(false);
    setImportText("");
    setFeedback({ success: "CSS imported. Save to keep changes." });
  };

  const handleFileImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "").trim();
      if (text) {
        setCss(text);
        setFeedback({ success: "CSS file imported. Save to keep changes." });
      }
    };
    reader.readAsText(file);
  };

  const handleNewTheme = () => {
    startTransition(async () => {
      const result = await createCustomThemeAction("New Theme", DEFAULT_CUSTOM_THEME_CSS);
      setFeedback(result.error ? { error: result.error } : { success: result.success });
      if (result.themeId) {
        setActiveId(result.themeId);
        router.refresh();
      }
    });
  };

  const isActiveOnProfile =
    settings.layout === "custom" && settings.custom_theme_id === activeId;

  return (
    <>
      <PageHeader
        title="Custom Theme Builder"
        description="Write CSS for your profile card. Styles are scoped to your profile only — they never affect the rest of the site."
      />
      <FormFeedback error={feedback.error} success={feedback.success} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href="/dashboard/themes"
          className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:text-white"
        >
          ← Back to layouts
        </Link>
        <Link
          href="/dashboard/explore/themes"
          className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:text-white"
        >
          Community Themes
        </Link>
        {isActiveOnProfile && (
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
            Active on profile
          </span>
        )}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className={`${cardClassName} space-y-3`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-400">Saved themes</p>
            <button
              type="button"
              onClick={handleNewTheme}
              disabled={isPending}
              className="text-[10px] font-semibold uppercase tracking-wide text-[var(--bf-accent)] hover:underline disabled:opacity-50"
            >
              + New
            </button>
          </div>
          <div className="space-y-1">
            {themes.length === 0 ? (
              <p className="text-xs text-neutral-600">No themes yet.</p>
            ) : (
              themes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => selectTheme(theme)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                    theme.id === activeId
                      ? "bg-white/10 text-white"
                      : "text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200"
                  }`}
                >
                  {theme.name}
                  {settings.custom_theme_id === theme.id && settings.layout === "custom" && (
                    <span className="ml-1 text-emerald-400">•</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className={`${cardClassName} grid gap-4 xl:grid-cols-2`}>
            <div className="space-y-3">
              <div>
                <label htmlFor="theme_name" className={labelClassName}>Theme name</label>
                <input
                  id="theme_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClassName}
                  placeholder="My Theme"
                />
              </div>
              <div>
                <label htmlFor="theme_css" className={labelClassName}>CSS editor</label>
                <textarea
                  id="theme_css"
                  value={css}
                  onChange={(e) => setCss(e.target.value)}
                  spellCheck={false}
                  className={`${inputClassName} min-h-[280px] font-mono text-xs leading-relaxed`}
                  placeholder={DEFAULT_CUSTOM_THEME_CSS}
                />
              </div>
              <CustomThemeSelectorHelp />
            </div>
            <CustomThemePreview css={css} />
          </div>

          <div className={`${cardClassName} flex flex-wrap gap-2`}>
            <button type="button" onClick={handleSave} disabled={isPending || !dirty} className={buttonPrimaryClassName}>
              {isPending ? "Saving..." : "Save theme"}
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isPending}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
            >
              Apply to profile
            </button>
            <button
              type="button"
              onClick={() => {
                if (dirty) {
                  setFeedback({ error: "Save your theme before publishing." });
                  return;
                }
                setPublishOpen(true);
              }}
              disabled={isPending || !activeId}
              className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition-colors hover:bg-violet-500/20 disabled:opacity-50"
            >
              {activeId && publishedByThemeId[activeId] ? "Update publish" : "Publish Theme"}
            </button>
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={isPending || !activeId}
              className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
            >
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:border-white/20 hover:text-white"
            >
              Import
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:border-white/20 hover:text-white"
            >
              Export
            </button>
            <button
              type="button"
              onClick={handleCopyExport}
              className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:border-white/20 hover:text-white"
            >
              Copy CSS
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-neutral-400 transition-colors hover:border-red-500/30 hover:text-red-300"
            >
              Reset
            </button>
            {activeId && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-lg border border-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
              >
                Delete
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".css,text/css"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileImport(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:border-white/20 hover:text-white"
            >
              Import file
            </button>
          </div>
        </div>
      </div>

      {publishOpen && activeTheme ? (
        <PublishThemeModal
          theme={activeTheme}
          existingListing={publishedByThemeId[activeTheme.id] ?? null}
          onClose={() => setPublishOpen(false)}
          onPublished={() => router.refresh()}
        />
      ) : null}

      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className={`${cardClassName} w-full max-w-lg`}>
            <h3 className="mb-2 text-sm font-medium text-white">Import theme CSS</h3>
            <p className="mb-3 text-xs text-neutral-500">Paste exported CSS. It will be scoped to your profile on save.</p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className={`${inputClassName} mb-4 min-h-[160px] font-mono text-xs`}
              placeholder=".profile-card { ... }"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm text-neutral-400"
              >
                Cancel
              </button>
              <button type="button" onClick={handleImportConfirm} className={buttonPrimaryClassName}>
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
