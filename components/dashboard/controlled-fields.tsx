"use client";

import { useEffect, useMemo, useState } from "react";

export type SelectOption = {
  value: string;
  label: string;
  group?: string;
};

export function ControlledSelect({
  label,
  value,
  onChange,
  options,
  name,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Optional — omit when the parent form submits via React state. */
  name?: string;
}) {
  const id = name ?? label.toLowerCase().replace(/\s+/g, "_");
  const groupedOptions = useMemo(() => {
    const hasGroups = options.some((option) => option.group);
    if (!hasGroups) return null;

    const groups = new Map<string, SelectOption[]>();
    for (const option of options) {
      const group = option.group ?? "Other";
      const list = groups.get(group) ?? [];
      list.push(option);
      groups.set(group, list);
    }
    return groups;
  }, [options]);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-neutral-400">
        {label}
      </label>
      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bf-input"
      >
        {groupedOptions
          ? Array.from(groupedOptions.entries()).map(([group, groupOptions]) => (
              <optgroup key={group} label={group}>
                {groupOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#141414]">
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))
          : options.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#141414]">
                {option.label}
              </option>
            ))}
      </select>
    </div>
  );
}

/** Sync local form state after server props change (other tabs), preserve on same-tab save */
export function useSettingsFormState<T extends Record<string, unknown>>(
  settings: { updated_at: string },
  extract: () => T,
) {
  const [form, setForm] = useState(extract);
  const [lastSynced, setLastSynced] = useState(settings.updated_at);

  useEffect(() => {
    if (settings.updated_at !== lastSynced) {
      setForm(extract());
      setLastSynced(settings.updated_at);
    }
  }, [settings.updated_at, lastSynced, extract]);

  return [form, setForm] as const;
}
