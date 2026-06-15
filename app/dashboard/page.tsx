import { redirect } from "next/navigation";
import Link from "next/link";
import { syncMilestoneBadges } from "@/app/actions/badges";
import { getTotalAnalytics } from "@/lib/data/analytics";
import { getLinksByProfileId } from "@/lib/data/links";
import { getProfileByUserId } from "@/lib/data/profiles";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { formatProfileUid } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { cardClassName, PageHeader } from "@/components/dashboard/form-fields";

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

  const stats = [
    {
      label: "UID",
      value: profile?.uid != null ? formatProfileUid(profile.uid) : "—",
      sub: profile?.uid != null ? "Your account number" : "Run v6_profile_uid.sql",
    },
    { label: "Status", value: profile?.username ? "Live" : "Draft", sub: profile?.username ? `/${profile.username}` : "Set username" },
    { label: "Unique visitors", value: analytics.uniqueVisitors.toLocaleString(), sub: `${analytics.totalViews} total views` },
    { label: "Link clicks", value: analytics.totalClicks.toLocaleString(), sub: `${links.length} links` },
    { label: "Layout", value: settings.layout, sub: "Active theme" },
  ];

  const shortcuts = [
    { href: "/dashboard/customize", title: "Customize", desc: "Colors, fonts, card styling" },
    { href: "/dashboard/background", title: "Background", desc: "Gradients, video, particles" },
    { href: "/dashboard/links", title: "Links", desc: "Drag, drop, animate" },
    { href: "/dashboard/effects", title: "Effects", desc: "Cursor, username, bio" },
    { href: "/dashboard/analytics", title: "Analytics", desc: "Views, clicks, countries" },
  ];

  return (
    <div>
      <PageHeader title="Overview" description={`Welcome back${profile?.display_name ? `, ${profile.display_name}` : ""}.`} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className={cardClassName}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold capitalize text-white">{s.value}</p>
            <p className="mt-1 text-xs text-neutral-500">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${cardClassName} transition-colors hover:border-[#fafafa]/20 hover:bg-[#161616]`}
          >
            <p className="text-sm font-medium text-white">{item.title}</p>
            <p className="mt-1 text-xs text-neutral-500">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
