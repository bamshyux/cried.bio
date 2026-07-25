"use client";

import { useActionState } from "react";
import {
  addReservedUsernameAction,
  adminForceLogoutAllAction,
  giveViewsAction,
  removeReservedUsernameAction,
  updatePlatformSettingsAction,
} from "@/app/actions/admin";
import {
  AdminPageHeader,
  AdminSection,
  AdminTableWrap,
} from "@/components/admin/admin-ui";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  FormFeedback,
  inputClassName,
  labelClassName,
  ToggleField,
} from "@/components/dashboard/form-fields";
import { ANNOUNCEMENT_TYPE_OPTIONS, type AdminFormState, type PlatformSettings, type ReservedUsername } from "@/lib/types/admin";

const initial: AdminFormState = {};

export function AdminOwnerPanel({
  settings,
  reserved,
}: {
  settings: PlatformSettings | null;
  reserved: ReservedUsername[];
}) {
  const [settingsState, settingsAction, settingsPending] = useActionState(updatePlatformSettingsAction, initial);
  const [reservedState, reservedAction, reservedPending] = useActionState(addReservedUsernameAction, initial);
  const [logoutState, logoutAction, logoutPending] = useActionState(adminForceLogoutAllAction, initial);
  const [viewgiverState, viewgiverAction, viewgiverPending] = useActionState(giveViewsAction, initial);

  return (
    <>
      <AdminPageHeader
        title="Owner Tools"
        description="Maintenance mode, global banner, reserved usernames, and platform controls."
      />

      <AdminSection title="Platform controls">
        <form action={settingsAction} className="grid gap-4 md:grid-cols-2">
          <ToggleField name="maintenance_mode" label="Maintenance mode" defaultChecked={settings?.maintenance_mode} />
          <ToggleField name="read_only_mode" label="Site read-only mode" defaultChecked={settings?.read_only_mode} />
          <ToggleField name="force_password_reset" label="Force password reset" defaultChecked={settings?.force_password_reset} />
          <div className="md:col-span-2">
            <label className={labelClassName}>Global banner message</label>
            <textarea name="global_banner" defaultValue={settings?.global_banner ?? ""} rows={2} className={inputClassName} />
          </div>
          <div>
            <label className={labelClassName}>Banner type</label>
            <select name="global_banner_type" defaultValue={settings?.global_banner_type ?? "info"} className={inputClassName}>
              {ANNOUNCEMENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center gap-2">
            <FormFeedback error={settingsState.error} success={settingsState.success} />
            <button type="submit" disabled={settingsPending} className={buttonPrimaryClassName}>
              {settingsPending ? "Saving..." : "Save platform settings"}
            </button>
          </div>
        </form>
        <form action={logoutAction} className="mt-3">
          <button type="submit" disabled={logoutPending} className={buttonSecondaryClassName}>
            {logoutPending ? "Processing..." : "Force logout all users"}
          </button>
          <FormFeedback error={logoutState.error} success={logoutState.success} />
        </form>
      </AdminSection>

      <AdminSection title="Viewgiver">
        <p className="mb-4 text-sm text-neutral-400">
          Add views to a profile. This increases their current count — real profile visits will keep adding on top.
        </p>
        <form action={viewgiverAction} className="grid gap-4 md:grid-cols-3">
          <div>
            <label className={labelClassName}>Username</label>
            <input
              name="username"
              placeholder="joshua"
              className={inputClassName}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelClassName}>UID</label>
            <input
              name="uid"
              type="number"
              min={1}
              step={1}
              placeholder="Optional if username set"
              className={inputClassName}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelClassName}>Views to add</label>
            <input
              name="amount"
              type="number"
              min={1}
              step={1}
              required
              placeholder="100"
              className={inputClassName}
            />
          </div>
          <div className="md:col-span-3 flex flex-wrap items-center gap-2">
            <FormFeedback error={viewgiverState.error} success={viewgiverState.success} />
            <button type="submit" disabled={viewgiverPending} className={buttonPrimaryClassName}>
              {viewgiverPending ? "Adding..." : "Give views"}
            </button>
          </div>
        </form>
      </AdminSection>

      <AdminSection title="Reserved usernames">
        <form action={reservedAction} className="mb-4 grid gap-4 md:grid-cols-3">
          <div>
            <label className={labelClassName}>Username</label>
            <input name="username" required className={inputClassName} />
          </div>
          <div>
            <label className={labelClassName}>Reason</label>
            <input name="reason" className={inputClassName} />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={reservedPending} className={buttonPrimaryClassName}>Add</button>
          </div>
          <div className="md:col-span-3">
            <FormFeedback error={reservedState.error} success={reservedState.success} />
          </div>
        </form>

        <AdminTableWrap>
          <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {reserved.map((row) => (
              <tr key={row.username}>
                <td className="px-4 py-3 text-white">{row.username}</td>
                <td className="px-4 py-3 text-neutral-400">{row.reason}</td>
                <td className="px-4 py-3">
                  <form action={removeReservedUsernameAction.bind(null, row.username)}>
                    <button type="submit" className={buttonSecondaryClassName}>Remove</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTableWrap>
      </AdminSection>

      <AdminSection title="System status">
        <ul className="space-y-2 text-sm text-neutral-400">
          <li>Supabase: connected via app environment</li>
          <li>Email delivery: configure in Supabase Auth settings</li>
          <li>Storage usage: view in Supabase dashboard</li>
          <li>Deployment: check your hosting provider dashboard</li>
          <li>Error logs: view in Vercel/hosting logs or Supabase logs</li>
        </ul>
      </AdminSection>
    </>
  );
}
