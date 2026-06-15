"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import {
  reorderProfileBadgesAction,
  updateBadgeDisplaySettingsAction,
  updateProfileBadgeAction,
} from "@/app/actions/badges";
import { BadgesAdminPanel } from "@/components/dashboard/badges-admin-panel";
import { BadgeCard, BadgeRow, ProfileHoverPreview, BadgeChip } from "@/components/badges/badge-ui";
import {
  buttonPrimaryClassName,
  cardClassName,
  FormFeedback,
  inputClassName,
  labelClassName,
  PageHeader,
  SliderField,
  ToggleField,
} from "@/components/dashboard/form-fields";
import { BADGE_CATEGORIES, type Badge, type BadgeFormState, type BadgeInventoryItem } from "@/lib/types/badge";
import type { ProfileBadge } from "@/lib/types/badge";
import type { ProfileSettings } from "@/lib/types/settings";
import { buildBadgeStyleOptions, preparePublicBadges } from "@/lib/badges/display";
import type { Profile } from "@/lib/types/profile";

const initial: BadgeFormState = {};

function EarnedBadgeList({
  earned,
  onUpdate,
  styleOptions,
}: {
  earned: BadgeInventoryItem[];
  onUpdate: () => void;
  styleOptions?: { monochrome?: boolean };
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: string, field: "is_visible" | "is_featured", current: boolean) => {
    startTransition(async () => {
      await updateProfileBadgeAction(id, { [field]: !current });
      onUpdate();
    });
  };

  const move = (index: number, direction: -1 | 1) => {
    const swap = index + direction;
    if (swap < 0 || swap >= earned.length) return;
    const ids = earned.map((b) => b.profile_badge_id!);
    [ids[index], ids[swap]] = [ids[swap], ids[index]];
    startTransition(async () => {
      await reorderProfileBadgesAction(ids);
      onUpdate();
    });
  };

  if (earned.length === 0) {
    return <p className="text-sm text-neutral-600">No badges earned yet. Milestone badges unlock from profile views.</p>;
  }

  return (
    <div className="space-y-2">
      {earned.map((badge, index) => (
        <div
          key={badge.profile_badge_id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-[#0f0f0f] p-3"
        >
          <BadgeChip badge={badge} styleOptions={styleOptions} />
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={isPending || index === 0} onClick={() => move(index, -1)} className="rounded-lg border border-white/[0.06] px-2 py-1 text-xs text-neutral-500 hover:text-white disabled:opacity-30">↑</button>
            <button type="button" disabled={isPending || index === earned.length - 1} onClick={() => move(index, 1)} className="rounded-lg border border-white/[0.06] px-2 py-1 text-xs text-neutral-500 hover:text-white disabled:opacity-30">↓</button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleToggle(badge.profile_badge_id!, "is_visible", badge.is_visible !== false)}
              className="rounded-lg border border-white/[0.06] px-3 py-1 text-xs text-neutral-400 hover:text-white"
            >
              {badge.is_visible !== false ? "Hide" : "Show"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleToggle(badge.profile_badge_id!, "is_featured", !!badge.is_featured)}
              className="rounded-lg border border-white/[0.06] px-3 py-1 text-xs text-neutral-400 hover:text-white"
            >
              {badge.is_featured ? "Unfeature" : "Feature"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BadgesEditor({
  inventory,
  earnedBadges,
  settings,
  profile,
  isAdmin,
  catalog,
}: {
  inventory: BadgeInventoryItem[];
  earnedBadges: ProfileBadge[];
  settings: ProfileSettings;
  profile: Profile | null;
  isAdmin: boolean;
  catalog: Badge[];
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateBadgeDisplaySettingsAction, initial);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const earned = inventory
    .filter((b) => b.earned)
    .sort((a, b) => (a.user_sort_order ?? 0) - (b.user_sort_order ?? 0));
  const locked = inventory.filter((b) => !b.earned);
  const badgeStyleOptions = buildBadgeStyleOptions(settings);
  const publicPreview = preparePublicBadges(earnedBadges, settings);
  const monoColor = settings.badges_monochrome ? settings.text_color : null;

  const filtered = useMemo(() => {
    return inventory.filter((b) => {
      const matchesQuery =
        !query ||
        b.name.toLowerCase().includes(query.toLowerCase()) ||
        b.description.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "all" || b.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [inventory, query, category]);

  const styledInventory = useMemo(() => {
    if (!monoColor) return filtered;
    return filtered.map((badge) => ({ ...badge, color: monoColor }));
  }, [filtered, monoColor]);

  const styledEarned = useMemo(() => {
    if (!monoColor) return earned;
    return earned.map((badge) => ({ ...badge, color: monoColor }));
  }, [earned, monoColor]);

  const refresh = () => router.refresh();

  return (
    <>
      <PageHeader
        title="Badges"
        description="Collect, showcase, and manage your BioForge badge collection."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {isAdmin && <BadgesAdminPanel catalog={catalog} />}

          <div className={cardClassName}>
            <h2 className="mb-4 text-sm font-medium text-white">Display settings</h2>
            <form action={formAction} className="space-y-4">
              <ToggleField name="show_badges" label="Show badges on profile" defaultChecked={settings.show_badges} />
              <ToggleField
                name="badges_monochrome"
                label="Monochrome badges"
                description={`Tint all badges to your text color (${settings.text_color}) from Customize`}
                defaultChecked={settings.badges_monochrome}
              />
              <SliderField
                name="badge_display_limit"
                label="Public badge limit"
                min={0}
                max={12}
                defaultValue={settings.badge_display_limit}
                unit={settings.badge_display_limit === 0 ? " (all)" : ""}
              />
              <p className="text-xs text-neutral-600">
                Set limit to 0 to show all visible badges. Featured badges appear first.
                Monochrome uses your text color from Dashboard → Customize.
              </p>
              <FormFeedback error={state.error} success={state.success} />
              <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
                {isPending ? "Saving..." : "Save display settings"}
              </button>
            </form>
          </div>

          <div className={cardClassName}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-medium text-white">Your collection</h2>
              <div className="flex gap-2 text-xs text-neutral-500">
                <span className="rounded-full bg-[#00e5cc]/10 px-2 py-0.5 text-[#00e5cc]">{earned.length} earned</span>
                <span className="rounded-full bg-white/[0.04] px-2 py-0.5">{locked.length} locked</span>
              </div>
            </div>
            <input
              type="search"
              placeholder="Search badges..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={inputClassName}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={`rounded-full px-3 py-1 text-xs ${category === "all" ? "bg-[#00e5cc]/10 text-[#00e5cc]" : "bg-white/[0.04] text-neutral-500"}`}
              >
                All
              </button>
              {BADGE_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`rounded-full px-3 py-1 text-xs ${category === c.id ? "bg-[#00e5cc]/10 text-[#00e5cc]" : "bg-white/[0.04] text-neutral-500"}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {styledInventory.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  earned={badge.earned}
                  styleOptions={badgeStyleOptions}
                  onToggleVisible={
                    badge.profile_badge_id
                      ? () => {
                          void updateProfileBadgeAction(badge.profile_badge_id!, {
                            is_visible: badge.is_visible === false,
                          }).then(refresh);
                        }
                      : undefined
                  }
                  onToggleFeatured={
                    badge.profile_badge_id
                      ? () => {
                          void updateProfileBadgeAction(badge.profile_badge_id!, {
                            is_featured: !badge.is_featured,
                          }).then(refresh);
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {profile && (
            <div className={cardClassName}>
              <h2 className="mb-3 text-sm font-medium text-white">Profile preview</h2>
              <ProfileHoverPreview
                displayName={profile.display_name || profile.username || "User"}
                username={profile.username ?? "user"}
                badges={publicPreview}
                styleOptions={badgeStyleOptions}
              />
              <div className="mt-4 border-t border-white/[0.06] pt-4">
                <p className="mb-2 text-[10px] uppercase tracking-wider text-neutral-600">Next to username</p>
                <BadgeRow badges={publicPreview} compact styleOptions={badgeStyleOptions} />
              </div>
            </div>
          )}

          <div className={cardClassName}>
            <h2 className="mb-3 text-sm font-medium text-white">Earned inventory</h2>
            <EarnedBadgeList earned={styledEarned} onUpdate={refresh} styleOptions={badgeStyleOptions} />
          </div>
        </div>
      </div>
    </>
  );
}

export function BadgesPageShell(props: React.ComponentProps<typeof BadgesEditor>) {
  return <BadgesEditor {...props} />;
}
