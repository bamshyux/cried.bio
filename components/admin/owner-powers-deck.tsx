"use client";

import { useActionState, type ReactNode } from "react";
import {
  ownerBadgeDropAction,
  ownerCacheNukeAction,
  ownerCrownDropAction,
  ownerFlexBannerAction,
  ownerHypePingAction,
  ownerPremiumRevokeAction,
  ownerProfileXrayAction,
  ownerRouletteAction,
  ownerShockwaveAction,
  ownerSleepModeAction,
  ownerSpotlightAction,
} from "@/app/actions/owner-tools";
import { AdminBadge, AdminSection, AdminStatCard } from "@/components/admin/admin-ui";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  FormFeedback,
  inputClassName,
} from "@/components/dashboard/form-fields";
import type { AdminFormState, PlatformStats } from "@/lib/types/admin";

const initial: AdminFormState = {};

function PowerCard({
  emoji,
  title,
  description,
  children,
  accent = "violet",
}: {
  emoji: string;
  title: string;
  description: string;
  children: ReactNode;
  accent?: "violet" | "amber" | "cyan" | "rose" | "emerald";
}) {
  const accents = {
    violet: "from-violet-500/15 to-fuchsia-500/5 border-violet-400/20",
    amber: "from-amber-500/15 to-orange-500/5 border-amber-400/20",
    cyan: "from-cyan-500/15 to-blue-500/5 border-cyan-400/20",
    rose: "from-rose-500/15 to-pink-500/5 border-rose-400/20",
    emerald: "from-emerald-500/15 to-teal-500/5 border-emerald-400/20",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${accents[accent]}`}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/[0.04] blur-2xl" />
      <div className="relative">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="text-2xl leading-none" aria-hidden>{emoji}</span>
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function PowerForm({
  action,
  children,
  submitLabel,
  pendingLabel,
}: {
  action: (_prev: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  children: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-3">
      {children}
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending} className={buttonPrimaryClassName}>
          {pending ? pendingLabel ?? "Working..." : submitLabel}
        </button>
        <FormFeedback error={state.error} success={state.success} />
      </div>
    </form>
  );
}

export function OwnerPowersDeck({ stats }: { stats: PlatformStats | null }) {
  const [rouletteState, rouletteAction, roulettePending] = useActionState(ownerRouletteAction, initial);
  const [nukeState, nukeAction, nukePending] = useActionState(ownerCacheNukeAction, initial);
  const [sleepOnState, sleepOnAction, sleepOnPending] = useActionState(ownerSleepModeAction, initial);
  const [sleepOffState, sleepOffAction, sleepOffPending] = useActionState(ownerSleepModeAction, initial);

  return (
    <>
      <AdminSection title="Owner Powers">
        <div className="flex flex-wrap items-center gap-2">
          <AdminBadge tone="purple">Owner only</AdminBadge>
          <AdminBadge tone="amber">God-tier</AdminBadge>
          <p className="text-sm text-neutral-500">
            Exclusive controls for the cried.bio owner. Everything is audit-logged.
          </p>
        </div>

        {stats ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label="Live users" value={stats.total_users} hint="Platform total" />
            <AdminStatCard label="Active today" value={stats.active_users_today} hint="Pulse check" />
            <AdminStatCard label="Views" value={stats.total_profile_views.toLocaleString()} hint="All time" />
            <AdminStatCard label="Badges out" value={stats.total_badges_granted} hint="Granted total" />
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <PowerCard emoji="👑" title="Crown Drop" description="Instant lifetime Premium Lite." accent="amber">
            <PowerForm action={ownerCrownDropAction} submitLabel="Drop crown">
              <input name="username" required placeholder="username" className={inputClassName} autoComplete="off" />
            </PowerForm>
          </PowerCard>

          <PowerCard emoji="💎" title="Badge Injector" description="Slap any badge on a profile." accent="violet">
            <PowerForm action={ownerBadgeDropAction} submitLabel="Inject badge">
              <div className="grid gap-2 sm:grid-cols-2">
                <input name="username" required placeholder="username" className={inputClassName} autoComplete="off" />
                <input name="badge_slug" required placeholder="badge slug (og, verified…)" className={inputClassName} />
              </div>
            </PowerForm>
          </PowerCard>

          <PowerCard emoji="📡" title="Hype Ping" description="DM-style notification from the owner." accent="cyan">
            <PowerForm action={ownerHypePingAction} submitLabel="Send ping">
              <input name="username" required placeholder="username" className={inputClassName} autoComplete="off" />
              <textarea name="message" required rows={2} placeholder="You're goated. Keep building." className={inputClassName} />
            </PowerForm>
          </PowerCard>

          <PowerCard emoji="🚀" title="Spotlight Cannon" description="Landing feature + view boost." accent="rose">
            <PowerForm action={ownerSpotlightAction} submitLabel="Fire spotlight">
              <div className="grid gap-2 sm:grid-cols-2">
                <input name="username" required placeholder="username" className={inputClassName} autoComplete="off" />
                <input name="views" type="number" min={100} max={50000} defaultValue={2500} placeholder="views" className={inputClassName} />
              </div>
            </PowerForm>
          </PowerCard>

          <PowerCard emoji="🔮" title="Profile X-Ray" description="Instant dossier on any user." accent="violet">
            <PowerForm action={ownerProfileXrayAction} submitLabel="Scan profile">
              <input name="username" required placeholder="username" className={inputClassName} autoComplete="off" />
            </PowerForm>
          </PowerCard>

          <PowerCard emoji="🪓" title="Premium Revoke" description="Strip premium in one click." accent="rose">
            <PowerForm action={ownerPremiumRevokeAction} submitLabel="Revoke premium">
              <input name="username" required placeholder="username" className={inputClassName} autoComplete="off" />
            </PowerForm>
          </PowerCard>

          <PowerCard emoji="📢" title="Shockwave" description="Broadcast to every dashboard." accent="amber">
            <PowerForm action={ownerShockwaveAction} submitLabel="Send shockwave">
              <input name="title" required placeholder="Title" className={inputClassName} />
              <textarea name="body" rows={2} placeholder="Optional body" className={inputClassName} />
            </PowerForm>
          </PowerCard>

          <PowerCard emoji="⚡" title="Flex Banner" description="One-click global banner presets." accent="cyan">
            <div className="flex flex-wrap gap-2">
              {[
                { preset: "owner_online", label: "Owner online" },
                { preset: "hype", label: "Hype mode" },
                { preset: "party", label: "Party mode" },
                { preset: "maintenance", label: "Maint warning" },
                { preset: "clear", label: "Clear" },
              ].map((item) => (
                <FlexBannerButton key={item.preset} preset={item.preset} label={item.label} />
              ))}
            </div>
          </PowerCard>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-sm font-medium text-white">🎲 Profile Roulette</p>
            <p className="mt-1 text-xs text-neutral-500">Random published profile. For discovery & chaos.</p>
            <form action={rouletteAction} className="mt-3">
              <button type="submit" disabled={roulettePending} className={buttonSecondaryClassName}>
                {roulettePending ? "Spinning..." : "Spin the wheel"}
              </button>
              <FormFeedback error={rouletteState.error} success={rouletteState.success} />
            </form>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-sm font-medium text-white">🧨 Cache Nuke</p>
            <p className="mt-1 text-xs text-neutral-500">Revalidate sitewide paths when something looks stale.</p>
            <form action={nukeAction} className="mt-3">
              <button type="submit" disabled={nukePending} className={buttonSecondaryClassName}>
                {nukePending ? "Nuking..." : "Nuke cache"}
              </button>
              <FormFeedback error={nukeState.error} success={nukeState.success} />
            </form>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-sm font-medium text-white">🌙 Sleep Mode</p>
            <p className="mt-1 text-xs text-neutral-500">Toggle maintenance + banner in one shot.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <form action={sleepOnAction}>
                <input type="hidden" name="enable" value="true" />
                <button type="submit" disabled={sleepOnPending} className={buttonSecondaryClassName}>
                  Sleep ON
                </button>
              </form>
              <form action={sleepOffAction}>
                <input type="hidden" name="enable" value="false" />
                <button type="submit" disabled={sleepOffPending} className={buttonSecondaryClassName}>
                  Wake UP
                </button>
              </form>
            </div>
            <FormFeedback
              error={sleepOnState.error ?? sleepOffState.error}
              success={sleepOnState.success ?? sleepOffState.success}
            />
          </div>
        </div>
      </AdminSection>
    </>
  );
}

function FlexBannerButton({ preset, label }: { preset: string; label: string }) {
  const [state, action, pending] = useActionState(ownerFlexBannerAction, initial);

  return (
    <form action={action} className="inline">
      <input type="hidden" name="preset" value={preset} />
      <button type="submit" disabled={pending} className={buttonSecondaryClassName}>
        {pending ? "..." : label}
      </button>
      {state.success || state.error ? (
        <p className={`mt-2 text-xs ${state.error ? "text-red-400" : "text-emerald-400"}`}>
          {state.error ?? state.success}
        </p>
      ) : null}
    </form>
  );
}
