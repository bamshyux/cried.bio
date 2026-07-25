"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { restoreArchivedTranscriptAction } from "@/app/actions/support";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { formatSupportTimestamp, supportDisplayName } from "@/lib/support/format";
import { transcriptToMarkdown } from "@/lib/support/transcript";
import type { SupportArchivedTranscript } from "@/lib/types/support";

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminSupportArchivesClient({
  initialTranscripts,
}: {
  initialTranscripts: SupportArchivedTranscript[];
}) {
  const [transcripts, setTranscripts] = useState(initialTranscripts);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SupportArchivedTranscript | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = transcripts.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.subject.toLowerCase().includes(q) ||
      supportDisplayName(t.customer).toLowerCase().includes(q) ||
      (t.category ?? "").toLowerCase().includes(q)
    );
  });

  function restore(id: string) {
    startTransition(async () => {
      setFeedback(null);
      const result = await restoreArchivedTranscriptAction(id);
      setFeedback(result.error ?? result.success ?? null);
      if (result.conversationId) {
        window.location.href = `/dashboard/admin/support`;
      }
    });
  }

  return (
    <>
      <AdminPageHeader
        title="Archived Transcripts"
        description="Deleted tickets are kept for 72 hours. Search, read, download, or restore."
      />

      <div className="mb-4">
        <Link
          href="/dashboard/admin/support"
          className="text-sm text-violet-300 hover:text-violet-200"
        >
          ← Back to Support Inbox
        </Link>
      </div>

      {feedback ? <p className="mb-4 text-sm text-neutral-400">{feedback}</p> : null}

      <div className="bf-card overflow-hidden p-0">
        <div className="border-b border-white/[0.06] p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject, customer, or category…"
            className="w-full max-w-md rounded-lg border border-white/[0.08] bg-[#0f0f0f] px-3 py-2 text-sm text-neutral-300"
          />
        </div>

        <div className="grid min-h-[560px] lg:grid-cols-[1fr_1.2fr]">
          <div className="border-b border-white/[0.06] lg:border-b-0 lg:border-r">
            {filtered.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-neutral-500">No archived transcripts.</p>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item)}
                  className={`block w-full border-t border-white/[0.04] px-4 py-3 text-left transition-colors hover:bg-white/[0.03] ${
                    selected?.id === item.id ? "bg-violet-500/[0.08]" : ""
                  }`}
                >
                  <p className="truncate text-sm font-medium text-white">{item.subject}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {supportDisplayName(item.customer)}
                    {item.ai_escalated ? " · AI Escalated" : ""}
                  </p>
                  <p className="mt-1 text-[11px] text-neutral-600">
                    Closed {item.closed_at ? formatSupportTimestamp(item.closed_at) : "—"} ·
                    Deletes {formatSupportTimestamp(item.purge_at)}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="flex min-h-[560px] flex-col p-4">
            {selected ? (
              <>
                <div className="mb-4 space-y-1 text-sm">
                  <p className="font-medium text-white">{selected.subject}</p>
                  <p className="text-neutral-400">
                    Customer: {supportDisplayName(selected.customer)}
                  </p>
                  <p className="text-neutral-400">
                    Staff: {selected.staff ? supportDisplayName(selected.staff) : "Unassigned"}
                  </p>
                  <p className="text-neutral-500 text-xs">
                    Opened {formatSupportTimestamp(selected.opened_at)} · Closed{" "}
                    {selected.closed_at ? formatSupportTimestamp(selected.closed_at) : "—"} ·
                    Permanently deletes {formatSupportTimestamp(selected.purge_at)}
                  </p>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(
                        JSON.stringify(selected.transcript, null, 2),
                        `${selected.subject.slice(0, 40).replace(/\s+/g, "-")}.json`,
                        "application/json",
                      )
                    }
                    className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-neutral-300"
                  >
                    Download JSON
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(
                        transcriptToMarkdown(selected.transcript, {
                          customer: selected.customer,
                          staff: selected.staff,
                          openedAt: selected.opened_at,
                          closedAt: selected.closed_at,
                          archivedAt: selected.archived_at,
                          purgeAt: selected.purge_at,
                        }),
                        `${selected.subject.slice(0, 40).replace(/\s+/g, "-")}.md`,
                        "text/markdown",
                      )
                    }
                    className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-neutral-300"
                  >
                    Download Markdown
                  </button>
                  {!selected.restored_conversation_id ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => restore(selected.id)}
                      className="rounded-lg bg-violet-600/80 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Restore ticket
                    </button>
                  ) : (
                    <span className="text-xs text-neutral-500">Already restored</span>
                  )}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-white/[0.06] bg-black/20 p-3 text-xs leading-relaxed text-neutral-300">
                  {selected.transcript.ai_messages?.length ? (
                    <>
                      <p className="mb-2 font-semibold text-violet-300">AI Conversation</p>
                      {selected.transcript.ai_messages.map((msg) => (
                        <p key={msg.id} className="mb-2">
                          <strong>{msg.role === "user" ? "Customer" : "cried AI"}:</strong> {msg.body}
                        </p>
                      ))}
                      <hr className="my-3 border-white/[0.06]" />
                    </>
                  ) : null}
                  {selected.transcript.messages.map((msg) => (
                    <p key={msg.id} className="mb-2">
                      <strong>{msg.is_staff ? "Staff" : "Customer"} ({msg.author_name}):</strong>{" "}
                      {msg.body}
                    </p>
                  ))}
                  {selected.transcript.internal_notes.length ? (
                    <>
                      <hr className="my-3 border-white/[0.06]" />
                      <p className="mb-2 font-semibold text-amber-300">Staff Notes</p>
                      {selected.transcript.internal_notes.map((note) => (
                        <p key={note.id} className="mb-2 text-amber-100/80">
                          <strong>{note.author_name}:</strong> {note.body}
                        </p>
                      ))}
                    </>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
                Select a transcript to read.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
