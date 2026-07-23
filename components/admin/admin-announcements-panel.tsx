"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  toggleAnnouncementAction,
} from "@/app/actions/admin";
import {
  AdminEmptyState,
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
import { ANNOUNCEMENT_TYPE_OPTIONS, type AdminFormState, type Announcement } from "@/lib/types/admin";

const initial: AdminFormState = {};

export function AdminAnnouncementsPanel({ announcements }: { announcements: Announcement[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createAnnouncementAction, initial);
  const [togglePending, startToggle] = useTransition();

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <>
      <AdminPageHeader
        title="Global Announcements"
        description="Create sitewide banners for info, warnings, updates, and maintenance. Active announcements appear at the top of every page."
      />

      <AdminSection title="Create announcement">
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={labelClassName}>Title</label>
            <input name="title" required className={inputClassName} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClassName}>Body</label>
            <textarea name="body" rows={3} className={inputClassName} />
          </div>
          <div>
            <label className={labelClassName}>Type</label>
            <select name="announcement_type" className={inputClassName} defaultValue="info">
              {ANNOUNCEMENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <ToggleField name="is_active" label="Active" defaultChecked />
          <div className="md:col-span-2">
            <FormFeedback error={state.error} success={state.success} />
            <button type="submit" disabled={pending} className={buttonPrimaryClassName}>
              {pending ? "Creating..." : "Create announcement"}
            </button>
          </div>
        </form>
      </AdminSection>

      <AdminSection title="Existing announcements">
        {announcements.length === 0 ? (
          <AdminEmptyState message="No announcements yet." />
        ) : (
          <AdminTableWrap>
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {announcements.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-white">{item.title}</td>
                  <td className="px-4 py-3 text-neutral-400">{item.announcement_type}</td>
                  <td className="px-4 py-3 text-neutral-400">{item.is_active ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500">{new Date(item.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={togglePending}
                        onClick={() =>
                          startToggle(async () => {
                            await toggleAnnouncementAction(item.id, !item.is_active);
                            router.refresh();
                          })
                        }
                        className={buttonSecondaryClassName}
                      >
                        {item.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <form action={deleteAnnouncementAction.bind(null, item.id)}>
                        <button type="submit" className={buttonSecondaryClassName}>Delete</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTableWrap>
        )}
      </AdminSection>
    </>
  );
}
