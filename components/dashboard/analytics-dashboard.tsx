"use client";

import type { AnalyticsSummary } from "@/lib/types/analytics";
import { cardClassName, PageHeader } from "@/components/dashboard/form-fields";

function MiniBarChart({
  data,
  label,
}: {
  data: { date: string; count: number }[];
  label: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className={cardClassName}>
      <h3 className="mb-4 text-[13px] font-medium text-neutral-400">{label}</h3>
      <div className="flex h-28 items-end gap-0.5">
        {data.map((d) => (
          <div key={d.date} className="group flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-sm bg-[#00e5cc]/80 transition-opacity group-hover:bg-[#00e5cc]"
              style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 4 : 0)}%` }}
              title={`${d.date}: ${d.count}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsDashboard({ summary }: { summary: AnalyticsSummary }) {
  return (
    <>
      <PageHeader title="Analytics" description="Unique visitors, views, clicks, and countries (last 30 days)." />
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className={cardClassName}>
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">Unique visitors</p>
            <p className="mt-2 text-3xl font-semibold text-white">{summary.uniqueVisitors}</p>
            <p className="mt-1 text-xs text-neutral-500">{summary.totalViews} total views</p>
          </div>
          <div className={cardClassName}>
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">Link clicks</p>
            <p className="mt-2 text-3xl font-semibold text-white">{summary.totalClicks}</p>
          </div>
          <div className={cardClassName}>
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">Avg views/day</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {(summary.totalViews / Math.max(summary.dailyViews.length, 1)).toFixed(1)}
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <MiniBarChart data={summary.dailyViews} label="Daily views" />
          <MiniBarChart data={summary.dailyClicks} label="Daily clicks" />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className={cardClassName}>
            <h3 className="mb-4 text-sm font-medium text-white">Countries</h3>
            {summary.countries.length > 0 ? (
              <ul className="space-y-2">
                {summary.countries.map((c) => (
                  <li key={c.country} className="flex justify-between text-sm">
                    <span className="text-neutral-400">{c.country}</span>
                    <span className="font-medium text-white">{c.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-600">No data yet.</p>
            )}
          </div>
          <div className={cardClassName}>
            <h3 className="mb-4 text-sm font-medium text-white">Top links</h3>
            {summary.topLinks.length > 0 ? (
              <ul className="space-y-2">
                {summary.topLinks.map((link) => (
                  <li key={link.linkId} className="flex justify-between text-sm">
                    <span className="truncate text-neutral-400">{link.title}</span>
                    <span className="ml-2 font-medium text-white">{link.clicks}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-600">No clicks yet.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function AnalyticsPageShell({ summary }: { summary: AnalyticsSummary }) {
  return <AnalyticsDashboard summary={summary} />;
}
