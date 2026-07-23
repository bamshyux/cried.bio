"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  archiveStoreProductAction,
  createStoreProductAction,
  toggleStoreProductVisibilityAction,
  updateStoreProductAction,
  type StoreProductInput,
} from "@/app/actions/store-admin";
import { AdminBadge } from "@/components/admin/admin-ui";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  cardClassName,
  FormFeedback,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-fields";
import type { Badge } from "@/lib/types/badge";
import type { StoreProduct } from "@/lib/types/store";

const STATUS_TONE = {
  active: "green",
  coming_soon: "amber",
  archived: "neutral",
} as const;

function emptyForm(): StoreProductInput {
  return {
    slug: "",
    name: "",
    description: "",
    features: "",
    icon: "✦",
    price_cents: 0,
    stripe_price_id: "",
    badge_label: null,
    status: "active",
    is_giftable: true,
    is_visible: true,
    sort_order: 100,
    fulfillment_key: "",
    badge_slug: "",
  };
}

function productToForm(product: StoreProduct): StoreProductInput {
  return {
    slug: product.slug,
    name: product.name,
    description: product.description,
    features: product.features.join("\n"),
    icon: product.icon,
    price_cents: product.price_cents,
    stripe_price_id: product.stripe_price_id ?? "",
    badge_label: product.badge_label,
    status: product.status,
    is_giftable: product.is_giftable,
    is_visible: product.is_visible,
    sort_order: product.sort_order,
    fulfillment_key: product.fulfillment_key,
    badge_slug: product.badge_slug ?? "",
  };
}

function ProductForm({
  form,
  setForm,
  badges,
  onSubmit,
  submitLabel,
  pending,
  feedback,
}: {
  form: StoreProductInput;
  setForm: (next: StoreProductInput) => void;
  badges: Badge[];
  onSubmit: () => void;
  submitLabel: string;
  pending: boolean;
  feedback?: { error?: string; success?: string };
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClassName}>Slug</label>
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className={inputClassName}
            placeholder="custom-badge"
          />
        </div>
        <div>
          <label className={labelClassName}>Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClassName}
          />
        </div>
        <div>
          <label className={labelClassName}>Icon</label>
          <input
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            className={inputClassName}
            placeholder="✦"
          />
        </div>
        <div>
          <label className={labelClassName}>Price (cents)</label>
          <input
            type="number"
            min={0}
            value={form.price_cents}
            onChange={(e) => setForm({ ...form, price_cents: Number(e.target.value) || 0 })}
            className={inputClassName}
          />
        </div>
        <div>
          <label className={labelClassName}>Stripe price ID</label>
          <input
            value={form.stripe_price_id ?? ""}
            onChange={(e) => setForm({ ...form, stripe_price_id: e.target.value })}
            className={inputClassName}
            placeholder="price_…"
          />
        </div>
        <div>
          <label className={labelClassName}>Fulfillment key</label>
          <input
            value={form.fulfillment_key}
            onChange={(e) => setForm({ ...form, fulfillment_key: e.target.value })}
            className={inputClassName}
            placeholder="custom_badge"
          />
        </div>
        <div>
          <label className={labelClassName}>Badge slug (optional)</label>
          <select
            value={form.badge_slug ?? ""}
            onChange={(e) => setForm({ ...form, badge_slug: e.target.value || null })}
            className={inputClassName}
          >
            <option value="">None</option>
            {badges.map((badge) => (
              <option key={badge.id} value={badge.slug}>
                {badge.icon} {badge.name} ({badge.slug})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClassName}>Card badge</label>
          <select
            value={form.badge_label ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                badge_label: (e.target.value as "Popular" | "New" | "") || null,
              })
            }
            className={inputClassName}
          >
            <option value="">None</option>
            <option value="Popular">Popular</option>
            <option value="New">New</option>
          </select>
        </div>
        <div>
          <label className={labelClassName}>Status</label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as StoreProductInput["status"] })
            }
            className={inputClassName}
          >
            <option value="active">Active</option>
            <option value="coming_soon">Coming soon</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label className={labelClassName}>Sort order</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
            className={inputClassName}
          />
        </div>
      </div>

      <div>
        <label className={labelClassName}>Description</label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={inputClassName}
        />
      </div>

      <div>
        <label className={labelClassName}>Features (one per line)</label>
        <textarea
          rows={4}
          value={form.features}
          onChange={(e) => setForm({ ...form, features: e.target.value })}
          className={inputClassName}
        />
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-neutral-300">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_giftable}
            onChange={(e) => setForm({ ...form, is_giftable: e.target.checked })}
          />
          Giftable
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_visible}
            onChange={(e) => setForm({ ...form, is_visible: e.target.checked })}
          />
          Visible in store
        </label>
      </div>

      <FormFeedback error={feedback?.error} success={feedback?.success} />

      <button type="button" disabled={pending} onClick={onSubmit} className={buttonPrimaryClassName}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}

