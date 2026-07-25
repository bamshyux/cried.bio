"use client";

import { useActionState } from "react";
import {
  addLandingFeaturedProfileAction,
  addLandingTestimonialAction,
  deleteLandingTestimonialAction,
  removeLandingFeaturedProfileAction,
} from "@/app/actions/admin";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminSection,
  AdminTableWrap,
} from "@/components/admin/admin-ui";
import {
  buttonPrimaryClassName,
  FormFeedback,
  inputClassName,
  labelClassName,
  ToggleField,
} from "@/components/dashboard/form-fields";
import type { AdminFormState } from "@/lib/types/admin";
import type { LandingFeaturedProfileRow, LandingTestimonial } from "@/lib/types/landing";

const initial: AdminFormState = {};

export function AdminLandingPanel({
  featured,
  testimonials,
}: {
  featured: LandingFeaturedProfileRow[];
  testimonials: LandingTestimonial[];
}) {
  const [featuredState, featuredAction, featuredPending] = useActionState(
    addLandingFeaturedProfileAction,
    initial,
  );
  const [testimonialState, testimonialAction, testimonialPending] = useActionState(
    addLandingTestimonialAction,
    initial,
  );

  return (
    <>
      <AdminPageHeader
        title="Landing Page"
        description="Manage featured profiles and testimonials shown on the public homepage."
      />

      <AdminSection title="Featured profiles">
        <form action={featuredAction} className="mb-6 grid gap-4 md:grid-cols-3">
          <div>
            <label className={labelClassName}>Username</label>
            <input name="username" required placeholder="bam" className={inputClassName} />
          </div>
          <div>
            <label className={labelClassName}>Sort order</label>
            <input name="sort_order" type="number" defaultValue={0} className={inputClassName} />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={featuredPending} className={buttonPrimaryClassName}>
              {featuredPending ? "Adding..." : "Add featured profile"}
            </button>
          </div>
          <div className="md:col-span-3">
            <FormFeedback error={featuredState.error} success={featuredState.success} />
          </div>
        </form>

        {featured.length === 0 ? (
          <AdminEmptyState message="No featured profiles yet. Add usernames above or the homepage will show random profiles." />
        ) : (
          <AdminTableWrap>
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Display name</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {featured.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-white">@{row.profiles?.username ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-400">{row.profiles?.display_name ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-400">{row.sort_order}</td>
                  <td className="px-4 py-3">
                    <form action={removeLandingFeaturedProfileAction.bind(null, row.id)}>
                      <button type="submit" className="text-sm text-red-400 hover:text-red-300">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTableWrap>
        )}
      </AdminSection>

      <AdminSection title="Testimonials">
        <form action={testimonialAction} className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={labelClassName}>Quote</label>
            <textarea name="quote" required rows={3} className={inputClassName} />
          </div>
          <div>
            <label className={labelClassName}>Author name</label>
            <input name="author_name" required className={inputClassName} />
          </div>
          <div>
            <label className={labelClassName}>Author title</label>
            <input name="author_title" placeholder="Digital artist" className={inputClassName} />
          </div>
          <div>
            <label className={labelClassName}>Author username (optional)</label>
            <input name="author_username" placeholder="bam" className={inputClassName} />
          </div>
          <div>
            <label className={labelClassName}>Avatar URL (optional)</label>
            <input name="author_avatar_url" type="url" className={inputClassName} />
          </div>
          <div>
            <label className={labelClassName}>Sort order</label>
            <input name="sort_order" type="number" defaultValue={0} className={inputClassName} />
          </div>
          <ToggleField name="is_active" label="Active" defaultChecked />
          <div className="md:col-span-2">
            <FormFeedback error={testimonialState.error} success={testimonialState.success} />
            <button type="submit" disabled={testimonialPending} className={buttonPrimaryClassName}>
              {testimonialPending ? "Adding..." : "Add testimonial"}
            </button>
          </div>
        </form>

        {testimonials.length === 0 ? (
          <AdminEmptyState message="No testimonials yet. Default placeholders show on the homepage until you add some." />
        ) : (
          <AdminTableWrap>
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Quote</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {testimonials.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-white">{item.author_name}</td>
                  <td className="max-w-md truncate px-4 py-3 text-neutral-400">{item.quote}</td>
                  <td className="px-4 py-3 text-neutral-400">{item.is_active !== false ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    <form action={deleteLandingTestimonialAction.bind(null, item.id)}>
                      <button type="submit" className="text-sm text-red-400 hover:text-red-300">
                        Remove
                      </button>
                    </form>
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
