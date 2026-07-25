"use client";

import type { ReactNode } from "react";

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description ? <p className="mt-1 text-sm text-neutral-500">{description}</p> : null}
      </div>
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0c] divide-y divide-white/[0.06]">
        {children}
      </div>
    </section>
  );
}

export function SettingRow({
  label,
  description,
  children,
  danger,
}: {
  label: string;
  description?: string;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1 sm:max-w-md">
        <p className={`text-sm font-medium ${danger ? "text-red-400" : "text-white"}`}>{label}</p>
        {description ? <p className="mt-1 text-xs leading-relaxed text-neutral-500">{description}</p> : null}
      </div>
      <div className="w-full shrink-0 sm:w-auto sm:min-w-[220px]">{children}</div>
    </div>
  );
}

export function SettingsNav({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  const items = [
    { id: "account", label: "Account" },
    { id: "security", label: "Security" },
    { id: "contact", label: "Contact" },
    { id: "privacy", label: "Privacy" },
    { id: "billing", label: "Billing & Purchases" },
    { id: "danger", label: "Danger Zone" },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
      {items.map((item) => {
        const isActive = active === item.id;
        const isDanger = item.id === "danger";
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors lg:w-full ${
              isActive
                ? isDanger
                  ? "bg-red-500/10 text-red-300"
                  : "bg-white/[0.08] text-white"
                : isDanger
                  ? "text-red-400/70 hover:bg-red-500/5 hover:text-red-300"
                  : "text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-300"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

export function StatusBadge({ enabled, label }: { enabled: boolean; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        enabled
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-white/10 bg-white/[0.04] text-neutral-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${enabled ? "bg-emerald-400" : "bg-neutral-500"}`} />
      {label ?? (enabled ? "Enabled" : "Disabled")}
    </span>
  );
}

export function InlineFormFeedback({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return (
    <p className={`text-xs ${error ? "text-red-400" : "text-neutral-400"}`}>
      {error ?? success}
    </p>
  );
}
