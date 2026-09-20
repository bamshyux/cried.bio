import {
  DATABASE_UNAVAILABLE_USER_MESSAGE,
  classifyDatabaseError,
  isDatabaseUnavailableError,
  isGenuineSchemaError,
  logDatabaseError,
} from "@/lib/db/errors";
import {
  buildSchemaValidationMessage,
  parseMissingColumn,
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

const UNAVAILABLE_RETRY_MS = 30_000;

let validationPromise: Promise<SchemaValidationResult> | null = null;
let cachedResult: SchemaValidationResult | null = null;
let unavailableUntil = 0;

function unavailableResult(): SchemaValidationResult {
  return {
    ok: false,
    kind: "unavailable",
    missing: [],
    message: DATABASE_UNAVAILABLE_USER_MESSAGE,
  };
}

function isMissingTableError(message: string) {
  return (
    /could not find the table/i.test(message) ||
    /relation ["']?public\.profile_settings["']? does not exist/i.test(message) ||
    /relation ["']?profile_settings["']? does not exist/i.test(message)
  );
}

async function probeColumns(columns: string[]) {
  const { createSchemaProbeClient } = await import("@/lib/supabase/schema-probe");
  const supabase = createSchemaProbeClient();
  const { error } = await supabase
    .from("profile_settings")
    .select(columns.join(","))
    .limit(0);

  if (!error) return { ok: true as const };

  const message = error.message ?? "";
  if (isDatabaseUnavailableError(error) || classifyDatabaseError(error) === "unavailable") {
    return { unavailable: true as const, error };
  }

  if (isMissingTableError(message)) {
    return { missingTable: true as const, error };
  }

  const missing = parseMissingColumn(message);
  if (missing) return { missingColumn: missing };

  if (isGenuineSchemaError(error)) {
    return { missingTable: true as const, error };
  }

  // Permission/RLS/auth JSON errors mean the table is reachable.
  return { ok: true as const };
}

export async function validateProfileSettingsSchema(): Promise<SchemaValidationResult> {
  const missing: string[] = [];
  let remaining: string[] = [...REQUIRED_PROFILE_SETTINGS_COLUMNS];

  try {
    while (remaining.length > 0) {
      const result = await probeColumns(remaining);

      if ("unavailable" in result && result.unavailable) {
        logDatabaseError("profile_settings schema probe", result.error);
        return unavailableResult();
      }

      if ("missingTable" in result && result.missingTable) {
        logDatabaseError("profile_settings schema probe", result.error);
        return {
          ok: false,
          kind: "schema",
          missing: [...REQUIRED_PROFILE_SETTINGS_COLUMNS],
          message: buildSchemaValidationMessage([...REQUIRED_PROFILE_SETTINGS_COLUMNS]),
        };
      }

      if ("missingColumn" in result && result.missingColumn) {
        if (!remaining.includes(result.missingColumn)) {
          logDatabaseError(
            "profile_settings schema probe",
            `Unexpected missing column "${result.missingColumn}"`,
          );
          return unavailableResult();
        }
        missing.push(result.missingColumn);
        remaining = remaining.filter((column) => column !== result.missingColumn);
        continue;
      }

      break;
    }
  } catch (err) {
    logDatabaseError("profile_settings schema probe", err);
    if (isGenuineSchemaError(err) && !isDatabaseUnavailableError(err)) {
      return {
        ok: false,
        kind: "schema",
        missing: [...REQUIRED_PROFILE_SETTINGS_COLUMNS],
        message: buildSchemaValidationMessage([...REQUIRED_PROFILE_SETTINGS_COLUMNS]),
      };
    }
    return unavailableResult();
  }

  cachedResult = missing.length === 0
    ? { ok: true }
    : {
        ok: false,
        kind: "schema",
        missing,
        message: buildSchemaValidationMessage(missing),
      };

  return cachedResult;
}

/** Cached validation — successful/schema results stay cached; outages retry after a short TTL. */
export function getProfileSettingsSchemaValidation() {
  if (cachedResult?.ok) {
    return Promise.resolve(cachedResult);
  }

  if (cachedResult && !cachedResult.ok && cachedResult.kind === "schema") {
    return Promise.resolve(cachedResult);
  }

  if (
    cachedResult &&
    !cachedResult.ok &&
    cachedResult.kind === "unavailable" &&
    Date.now() < unavailableUntil
  ) {
    return Promise.resolve(cachedResult);
  }

  if (
    cachedResult &&
    !cachedResult.ok &&
    cachedResult.kind === "unavailable" &&
    Date.now() >= unavailableUntil
  ) {
    cachedResult = null;
    validationPromise = null;
  }

  if (!validationPromise) {
    validationPromise = validateProfileSettingsSchema().then((result) => {
      cachedResult = result;
      if (!result.ok && result.kind === "unavailable") {
        unavailableUntil = Date.now() + UNAVAILABLE_RETRY_MS;
      }
      return result;
    });
  }

  return validationPromise;
}

export async function getMissingProfileSettingsColumns(): Promise<string[]> {
  const result = await getProfileSettingsSchemaValidation();
  if (result.ok || result.kind === "unavailable") return [];
  return result.missing;
}

export async function profileSettingsSupportsColumn(column: string): Promise<boolean> {
  const missing = cachedResult && !cachedResult.ok ? cachedResult.missing : await getMissingProfileSettingsColumns();
  return !missing.includes(column);
}

export function resetSchemaValidationCache() {
  validationPromise = null;
  cachedResult = null;
  unavailableUntil = 0;
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
