"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { rangeClassName, rangeFillStyle } from "@/lib/ui/range";

export const inputClassName = "bf-input";
export const labelClassName = "mb-1.5 block text-[13px] font-medium text-neutral-400";
export const cardClassName = "bf-card p-6 sm:p-8";
export const dashboardStackClassName = "space-y-6";
export const buttonPrimaryClassName = "bf-btn-primary disabled:cursor-not-allowed";
export const buttonSecondaryClassName = "bf-btn-secondary";
export { rangeClassName, rangeFillStyle } from "@/lib/ui/range";

export function RemoveMediaButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-xs font-medium text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
    >
      {label}
    </button>
  );
}

export function ToggleField({
  name,
  label,
  description,
  defaultChecked,
  checked,
  onCheckedChange,
}: {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
  /** When set, the toggle is fully controlled by the parent (preferred for settings forms). */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
  const isControlled = checked !== undefined;
  const resolvedChecked = isControlled ? checked : internalChecked;

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/[0.06] bg-[#0f0f0f] p-4 transition-colors hover:border-white/10">
      {!isControlled ? <input type="hidden" name={name} value={resolvedChecked ? "true" : "false"} /> : null}
      <input
        type="checkbox"
        checked={resolvedChecked}
        onChange={(e) => {
          const next = e.target.checked;
          if (!isControlled) setInternalChecked(next);
          onCheckedChange?.(next);
        }}
        className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#090909] accent-[#fafafa]"
      />
      <span>
        <span className="block text-sm font-medium text-neutral-100">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-neutral-500">{description}</span>
        )}
      </span>
    </label>
  );
}

export function SliderField({
  name,
  label,
  min,
  max,
  defaultValue,
  value,
  onChange,
  unit = "",
}: {
  name: string;
  label: string;
  min: number;
  max: number;
  defaultValue?: number;
  value?: number;
  onChange?: (value: number) => void;
  unit?: string;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? min);
  const isControlled = value !== undefined;
  const resolvedValue = isControlled ? value : internalValue;

  return (
    <div className="bf-range-wrap">
      <label htmlFor={name} className={labelClassName}>
        {label}: <span className="text-[var(--bf-accent)]">{resolvedValue}{unit}</span>
      </label>
      <input
        id={name}
        name={isControlled ? undefined : name}
        type="range"
        min={min}
        max={max}
        value={resolvedValue}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (!isControlled) setInternalValue(next);
          onChange?.(next);
        }}
        className={rangeClassName}
        style={rangeFillStyle(resolvedValue, min, max)}
      />
    </div>
  );
}

export function ColorField({
  name,
  label,
  defaultValue,
  value,
  onChange,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const fallback = defaultValue ?? value ?? "#fafafa";
  const hex = (value ?? fallback).startsWith("#") ? (value ?? fallback) : "#fafafa";
  const isControlled = value !== undefined;

  return (
    <div>
      <label htmlFor={name} className={labelClassName}>{label}</label>
      <input
        id={name}
        name={isControlled ? undefined : name}
        type="color"
        value={isControlled ? hex : undefined}
        defaultValue={isControlled ? undefined : hex}
        onChange={isControlled ? (e) => onChange?.(e.target.value) : undefined}
        className="h-10 w-full cursor-pointer rounded-lg border border-white/[0.06] bg-[#090909]"
      />
    </div>
  );
}

export function SelectField({
  name,
  label,
  defaultValue,
  value,
  onChange,
  options,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const isControlled = value !== undefined;

  return (
    <div>
      <label htmlFor={name} className={labelClassName}>{label}</label>
      <select
        id={name}
        name={isControlled ? undefined : name}
        value={isControlled ? value : undefined}
        defaultValue={isControlled ? undefined : defaultValue}
        onChange={isControlled ? (e) => onChange?.(e.target.value) : undefined}
        className={inputClassName}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#141414]">{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function FormFeedback({ error, success }: { error?: string; success?: string }) {
  return (
    <>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">{success}</p>}
    </>
  );
}

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="bf-dash-page-header mb-10">
      <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
      <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-neutral-500">{description}</p>
    </div>
  );
}

export function CollapsibleSection({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0c]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
        aria-expanded={open}
      >
        <span>
          <span className="block text-sm font-medium text-white">{title}</span>
          {description ? (
            <span className="mt-0.5 block text-xs text-neutral-500">{description}</span>
          ) : null}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 12 12"
          fill="none"
          className={`shrink-0 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
      </button>
      {open ? <div className="border-t border-white/[0.06] p-5">{children}</div> : null}
    </div>
  );
}