export function StoreAdminPanel({
  products,
  badges,
}: {
  products: StoreProduct[];
  badges: Badge[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editForm, setEditForm] = useState<StoreProductInput>(emptyForm());
  const [createForm, setCreateForm] = useState<StoreProductInput>(emptyForm());
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>();
  const [pending, startTransition] = useTransition();

  const sorted = useMemo(
    () => [...products].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [products],
  );

  const startEdit = (product: StoreProduct) => {
    setCreating(false);
    setEditingId(product.id);
    setEditForm(productToForm(product));
    setFeedback(undefined);
  };

  const runAction = (action: () => Promise<{ error?: string; success?: string }>) => {
    startTransition(async () => {
      const result = await action();
      setFeedback(result);
      if (result.success) {
        router.refresh();
        if (result.success.includes("created")) {
          setCreating(false);
          setCreateForm(emptyForm());
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className={`${cardClassName} border-violet-500/20`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-white">Store catalog</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Manage one-time products, prices, visibility, and badge grants.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCreating((v) => !v);
              setEditingId(null);
              setFeedback(undefined);
            }}
            className={buttonSecondaryClassName}
          >
            {creating ? "Cancel" : "New product"}
          </button>
        </div>

        {creating ? (
          <ProductForm
            form={createForm}
            setForm={setCreateForm}
            badges={badges}
            pending={pending}
            feedback={feedback}
            submitLabel="Create product"
            onSubmit={() =>
              runAction(() => createStoreProductAction(createForm))
            }
          />
        ) : null}

        <div className="mt-4 overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="min-w-full divide-y divide-white/[0.06] text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Flags</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {sorted.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-lg">
                        {product.icon}
                      </span>
                      <div>
                        <p className="font-medium text-white">{product.name}</p>
                        <p className="text-xs text-neutral-500">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-300">
                    ${(product.price_cents / 100).toFixed(product.price_cents % 100 === 0 ? 0 : 2)}
                  </td>
                  <td className="px-4 py-3">
                    <AdminBadge tone={STATUS_TONE[product.status] ?? "neutral"}>{product.status}</AdminBadge>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {product.is_visible ? "Visible" : "Hidden"}
                    {product.is_giftable ? " · Giftable" : " · No gifts"}
                    {product.badge_slug ? ` · Badge: ${product.badge_slug}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => startEdit(product)} className={buttonSecondaryClassName}>
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          runAction(() =>
                            toggleStoreProductVisibilityAction(product.id, !product.is_visible),
                          )
                        }
                        className={buttonSecondaryClassName}
                      >
                        {product.is_visible ? "Hide" : "Show"}
                      </button>
                      {product.status !== "archived" ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => runAction(() => archiveStoreProductAction(product.id))}
                          className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10"
                        >
                          Archive
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingId ? (
        <div className={`${cardClassName} border-white/[0.08]`}>
          <h2 className="mb-4 text-sm font-medium text-white">Edit product</h2>
          <ProductForm
            form={editForm}
            setForm={setEditForm}
            badges={badges}
            pending={pending}
            feedback={feedback}
            submitLabel="Save changes"
            onSubmit={() =>
              runAction(() => updateStoreProductAction(editingId, editForm))
            }
          />
        </div>
      ) : null}
    </div>
  );
}
