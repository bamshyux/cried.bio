"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buttonPrimaryClassName,
  cardClassName,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-fields";
import { readJsonResponse } from "@/lib/stripe/client-fetch";
import type { GiftCheckoutTarget } from "@/lib/types/store";

type UsernameSuggestion = {
  username: string;
  display_name: string | null;
};

export function GiftModal({
  open,
  onClose,
  target,
  productName,
  priceLabel,
  buyerUsername,
  onError,
}: {
  open: boolean;
  onClose: () => void;
  target: GiftCheckoutTarget;
  productName: string;
  priceLabel: string;
  buyerUsername: string | null;
  onError: (message: string) => void;
}) {
  const [recipientUsername, setRecipientUsername] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<UsernameSuggestion[]>([]);
  const [validationError, setValidationError] = useState<string>();
  const [validatedUsername, setValidatedUsername] = useState<string>();
  const searchTimerRef = useRef<number | null>(null);
  const validateTimerRef = useRef<number | null>(null);

  const resetState = useCallback(() => {
    setRecipientUsername("");
    setGiftMessage("");
    setSuggestions([]);
    setValidationError(undefined);
    setValidatedUsername(undefined);
  }, []);

  useEffect(() => {
    if (!open) resetState();
  }, [open, resetState]);

  useEffect(
    () => () => {
      if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
      if (validateTimerRef.current) window.clearTimeout(validateTimerRef.current);
    },
    [],
  );

  const runValidation = useCallback(
    async (username: string): Promise<{ ok: boolean; error?: string; recipientUsername?: string }> => {
      const trimmed = username.trim();
      if (!trimmed) {
        setValidationError(undefined);
        setValidatedUsername(undefined);
        return { ok: false, error: "Enter a recipient username." };
      }

      if (buyerUsername && trimmed.toLowerCase() === buyerUsername.toLowerCase()) {
        setValidationError("You cannot gift an item to yourself.");
        setValidatedUsername(undefined);
        return { ok: false, error: "You cannot gift an item to yourself." };
      }

      try {
        const res = await fetch("/api/gifts/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipientUsername: trimmed, target }),
        });
        const data = await readJsonResponse<{ ok?: boolean; error?: string; recipientUsername?: string }>(res);
        if (!res.ok || !data.ok) {
          const message = data.error ?? "Recipient is not eligible.";
          setValidationError(message);
          setValidatedUsername(undefined);
          return { ok: false, error: message };
        }
        const normalized = data.recipientUsername ?? trimmed.toLowerCase();
        setValidationError(undefined);
        setValidatedUsername(normalized);
        return { ok: true, recipientUsername: normalized };
      } catch {
        const message = "Could not validate recipient.";
        setValidationError(message);
        setValidatedUsername(undefined);
        return { ok: false, error: message };
      }
    },
    [buyerUsername, target],
  );

  const handleRecipientChange = (value: string) => {
    setRecipientUsername(value);
    setValidatedUsername(undefined);
    setValidationError(undefined);

    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    if (validateTimerRef.current) window.clearTimeout(validateTimerRef.current);

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    searchTimerRef.current = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(trimmed)}`);
        const data = await readJsonResponse<{ users?: UsernameSuggestion[] }>(res);
        setSuggestions(data.users ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    validateTimerRef.current = window.setTimeout(() => {
      void runValidation(trimmed);
    }, 450);
  };

  const selectSuggestion = (username: string) => {
    setRecipientUsername(username);
    setSuggestions([]);
    void runValidation(username);
  };

  if (!open) return null;

  const continueGift = async () => {
    const recipient = recipientUsername.trim().toLowerCase();
    if (!recipient) {
      onError("Enter a recipient username.");
      return;
    }

    let validation = await runValidation(recipient);
    if (!validation.ok) {
      onError(validation.error ?? "Enter a valid recipient username.");
      return;
    }

    setLoading(true);
    onError("");
    try {
      const body =
        target.kind === "store"
          ? {
              productSlug: target.productSlug,
              recipientUsername: recipient,
              giftMessage: giftMessage.trim() || undefined,
            }
          : {
              plan: target.plan,
              recipientUsername: recipient,
              giftMessage: giftMessage.trim() || undefined,
              premiumGift: true,
            };

      const endpoint =
        target.kind === "store" ? "/api/stripe/store-checkout" : "/api/stripe/checkout";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await readJsonResponse<{ url?: string; error?: string }>(res);
      if (!res.ok || !data.url) throw new Error(data.error ?? "Could not start gift checkout.");
      window.location.href = data.url;
    } catch (err) {
      onError(err instanceof Error ? err.message : "Gift checkout failed.");
      setLoading(false);
    }
  };

  const canContinue = Boolean(validatedUsername) && !validationError && !loading;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className={`${cardClassName} w-full max-w-md border border-white/[0.1] p-6`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-amber-400/90">Gift</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Send a gift</h2>
            <p className="mt-2 text-sm text-neutral-400">
              {productName} · {priceLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <label className={labelClassName} htmlFor="gift-recipient">
              Recipient username
            </label>
            <input
              id="gift-recipient"
              value={recipientUsername}
              onChange={(e) => handleRecipientChange(e.target.value)}
              placeholder="Search username…"
              autoComplete="off"
              className={inputClassName}
            />
            {searchLoading ? (
              <p className="mt-1 text-xs text-neutral-500">Searching…</p>
            ) : null}
            {validationError ? (
              <p className="mt-1 text-xs text-red-400">{validationError}</p>
            ) : validatedUsername ? (
              <p className="mt-1 text-xs text-emerald-400">@{validatedUsername} can receive this gift.</p>
            ) : null}
            {suggestions.length > 0 ? (
              <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-xl border border-white/[0.08] bg-[#111] py-1 shadow-xl">
                {suggestions.map((user) => (
                  <li key={user.username}>
                    <button
                      type="button"
                      onClick={() => selectSuggestion(user.username)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-neutral-200 hover:bg-white/[0.06]"
                    >
                      <span>@{user.username}</span>
                      {user.display_name ? (
                        <span className="text-xs text-neutral-500">{user.display_name}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div>
            <label className={labelClassName} htmlFor="gift-message">
              Gift message <span className="text-neutral-600">(optional)</span>
            </label>
            <textarea
              id="gift-message"
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
              rows={3}
              placeholder="Hope you enjoy cried.bio ❤️"
              className={inputClassName}
            />
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm text-neutral-400">
            <p className="font-medium text-white">Summary</p>
            <p className="mt-2">
              You&apos;re gifting <span className="text-neutral-200">{productName}</span> to{" "}
              <span className="text-neutral-200">@{recipientUsername.trim() || "…"}</span>.
            </p>
            <p className="mt-1">Total: {priceLabel}</p>
            {giftMessage.trim() ? (
              <p className="mt-2 text-xs italic text-neutral-500">&ldquo;{giftMessage.trim()}&rdquo;</p>
            ) : null}
            <p className="mt-2 text-xs text-neutral-500">
              Successful gifts award you the exclusive 🎁 Gifter badge.
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm font-semibold text-neutral-300 hover:bg-white/[0.04]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => void continueGift()}
            className={`${buttonPrimaryClassName} flex-1`}
          >
            {loading ? "Redirecting…" : "Continue to Checkout"}
          </button>
        </div>
      </div>
    </div>
  );
}
