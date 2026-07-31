"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  adminBanUserAction,
  adminDisableUserAction,
  adminGrantPremiumAction,
  adminRevokePremiumAction,
} from "@/app/actions/admin";
import {
  AdminBadge,
  AdminEmptyState,
  AdminPageHeader,
  AdminTableWrap,
} from "@/components/admin/admin-ui";
import { EditableOwnerTextCell } from "@/components/admin/editable-owner-text-cell";
import { EditableUidCell } from "@/components/admin/editable-uid-cell";
import { buttonSecondaryClassName, inputClassName } from "@/components/dashboard/form-fields";
import type { AdminUserRow } from "@/lib/types/admin";

export function AdminUsersPanel({
  initialUsers,
  isOwner = false,
}: {
  initialUsers: AdminUserRow[];
  isOwner?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const users = initialUsers.filter((user) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      user.username?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.display_name?.toLowerCase().includes(q) ||
      String(user.uid ?? "").includes(q)
    );
  });

  const run = (fn: () => Promise<{ error?: string; success?: string }>) => {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  };

  return (
    <>
      <AdminPageHeader
        title="User Management"
        description="Search users, review accounts, and perform admin actions."
      />

      <div className="mb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username, email, UID..."
          className={inputClassName}
        />
      </div>

      {users.length === 0 ? (
        <AdminEmptyState message="No users found." />
      ) : (
        <AdminTableWrap>
          <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">UID</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Badges</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Last Login</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] text-neutral-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <EditableUidCell userId={user.id} uid={user.uid} />
                </td>
                <td className="px-4 py-3">
                  <EditableOwnerTextCell
                    userId={user.id}
                    value={user.username}
                    field="username"
                    editable={isOwner}
                    className="font-medium text-white"
                    emptyLabel="—"
                  />
                  <EditableOwnerTextCell
                    userId={user.id}
                    value={user.display_name}
                    field="display_name"
                    editable={isOwner}
                    className="text-xs text-neutral-500"
                    emptyLabel="No display name"
                  />
                </td>
                <td className="px-4 py-3 text-xs text-neutral-400">{user.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <AdminBadge tone={user.role === "owner" ? "purple" : user.role === "admin" || user.is_admin ? "amber" : "neutral"}>
                      {user.role === "owner" ? "owner" : user.is_admin || user.role === "admin" ? "admin" : "user"}
                    </AdminBadge>
                    {user.is_banned ? <AdminBadge tone="red">banned</AdminBadge> : null}
                    {user.is_disabled ? <AdminBadge tone="red">disabled</AdminBadge> : null}
                    {user.premium_tier !== "free" ? <AdminBadge tone="green">{user.premium_tier}</AdminBadge> : null}
                  </div>
                </td>
                <td className="px-4 py-3">{user.badge_count}</td>
                <td className="px-4 py-3 text-xs text-neutral-500">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-xs text-neutral-500">
                  {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Link href={`/dashboard/admin/users/${user.id}`} className={buttonSecondaryClassName}>
                      View
                    </Link>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => run(() => adminGrantPremiumAction(user.id, "premium", null))}
                      className={buttonSecondaryClassName}
                    >
                      Premium
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => run(() => adminRevokePremiumAction(user.id))}
                      className={buttonSecondaryClassName}
                    >
                      Revoke
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => run(() => adminDisableUserAction(user.id))}
                      className={buttonSecondaryClassName}
                    >
                      Disable
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => run(() => adminBanUserAction(user.id, "Admin action"))}
                      className={buttonSecondaryClassName}
                    >
                      Ban
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTableWrap>
      )}
    </>
  );
}
