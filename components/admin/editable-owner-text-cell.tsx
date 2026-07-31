"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminUpdateDisplayNameAction,
  adminUpdateUsernameAction,
} from "@/app/actions/admin";

type OwnerTextField = "username" | "display_name";

export function EditableOwnerTextCell({
  userId,
  value,
  field,
  editable,
  className = "",
  emptyLabel = "—",
  title,
}: {
  userId: string;
  value: string | null;
  field: OwnerTextField;
  editable: boolean;
  className?: string;
  emptyLabel?: string;
  title?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const cancel = () => {
    setEditing(false);
    setError(null);
    setDraft(value ?? "");
  };

  const save = () => {
    const trimmed = draft.trim();
    const current = (value ?? "").trim();

    if (field === "username" && !trimmed) {
      setError("Username required");
      return;
    }

    if (trimmed === current) {
      cancel();
      return;
    }

    startTransition(async () => {
      const result =
        field === "username"
          ? await adminUpdateUsernameAction(userId, trimmed)
          : await adminUpdateDisplayNameAction(userId, trimmed);

      if (result.error) {
        setError(result.error);
        return;
      }

      setError(null);
      setEditing(false);
      router.refresh();
    });
  };

  const displayValue = value?.trim() ? value : emptyLabel;
  const editTitle =
    title ?? (field === "username" ? "Double-click to edit username" : "Double-click to edit display name");

  if (!editable) {
    return <span className={className}>{displayValue}</span>;
  }

  if (editing) {
    return (
      <div className="min-w-[8rem]" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          disabled={isPending}
          onChange={(e) => {
            setError(null);
            setDraft(field === "username" ? e.target.value.toLowerCase() : e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          onBlur={save}
          className="w-full rounded border border-[#fafafa]/20 bg-[#0a0a0a] px-2 py-1 text-xs text-white outline-none focus:border-[#fafafa]/40"
          aria-label={field === "username" ? "Edit username" : "Edit display name"}
        />
        {error ? <p className="mt-1 text-[10px] text-red-400">{error}</p> : null}
      </div>
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      title={editTitle}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setEditing(true);
        }
      }}
      className={`cursor-text underline decoration-dotted decoration-white/15 underline-offset-4 transition-colors hover:text-white ${className}`.trim()}
    >
      {displayValue}
    </span>
  );
}
