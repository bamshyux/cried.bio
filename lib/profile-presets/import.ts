import { normalizePresetBackgroundSettings } from "@/lib/profile-presets/background-settings";
import type { ProfilePresetData } from "@/lib/types/profile-preset";

export type ImportedPresetMeta = {
  name: string;
  createdBy: string | null;
  versionLabel: string;
};

export type ParsedImportPreset = {
  data: ProfilePresetData;
  meta: ImportedPresetMeta;
};

function parsePresetSettingsRecord(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

function parseVersionLabel(raw: unknown, payload: Record<string, unknown>): string {
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  if (payload.version === 1 || payload.version === "1") return "1.0";
  return "1.0";
}

function isPresetPayload(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && "settings" in value);
}

function extractPayload(raw: Record<string, unknown>): {
  payload: Record<string, unknown>;
  meta: Partial<ImportedPresetMeta>;
} | null {
  if (isPresetPayload(raw.preset)) {
    return {
      payload: raw.preset,
      meta: {
        name: pickString(raw.name, raw.presetName, raw.title),
        createdBy: pickString(raw.createdBy, raw.exportedBy, raw.author, raw.username),
        versionLabel: parseVersionLabel(raw.version, raw.preset),
      },
    };
  }

  if (isPresetPayload(raw.preset_data)) {
    return {
      payload: raw.preset_data,
      meta: {
        name: pickString(raw.name, raw.presetName, raw.title),
        createdBy: pickString(raw.createdBy, raw.exportedBy, raw.author, raw.username),
        versionLabel: parseVersionLabel(raw.version, raw.preset_data),
      },
    };
  }

  if (isPresetPayload(raw)) {
    return {
      payload: raw,
      meta: {
        name: pickString(raw.name, raw.presetName, raw.title),
        createdBy: pickString(raw.createdBy, raw.exportedBy, raw.author, raw.username),
        versionLabel: parseVersionLabel(raw.version, raw),
      },
    };
  }

  return null;
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export function parsePresetDataLenient(raw: unknown): ProfilePresetData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<ProfilePresetData> & Record<string, unknown>;

  if (data.version !== undefined && data.version !== 1 && Number(data.version) !== 1) {
    return null;
  }

  if (!data.settings || typeof data.settings !== "object") return null;

  const profile =
    data.profile && typeof data.profile === "object"
      ? (data.profile as Partial<ProfilePresetData["profile"]>)
      : {};

  return {
    version: 1,
    profile: {
      display_name: String(profile.display_name ?? ""),
      bio: String(profile.bio ?? ""),
      avatar_url: typeof profile.avatar_url === "string" ? profile.avatar_url : null,
      banner_url: typeof profile.banner_url === "string" ? profile.banner_url : null,
    },
    settings: normalizePresetBackgroundSettings(parsePresetSettingsRecord(data.settings)),
    links: Array.isArray(data.links) ? (data.links as ProfilePresetData["links"]) : [],
    embeds: Array.isArray(data.embeds) ? (data.embeds as ProfilePresetData["embeds"]) : [],
    featuredBlocks: Array.isArray(data.featuredBlocks)
      ? (data.featuredBlocks as ProfilePresetData["featuredBlocks"])
      : [],
    profileBadges: Array.isArray(data.profileBadges)
      ? (data.profileBadges as ProfilePresetData["profileBadges"])
      : [],
    discordWidget:
      data.discordWidget && typeof data.discordWidget === "object"
        ? (data.discordWidget as ProfilePresetData["discordWidget"])
        : null,
    customTheme:
      data.customTheme && typeof data.customTheme === "object"
        ? (data.customTheme as ProfilePresetData["customTheme"])
        : null,
    featuredLinkIndex: typeof data.featuredLinkIndex === "number" ? data.featuredLinkIndex : null,
  };
}

export function presetNameFromFilename(filename: string): string {
  const base = filename.replace(/\.json$/i, "").trim();
  if (!base) return "Imported Preset";

  const words = base
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

  return words.join(" ").slice(0, 60) || "Imported Preset";
}

export function resolveImportedPresetName(baseName: string, existingNames: string[]): string {
  const trimmed = baseName.trim().slice(0, 60) || "Imported Preset";
  const lower = new Set(existingNames.map((name) => name.trim().toLowerCase()));

  if (!lower.has(trimmed.toLowerCase())) return trimmed;

  const imported = `${trimmed} (Imported)`.slice(0, 60);
  if (!lower.has(imported.toLowerCase())) return imported;

  for (let index = 2; index < 100; index += 1) {
    const candidate = `${trimmed} (${index})`.slice(0, 60);
    if (!lower.has(candidate.toLowerCase())) return candidate;
  }

  return `${trimmed.slice(0, 48)} (${Date.now() % 10000})`.slice(0, 60);
}

export function parseImportedPresetFile(
  raw: unknown,
  fallbackName?: string,
): ParsedImportPreset | null {
  if (!raw || typeof raw !== "object") return null;

  const extracted = extractPayload(raw as Record<string, unknown>);
  if (!extracted) return null;

  const data = parsePresetDataLenient(extracted.payload);
  if (!data) return null;

  const name = (fallbackName?.trim() || extracted.meta.name || "Imported Preset").slice(0, 60);

  return {
    data,
    meta: {
      name,
      createdBy: extracted.meta.createdBy ?? null,
      versionLabel: extracted.meta.versionLabel ?? "1.0",
    },
  };
}

export function parseImportedPresetJson(
  json: string,
  fallbackName?: string,
): ParsedImportPreset | null {
  try {
    const parsed = JSON.parse(json) as unknown;
    return parseImportedPresetFile(parsed, fallbackName);
  } catch {
    return null;
  }
}
