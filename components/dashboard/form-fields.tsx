"use client";

import { useState } from "react";
import { rangeClassName, rangeFillStyle } from "@/lib/ui/range";

export const inputClassName = "bf-input";
export const labelClassName = "mb-1.5 block text-[13px] font-medium text-neutral-400";
export const cardClassName = "bf-card p-6";
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
  onCheckedChange,
}: {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  const [checked, setChecked] = useState(defaultChecked ?? false);

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/[0.06] bg-[#0f0f0f] p-4 transition-colors hover:border-white/10">
      <input type="hidden" name={name} value={checked ? "true" : "false"} />
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          setChecked(e.target.checked);
          onCheckedChange?.(e.target.checked);
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
  unit = "",
}: {
  name: string;
  label: string;
  min: number;
  max: number;
  defaultValue: number;
  unit?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="bf-range-wrap">
      <label htmlFor={name} className={labelClassName}>
        {label}: <span className="text-[var(--bf-accent)]">{value}{unit}</span>
      </label>
      <input
        id={name}
        name={name}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className={rangeClassName}
        style={rangeFillStyle(value, min, max)}
      />
    </div>
  );
}

export function ColorField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  const hex = defaultValue.startsWith("#") ? defaultValue : "#fafafa";

  return (
    <div>
      <label htmlFor={name} className={labelClassName}>{label}</label>
      <input
        id={name}
        name={name}
        type="color"
        defaultValue={hex}
        className="h-10 w-full cursor-pointer rounded-lg border border-white/[0.06] bg-[#090909]"
      />
    </div>
  );
}

export function SelectField({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClassName}>{label}</label>
      <select id={name} name={name} defaultValue={defaultValue} className={inputClassName}>
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
    <div className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
      <p className="mt-1.5 text-sm text-neutral-500">{description}</p>
    </div>
  );
}
