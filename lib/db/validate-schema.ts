import {
  buildSchemaValidationMessage,
  getMigrationFilesForMissing,
  REQUIRED_PROFILE_SETTINGS_COLUMNS,
  type SchemaValidationResult,
} from "@/lib/db/schema";

export type { SchemaValidationResult };

export {
  REQUIRED_PROFILE_SETTINGS_COLUMNS,
  SCHEMA_MIGRATION_HINT,
  formatSchemaError,
  isSchemaCacheError,
  parseMissingColumn,
} from "@/lib/db/schema";

let validationPromise: Promise<SchemaValidationResult> | null = null;
let cachedMissing: string[] | null = null;

function isMissingColumnError(message: string) {
  return /could not find the/i.test(message) || /does not exist/i.test(message);
}

async function probeColumn(column: string): Promise<boolean> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_settings")
    .select(column)
    .limit(0);

  if (!error) return true;
  if (isMissingColumnError(error.message)) return false;
  throw new Error(error.message);
}

export async function validateProfileSettingsSchema(): Promise<SchemaValidationResult> {
  const missing: string[] = [];

  for (const column of REQUIRED_PROFILE_SETTINGS_COLUMNS) {
    try {
      const exists = await probeColumn(column);
      if (!exists) missing.push(column);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown schema validation error";
      cachedMissing = [...REQUIRED_PROFILE_SETTINGS_COLUMNS];
      return {
        ok: false,
        missing: cachedMissing,
        message: `Could not validate profile_settings schema: ${message}`,
      };
    }
  }

  cachedMissing = missing;

  if (missing.length === 0) {
    return { ok: true };
  }

  return {
    ok: false,
    missing,
    message: buildSchemaValidationMessage(missing),
  };
}

/** Cached validation — runs once per server process. */
export function getProfileSettingsSchemaValidation() {
  if (!validationPromise) {
    validationPromise = validateProfileSettingsSchema();
  }
  return validationPromise;
}

export async function getMissingProfileSettingsColumns(): Promise<string[]> {
  const result = await getProfileSettingsSchemaValidation();
  return result.ok ? [] : result.missing;
}

export async function profileSettingsSupportsColumn(column: string): Promise<boolean> {
  const missing = cachedMissing ?? (await getMissingProfileSettingsColumns());
  return !missing.includes(column);
}

export function resetSchemaValidationCache() {
  validationPromise = null;
  cachedMissing = null;
}

/** Strip keys for columns absent from the database. */
export async function omitUnsupportedSettingsColumns<T extends Record<string, unknown>>(
  patch: T,
): Promise<T> {
  const missing = await getMissingProfileSettingsColumns();
  if (missing.length === 0) return patch;

  const safe = { ...patch };
  for (const col of missing) {
    delete safe[col];
  }
  return safe;
}
