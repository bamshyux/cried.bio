"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteAdminAccountAction,
  updateAdminAccountAction,
} from "@/app/actions/admin-accounts";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  cardClassName,
  FormFeedback,
  inputClassName,
  labelClassName,
  PageHeader,
  ToggleField,
} from "@/components/dashboard/form-fields";
import { formatProfileUid } from "@/lib/profile";
import type { AdminAccountFormState, AdminAccountSummary } from "@/lib/types/admin-account";

const initial: AdminAccountFormState = {};
const DELETE_CONFIRM_PHRASE = "I Confirm";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function AccountEditor({
  account,
  onClose,
  onSaved,
}: {
  account: AdminAccountSummary;
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [updateState, updateAction, updatePending] = useActionState(updateAdminAccountAction, initial);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAdminAccountAction, initial);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const pending = updatePending || deletePending;

  useEffect(() => {
    if (updateState.success) onSaved();
  }, [updateState.success, onSaved]);

  useEffect(() => {
    if (deleteState.success) {
      router.refresh();
      onClose();
    }
  }, [deleteState.success, onClose, router]);

  return (
    <div className={cardClassName}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-white">Edit account</h2>
          <p className="mt-1 text-xs text-neutral-500">
            {account.uid != null ? formatProfileUid(account.uid) : "No UID"} · {account.email ?? "No email"}
          </p>
        </div>
        <button type="button" onClick={onClose} className={buttonSecondaryClassName}>
          Close
        </button>
      </div>

      <form action={updateAction} className="space-y-4">
        <input type="hidden" name="user_id" value={account.id} />

        <div>
          <label className={labelClassName} htmlFor="admin-username">
            Username
          </label>
          <input
            id="admin-username"
            name="username"
            defaultValue={account.username ?? ""}
            className={inputClassName}
            required
            autoComplete="off"
          />
        </div>

        <div>
          <label className={labelClassName} htmlFor="admin-display-name">
            Display name
          </label>
          <input
            id="admin-display-name"
            name="display_name"
            defaultValue={account.display_name ?? ""}
            className={inputClassName}
            autoComplete="off"
          />
        </div>

        <div>
          <label className={labelClassName} htmlFor="admin-bio">
            Bio
          </label>
          <textarea
            id="admin-bio"
            name="bio"
            defaultValue={account.bio ?? ""}
            rows={3}
            className={`${inputClassName} resize-y`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClassName} htmlFor="admin-premium-tier">
              Premium tier
            </label>
            <select
              id="admin-premium-tier"
              name="premium_tier"
              defaultValue={account.premium_tier === "premium" ? "premium" : "free"}
              className={inputClassName}
            >
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div>
            <label className={labelClassName} htmlFor="admin-premium-expires">
              Premium expires
            </label>
            <input
              id="admin-premium-expires"
              name="premium_expires_at"
              type="datetime-local"
              defaultValue={
                account.premium_expires_at
                  ? new Date(account.premium_expires_at).toISOString().slice(0, 16)
                  : ""
              }
              className={inputClassName}
            />
          </div>
        </div>

        <ToggleField name="is_admin" label="Admin access" defaultChecked={account.is_admin} />

        <FormFeedback error={updateState.error} success={updateState.success} />

        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending} className={buttonPrimaryClassName}>
            {updatePending ? "Saving..." : "Save changes"}
          </button>
          <a
            href={account.username ? `/${account.username}` : "#"}
            target="_blank"
            rel="noreferrer"
            className={`${buttonSecondaryClassName} inline-flex items-center`}
          >
            View profile
          </a>
        </div>
      </form>

      <div className="mt-8 border-t border-white/[0.06] pt-6">
        <h3 className="text-sm font-medium text-red-400">Danger zone</h3>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
          Permanently deletes the auth account, profile, UID, settings, links, badges, analytics,
          uploads, and all related data.
        </p>

        {!showDelete ? (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="mt-3 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            Delete account
          </button>
        ) : (
          <form action={deleteAction} className="mt-4 space-y-3">
            <input type="hidden" name="user_id" value={account.id} />
            <div>
              <label className={labelClassName} htmlFor="admin-confirm-phrase">
                Type <span className="text-white">{DELETE_CONFIRM_PHRASE}</span> to confirm
              </label>
              <input
                id="admin-confirm-phrase"
                name="confirm_phrase"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                className={inputClassName}
                placeholder={DELETE_CONFIRM_PHRASE}
                autoComplete="off"
              />
            </div>
            <FormFeedback error={deleteState.error} success={deleteState.success} />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={deletePending || confirmPhrase.trim() !== DELETE_CONFIRM_PHRASE}
                className="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deletePending ? "Deleting..." : "Permanently delete"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDelete(false);
                  setConfirmPhrase("");
                }}
                className={buttonSecondaryClassName}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function AdminAccountsEditor({ accounts }: { accounts: AdminAccountSummary[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts;

    return accounts.filter((account) => {
      const uid = account.uid != null ? String(account.uid) : "";
      return (
        account.username?.toLowerCase().includes(q) ||
        account.display_name?.toLowerCase().includes(q) ||
        account.email?.toLowerCase().includes(q) ||
        uid.includes(q.replace(/\D/g, "")) ||
        account.id.toLowerCase().includes(q)
      );
    });
  }, [accounts, query]);

  const selected = selectedId ? accounts.find((a) => a.id === selectedId) ?? null : null;

  return (
    <>
      <PageHeader
        title="Manage Accounts"
        description="View and edit every cried.bio account. Changes apply immediately."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className={cardClassName}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-medium text-white">All accounts</h2>
              <p className="text-xs text-neutral-500">{accounts.length} total</p>
            </div>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search username, email, UID..."
              className={`${inputClassName} sm:max-w-xs`}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-neutral-500">
                  <th className="pb-3 pr-4 font-medium">UID</th>
                  <th className="pb-3 pr-4 font-medium">Username</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Joined</th>
                  <th className="pb-3 font-medium">Flags</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((account) => {
                  const active = selectedId === account.id;
                  return (
                    <tr
                      key={account.id}
                      onClick={() => setSelectedId(account.id)}
                      className={`cursor-pointer border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] ${
                        active ? "bg-[#fafafa]/[0.06]" : ""
                      }`}
                    >
                      <td className="py-3 pr-4 font-mono text-xs text-neutral-400">
                        {account.uid != null ? `#${account.uid}` : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-medium text-white">@{account.username ?? "—"}</span>
                        {account.display_name && (
                          <span className="mt-0.5 block text-xs text-neutral-500">{account.display_name}</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-xs text-neutral-400">{account.email ?? "—"}</td>
                      <td className="py-3 pr-4 text-xs text-neutral-500">{formatDate(account.created_at)}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {account.is_admin && (
                            <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300">
                              Admin
                            </span>
                          )}
                          {account.premium_tier === "premium" && (
                            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300">
                              Premium
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-neutral-600">No accounts match your search.</p>
            )}
          </div>
        </div>

        <div className="xl:sticky xl:top-24 xl:self-start">
          {selected ? (
            <AccountEditor
              key={selected.id}
              account={selected}
              onClose={() => setSelectedId(null)}
              onSaved={() => router.refresh()}
            />
          ) : (
            <div className={`${cardClassName} text-sm text-neutral-500`}>
              Select an account from the list to edit username, bio, admin status, premium tier, or
              delete the account.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function AdminAccountsPageShell(props: { accounts: AdminAccountSummary[] }) {
  return <AdminAccountsEditor {...props} />;
}
