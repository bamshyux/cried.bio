"use client";

import type { AnalyticsSummary } from "@/lib/types/analytics";
import { cardClassName, PageHeader } from "@/components/dashboard/form-fields";

const CHART_HEIGHT = 112;

function formatShortDate(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function MiniBarChart({
  data,
  label,
  emptyHint,
}: {
  data: { date: string; count: number }[];
  label: string;
  emptyHint: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const peak = data.reduce((best, d) => (d.count > best.count ? d : best), data[0]);

  return (
    <div className={cardClassName}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-medium text-neutral-400">{label}</h3>
          <p className="mt-0.5 text-xs text-neutral-600">
            {total.toLocaleString()} in period · peak {peak.count.toLocaleString()} on{" "}
            {formatShortDate(peak.date)}
          </p>
        </div>
      </div>

      {total === 0 ? (
        <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-white/[0.06] bg-[#0a0a0a] px-4 text-center text-xs text-neutral-600">
          {emptyHint}
        </div>
      ) : (
        <>
          <div className="flex h-28 items-end gap-1">
            {data.map((d) => {
              const barHeight = d.count > 0 ? Math.max(Math.round((d.count / max) * CHART_HEIGHT), 4) : 0;
              return (
                <div
                  key={d.date}
                  className="group relative flex h-full flex-1 flex-col justify-end"
                  title={`${formatShortDate(d.date)}: ${d.count.toLocaleString()}`}
                >
                  <div
                    className="w-full rounded-sm bg-[#fafafa]/75 transition-all group-hover:bg-[#fafafa]"
                    style={{ height: `${barHeight}px` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-neutral-600">
            <span>{formatShortDate(data[0]?.date ?? "")}</span>
            <span>{formatShortDate(data[data.length - 1]?.date ?? "")}</span>
          </div>
        </>
      )}
    </div>
  );
}

function RankedList({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: { key: string; label: string; value: number }[];
}) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className={cardClassName}>
      <h3 className="mb-4 text-sm font-medium text-white">{title}</h3>
      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.key}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-neutral-300">{item.label}</span>
                <span className="shrink-0 font-medium tabular-nums text-white">{item.value.toLocaleString()}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-[#fafafa]/70"
                  style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 6 : 0)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-600">{emptyText}</p>
      )}
    </div>
  );
}

export function AnalyticsDashboard({ summary }: { summary: AnalyticsSummary }) {
  const daysWithViews = summary.dailyViews.filter((d) => d.count > 0).length;
  const avgViewsPerDay =
    daysWithViews > 0 ? summary.totalViews / daysWithViews : summary.totalViews / summary.dailyViews.length;
  const clickRate =
    summary.uniqueVisitors > 0
      ? ((summary.totalClicks / summary.uniqueVisitors) * 100).toFixed(1)
      : "0.0";

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Profile views, link clicks, and visitor countries from the last 30 days."
      />

      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className={cardClassName}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Unique visitors</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
              {summary.uniqueVisitors.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-neutral-500">{summary.totalViews.toLocaleString()} total views</p>
          </div>
          <div className={cardClassName}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Link clicks</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
              {summary.totalClicks.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-neutral-500">{clickRate}% click-through</p>
          </div>
          <div className={cardClassName}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Avg active days</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{avgViewsPerDay.toFixed(1)}</p>
            <p className="mt-1 text-xs text-neutral-500">views per day with traffic</p>
          </div>
          <div className={cardClassName}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Countries</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{summary.countries.length}</p>
            <p className="mt-1 text-xs text-neutral-500">from views &amp; clicks</p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <MiniBarChart
            data={summary.dailyViews}
            label="Daily views"
            emptyHint="No profile views in the last 30 days yet."
          />
          <MiniBarChart
            data={summary.dailyClicks}
            label="Daily clicks"
            emptyHint="No link clicks in the last 30 days yet."
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <RankedList
            title="Countries"
            emptyText="Country data will appear once visitors view your profile or click links."
            items={summary.countries.map((c) => ({
              key: c.country,
              label: c.country,
              value: c.count,
            }))}
          />
          <RankedList
            title="Top links"
            emptyText="No link clicks yet — clicks are tracked when visitors press your links."
            items={summary.topLinks.map((link) => ({
              key: link.linkId,
              label: link.title,
              value: link.clicks,
            }))}
          />
        </div>
      </div>
    </>
  );
}

export function AnalyticsPageShell({ summary }: { summary: AnalyticsSummary }) {
  return <AnalyticsDashboard summary={summary} />;
}
