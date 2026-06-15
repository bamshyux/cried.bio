"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addBannedWordAction,
  removeBannedWordAction,
  toggleModerationCategoryAction,
} from "@/app/actions/moderation";
import {
  buttonPrimaryClassName,
  cardClassName,
  FormFeedback,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-fields";
import type { ModerationCategorySlug } from "@/lib/moderation/constants";
import type {
  ModerationAuditEntry,
  ModerationCategory,
  ModerationLog,
  ModerationWord,
} from "@/lib/types/moderation";

type Tab = "words" | "categories" | "logs" | "audit";

export function ModerationPanel({
  categories,
  words,
  logs,
  audit,
}: {
  categories: ModerationCategory[];
  words: ModerationWord[];
  logs: ModerationLog[];
  audit: ModerationAuditEntry[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("words");
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>({});
  const [newWord, setNewWord] = useState("");
  const [newWordCategory, setNewWordCategory] = useState<ModerationCategorySlug>("profanity");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  const filteredWords =
    filterCategory === "all"
      ? words
      : words.filter((word) => word.category_slug === filterCategory);

  const run = (action: () => Promise<{ error?: string; success?: string }>) => {
    startTransition(async () => {
      setFeedback({});
      const result = await action();
      setFeedback(result);
      router.refresh();
    });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "words", label: "Banned words" },
    { id: "categories", label: "Categories" },
    { id: "logs", label: "Moderation logs" },
    { id: "audit", label: "Audit history" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              tab === item.id
                ? "border-[var(--bf-accent)]/40 bg-[var(--bf-accent)]/10 text-white"
                : "border-white/[0.08] bg-[#0f0f0f] text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <FormFeedback error={feedback.error} success={feedback.success} />

      {tab === "words" && (
        <div className="space-y-6">
          <div className={cardClassName}>
            <h2 className="mb-4 text-sm font-medium text-white">Add banned word</h2>
            <div className="grid gap-4 sm:grid-cols-[1fr_180px_auto]">
              <div>
                <label htmlFor="new_word" className={labelClassName}>
                  Word or phrase
                </label>
                <input
                  id="new_word"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="word or phrase"
                  className={inputClassName}
                />
              </div>
              <div>
                <label htmlFor="new_word_category" className={labelClassName}>
                  Category
                </label>
                <select
                  id="new_word_category"
                  value={newWordCategory}
                  onChange={(e) => setNewWordCategory(e.target.value as ModerationCategorySlug)}
                  className={inputClassName}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  disabled={isPending || !newWord.trim()}
                  onClick={() =>
                    run(async () => {
                      const result = await addBannedWordAction(newWordCategory, newWord);
                      if (!result.error) setNewWord("");
                      return result;
                    })
                  }
                  className={buttonPrimaryClassName}
                >
                  Add word
                </button>
              </div>
            </div>
          </div>

          <div className={cardClassName}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-white">
                Banned words ({filteredWords.length})
              </h2>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-lg border border-white/[0.08] bg-[#0f0f0f] px-3 py-2 text-sm text-neutral-300"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="max-h-[420px] overflow-y-auto rounded-lg border border-white/[0.06]">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-[#141414] text-xs uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Word</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWords.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-neutral-500">
                        No banned words in this category.
                      </td>
                    </tr>
                  ) : (
                    filteredWords.map((word) => (
                      <tr key={word.id} className="border-t border-white/[0.04]">
                        <td className="px-4 py-3 font-mono text-neutral-200">{word.word}</td>
                        <td className="px-4 py-3 text-neutral-400">{word.category_slug}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => run(() => removeBannedWordAction(word.id))}
                            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "categories" && (
        <div className={cardClassName}>
          <h2 className="mb-4 text-sm font-medium text-white">Filter categories</h2>
          <div className="space-y-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-white/[0.06] bg-[#0f0f0f] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{category.name}</p>
                  <p className="text-xs text-neutral-500">{category.slug}</p>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    run(() => toggleModerationCategoryAction(category.slug, !category.enabled))
                  }
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    category.enabled
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-white/5 text-neutral-400"
                  }`}
                >
                  {category.enabled ? "Enabled" : "Disabled"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "logs" && (
        <div className={cardClassName}>
          <h2 className="mb-4 text-sm font-medium text-white">Blocked content logs</h2>
          <div className="max-h-[520px] overflow-y-auto rounded-lg border border-white/[0.06]">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#141414] text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">User</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                      No blocked content yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-t border-white/[0.04]">
                      <td className="px-4 py-3 text-neutral-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-neutral-200">{log.content_type}</td>
                      <td className="px-4 py-3 text-neutral-400">{log.category_slug ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                        {log.user_id ? `${log.user_id.slice(0, 8)}…` : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "audit" && (
        <div className={cardClassName}>
          <h2 className="mb-4 text-sm font-medium text-white">Admin audit history</h2>
          <div className="max-h-[520px] overflow-y-auto rounded-lg border border-white/[0.06]">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#141414] text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Admin</th>
                </tr>
              </thead>
              <tbody>
                {audit.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                      No audit entries yet.
                    </td>
                  </tr>
                ) : (
                  audit.map((entry) => (
                    <tr key={entry.id} className="border-t border-white/[0.04]">
                      <td className="px-4 py-3 text-neutral-400">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-neutral-200">{entry.action}</td>
                      <td className="px-4 py-3 text-neutral-400">{entry.target_type}</td>
                      <td className="px-4 py-3 text-neutral-500">{entry.admin_email ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
