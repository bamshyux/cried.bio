"use client";

import type { PremiumAnalyticsSummary } from "@/lib/types/analytics";
import { PremiumLocked } from "@/components/premium/premium-locked";
import { cardClassName } from "@/components/dashboard/form-fields";

function formatShortDate(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatGrowth(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function GrowthCard({
  label,
  current,
  changePct,
}: {
  label: string;
  current: number;
  changePct: number;
}) {
  const positive = changePct >= 0;
  return (
    <div className={cardClassName}>
      <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{current.toLocaleString()}</p>
      <p className={`mt-1 text-xs font-medium ${positive ? "text-emerald-400" : "text-red-400"}`}>
        {formatGrowth(changePct)} vs previous 7 days
      </p>
    </div>
  );
}

function HourlyHeatmap({ data }: { data: PremiumAnalyticsSummary["hourlyViews"] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className={cardClassName}>
      <h3 className="text-sm font-medium text-white">Traffic by hour</h3>
      <p className="mt-1 text-xs text-neutral-500">When visitors view your profile (local time)</p>
      {total === 0 ? (
        <p className="mt-6 text-sm text-neutral-600">Hourly data will appear once you start getting views.</p>
      ) : (
        <div className="mt-5 grid grid-cols-12 gap-1 sm:grid-cols-24">
          {data.map((row) => {
            const intensity = row.count > 0 ? Math.max(0.18, row.count / max) : 0.06;
            return (
              <div key={row.hour} className="group flex flex-col items-center gap-1" title={`${row.label}: ${row.count}`}>
                <div
                  className="h-10 w-full rounded-sm bg-[#fafafa] transition-opacity group-hover:opacity-100"
                  style={{ opacity: intensity }}
                />
                {row.hour % 3 === 0 ? (
                  <span className="text-[9px] text-neutral-600">{row.hour === 0 ? "12a" : row.hour < 12 ? `${row.hour}a` : row.hour === 12 ? "12p" : `${row.hour - 12}p`}</span>
                ) : (
                  <span className="text-[9px] text-transparent">·</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WeekdayChart({ data }: { data: PremiumAnalyticsSummary["weekdayViews"] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className={cardClassName}>
      <h3 className="text-sm font-medium text-white">Traffic by weekday</h3>
      <p className="mt-1 text-xs text-neutral-500">Which days drive the most profile visits</p>
      {total === 0 ? (
        <p className="mt-6 text-sm text-neutral-600">Weekday trends appear after your first views.</p>
      ) : (
        <div className="mt-5 flex h-32 items-end gap-2">
          {data.map((row) => {
            const height = row.count > 0 ? Math.max(Math.round((row.count / max) * 100), 8) : 0;
            return (
              <div key={row.day} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-sm bg-[#fafafa]/75"
                  style={{ height: `${height}%`, minHeight: row.count > 0 ? "8px" : "0" }}
                  title={`${row.day}: ${row.count}`}
                />
                <span className="text-[10px] text-neutral-500">{row.day}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EngagementChart({ data }: { data: PremiumAnalyticsSummary["dailyEngagement"] }) {
  const recent = data.slice(-14);
  const max = Math.max(...recent.map((d) => Math.max(d.views, d.clicks)), 1);
  const hasData = recent.some((d) => d.views > 0 || d.clicks > 0);

  return (
    <div className={cardClassName}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-white">Engagement trend</h3>
          <p className="mt-1 text-xs text-neutral-500">Views vs link clicks over the last 14 days</p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-neutral-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#fafafa]/80" />
            Views
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#c9b896]" />
            Clicks
          </span>
        </div>
      </div>
      {!hasData ? (
        <p className="text-sm text-neutral-600">Engagement trends will chart here once traffic picks up.</p>
      ) : (
        <div className="flex h-36 items-end gap-1.5">
          {recent.map((row) => (
            <div key={row.date} className="group flex h-full flex-1 items-end justify-center gap-0.5">
              <div
                className="w-2 rounded-sm bg-[#fafafa]/75 group-hover:bg-[#fafafa]"
                style={{ height: `${Math.max((row.views / max) * 100, row.views > 0 ? 6 : 0)}%` }}
                title={`${formatShortDate(row.date)} views: ${row.views}`}
              />
              <div
                className="w-2 rounded-sm bg-[#c9b896]/80 group-hover:bg-[#c9b896]"
                style={{ height: `${Math.max((row.clicks / max) * 100, row.clicks > 0 ? 6 : 0)}%` }}
                title={`${formatShortDate(row.date)} clicks: ${row.clicks}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LinkPerformanceList({ items }: { items: PremiumAnalyticsSummary["linkPerformance"] }) {
  return (
    <div className={cardClassName}>
      <h3 className="mb-1 text-sm font-medium text-white">Link performance</h3>
      <p className="mb-4 text-xs text-neutral-500">Click share and volume per link</p>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-600">Link performance breakdown appears after visitors click your links.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.linkId}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-neutral-300">{item.title}</span>
                <span className="shrink-0 tabular-nums text-neutral-400">
                  {item.clicks.toLocaleString()} · {item.sharePct.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-[#c9b896]/75"
                  style={{ width: `${Math.max(item.sharePct, item.clicks > 0 ? 6 : 0)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PremiumAnalyticsSection({
  premium,
  allowed,
}: {
  premium: PremiumAnalyticsSummary;
  allowed: boolean;
}) {
  const content = (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={cardClassName}>
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Returning visitors</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
            {premium.returningVisitors.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-neutral-500">visited on multiple days</p>
        </div>
        <div className={cardClassName}>
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">New visitors</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{premium.newVisitors.toLocaleString()}</p>
          <p className="mt-1 text-xs text-neutral-500">single-day visitors</p>
        </div>
        <div className={cardClassName}>
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Active days</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{premium.activeDays.toLocaleString()}</p>
          <p className="mt-1 text-xs text-neutral-500">days with profile views</p>
        </div>
        <div className={cardClassName}>
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Peak hour</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{premium.peakHour.label}</p>
          <p className="mt-1 text-xs text-neutral-500">{premium.peakHour.count.toLocaleString()} views at peak</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <GrowthCard
          label="Views (7 days)"
          current={premium.growth.viewsLast7}
          changePct={premium.growth.viewsChangePct}
        />
        <GrowthCard
          label="Clicks (7 days)"
          current={premium.growth.clicksLast7}
          changePct={premium.growth.clicksChangePct}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <HourlyHeatmap data={premium.hourlyViews} />
        <WeekdayChart data={premium.weekdayViews} />
      </div>

      <EngagementChart data={premium.dailyEngagement} />

      <LinkPerformanceList items={premium.linkPerformance} />
    </div>
  );

  return (
    <section className="space-y-4 border-t border-white/[0.06] pt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-white">Advanced analytics</h2>
            <span className="rounded-full border border-[rgba(201,184,150,0.28)] bg-[rgba(201,184,150,0.08)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#d4c4a8]">
              Premium Lite
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Deeper insights into visitor behavior, timing, and link performance.
          </p>
        </div>
      </div>

      <PremiumLocked allowed={allowed} tierLabel="Premium Lite" lockMessage="Purchase Premium to unlock these insights" lockCta="Upgrade to Premium Lite">
        {content}
      </PremiumLocked>
    </section>
  );
}
