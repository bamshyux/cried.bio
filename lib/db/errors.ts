export const DATABASE_UNAVAILABLE_USER_MESSAGE =
  "Database temporarily unavailable. Some profile features may not load.";

export const DATABASE_UNAVAILABLE_CODE = "DB_UNAVAILABLE";

export type DatabaseErrorKind = "unavailable" | "schema" | "other";

const CLOUDFLARE_STATUS = new Set([520, 521, 522, 523, 524, 525, 526, 527, 530]);
const UNAVAILABLE_STATUS = new Set([408, 500, 502, 503, 504, ...CLOUDFLARE_STATUS]);

const SCHEMA_CODES = new Set(["PGRST204", "PGRST205", "42703", "42P01"]);

export class DatabaseUnavailableError extends Error {
  readonly code = DATABASE_UNAVAILABLE_CODE;

  constructor(cause?: unknown) {
    super(DATABASE_UNAVAILABLE_USER_MESSAGE);
    this.name = "DatabaseUnavailableError";
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export function looksLikeHtml(value: string): boolean {
  const trimmed = value.trimStart();
  if (!trimmed) return false;
  return (
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<!doctype") ||
    trimmed.startsWith("<html") ||
    trimmed.startsWith("<HTML") ||
    trimmed.startsWith("<?xml") ||
    /<html[\s>]/i.test(trimmed.slice(0, 400))
  );
}

export function looksLikeJson(value: string): boolean {
  const trimmed = value.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function extractStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const record = error as Record<string, unknown>;
  for (const key of ["status", "statusCode", "status_code"]) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && /^\d{3}$/.test(value)) return Number(value);
  }
  return null;
}

function extractCode(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const record = error as Record<string, unknown>;
  return String(record.code ?? record.error ?? "");
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.error_description === "string") return record.error_description;
    if (typeof record.error === "string") return record.error;
  }
  return "";
}

function stripMarkup(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function summarizeDatabaseError(error: unknown, maxLength = 240): string {
  const status = extractStatus(error);
  const code = extractCode(error);
  const raw = extractErrorMessage(error) || String(error ?? "Unknown database error");
  const stripped = looksLikeHtml(raw) ? stripMarkup(raw) : raw.replace(/\s+/g, " ").trim();
  const preview = stripped.slice(0, maxLength);
  const parts = [
    status ? `status=${status}` : null,
    code ? `code=${code}` : null,
    preview || "no message",
  ].filter(Boolean);
  return parts.join(" ");
}

export function logDatabaseError(context: string, error: unknown) {
  console.error(`[cried.bio] ${context}:`, summarizeDatabaseError(error));
}

function isTimeoutOrNetworkMessage(message: string): boolean {
  return (
    /timed?\s*out/i.test(message) ||
    /timeout/i.test(message) ||
    /abort(?:ed|error)?/i.test(message) ||
    /failed to fetch/i.test(message) ||
    /fetch failed/i.test(message) ||
    /networkerror/i.test(message) ||
    /network request failed/i.test(message) ||
    /econnreset/i.test(message) ||
    /econnrefused/i.test(message) ||
    /enotfound/i.test(message) ||
    /etimedout/i.test(message) ||
    /eai_again/i.test(message) ||
    /socket hang up/i.test(message) ||
    /und_err_connect_timeout/i.test(message) ||
    /und_err_headers_timeout/i.test(message) ||
    /und_err_body_timeout/i.test(message) ||
    /unexpected token\s*</i.test(message) ||
    /is not valid json/i.test(message) ||
    /invalid json/i.test(message) ||
    /cloudflare/i.test(message) && /521|web server is down/i.test(message) ||
    /web server is down/i.test(message) ||
    /origin is unreachable/i.test(message) ||
    /connection timed out/i.test(message)
  );
}

export function isCloudflareStatus(status: number | null | undefined): boolean {
  return typeof status === "number" && CLOUDFLARE_STATUS.has(status);
}

export function isUnavailableStatus(status: number | null | undefined): boolean {
  return typeof status === "number" && UNAVAILABLE_STATUS.has(status);
}

export function isGenuineSchemaError(error: unknown): boolean {
  const code = extractCode(error);
  if (SCHEMA_CODES.has(code)) return true;

  const message = extractErrorMessage(error);
  if (!message || looksLikeHtml(message)) return false;

  return (
    /could not find the '[^']+' column/i.test(message) ||
    /could not find the table/i.test(message) ||
    /column [\w.]+ does not exist/i.test(message) ||
    /relation ["']?[\w.]+["']? does not exist/i.test(message) ||
    /schema cache/i.test(message)
  );
}

export function classifyDatabaseError(error: unknown): DatabaseErrorKind {
  if (!error) return "other";
  if (error instanceof DatabaseUnavailableError) return "unavailable";

  const code = extractCode(error);
  if (code === DATABASE_UNAVAILABLE_CODE) return "unavailable";

  const status = extractStatus(error);
  if (isUnavailableStatus(status) && !isGenuineSchemaError(error)) return "unavailable";

  const message = extractErrorMessage(error);
  if (looksLikeHtml(message) || isTimeoutOrNetworkMessage(message)) return "unavailable";

  const name = error instanceof Error ? error.name : "";
  if (name === "AbortError" || name === "TimeoutError") return "unavailable";

  if (isGenuineSchemaError(error)) return "schema";
  return "other";
}

export function isDatabaseUnavailableError(error: unknown): boolean {
  return classifyDatabaseError(error) === "unavailable";
}

export async function withDatabaseFallback<T>(
  context: string,
  fallback: T,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logDatabaseError(context, error);
    return fallback;
  }
}
