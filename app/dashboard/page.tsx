import { redirect } from "next/navigation";
import Link from "next/link";
import { syncMilestoneBadges } from "@/app/actions/badges";
import { DashboardSearchHint } from "@/components/dashboard/dashboard-search";
import {
  IconAnalytics,
  IconCustomize,
  IconLinks,
  IconProfile,
} from "@/components/icons/dashboard-icons";
import { DASHBOARD_SECTIONS } from "@/lib/dashboard/navigation";
import { getTotalAnalytics } from "@/lib/data/analytics";
import { getLinksByProfileId } from "@/lib/data/links";
import { getProfileByUserId } from "@/lib/data/profiles";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { formatProfileUid } from "@/lib/profile";
import { SITE_HOST } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

const QUICK_ACTIONS = [
  { href: "/dashboard/profile", label: "Edit profile", Icon: IconProfile },
  { href: "/dashboard/customize", label: "Customize profile", Icon: IconCustomize },
  { href: "/dashboard/links", label: "Manage links", Icon: IconLinks },
  { href: "/dashboard/analytics", label: "View analytics", Icon: IconAnalytics },
];

export default async function DashboardOverviewPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;

  await syncMilestoneBadges(userId);

  const profile = await getProfileByUserId(userId);
  const links = await getLinksByProfileId(userId);
  const settings = await getSettingsByProfileId(userId);
  const analytics = await getTotalAnalytics(userId);

  const isLive = !!profile?.username;
  const displayName = profile?.display_name || profile?.username || "there";

  const statCards = [
    { label: "Views", value: analytics.totalViews.toLocaleString() },
    { label: "Visitors", value: analytics.uniqueVisitors.toLocaleString() },
    { label: "Clicks", value: analytics.totalClicks.toLocaleString() },
    { label: "Links", value: String(links.length) },
  ];

  const hubSections = DASHBOARD_SECTIONS.filter((s) => s.id !== "overview");

  return (
    <div className="space-y-12">
      <div className="bf-dash-hero relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111] p-8 sm:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,rgba(255,255,255,0.06),transparent_55%)]" />
        <div className="relative space-y-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Overview</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Hey, {displayName}
            </h1>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-neutral-500">
              {isLive
                ? "Your page is live. Jump in below or search for any setting."
                : "Finish your profile and publish when you're ready."}
            </p>
            {isLive ? (
              <p className="mt-4 font-mono text-sm text-neutral-600">
                {SITE_HOST}/{profile!.username}
                {profile?.uid != null ? (
                  <span className="ml-3 text-neutral-700">· {formatProfileUid(profile.uid)}</span>
                ) : null}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="inline-flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-4 py-3 text-sm font-medium text-white transition-all hover:border-white/[0.14] hover:bg-[#141414]"
              >
                <action.Icon size={16} className="text-neutral-400" />
                {action.label}
              </Link>
            ))}
          </div>

          <DashboardSearchHint />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/[0.06] bg-[#111] p-6"
          >
            <p className="text-sm text-neutral-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-6 text-lg font-semibold text-white">Explore your dashboard</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {hubSections.map((section) => (
            <Link
              key={section.id}
              href={section.href}
              className="bf-dash-hub-card group flex flex-col rounded-2xl border border-white/[0.06] bg-[#111] p-6 transition-all hover:border-white/[0.12] hover:bg-[#161616]"
            >
              <span className="inline-flex w-fit rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-3 text-neutral-400 transition-colors group-hover:text-white">
                <section.Icon size={24} />
              </span>
              <p className="mt-5 text-lg font-medium text-white">{section.label}</p>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-500">{section.description}</p>
              <p className="mt-4 text-xs font-medium text-neutral-600 group-hover:text-neutral-400">
                {section.items.length} tools →
              </p>
            </Link>
          ))}
        </div>
      </div>

      {isLive ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#111] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">Current layout</p>
              <p className="mt-1 capitalize text-neutral-500">{settings.layout}</p>
            </div>
            <Link
              href={`/${profile!.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:border-white/[0.14] hover:text-white"
            >
              View live page
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
