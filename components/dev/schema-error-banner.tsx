import {
  DATABASE_UNAVAILABLE_USER_MESSAGE,
  looksLikeHtml,
} from "@/lib/db/errors";
import { getMigrationFilesForMissing } from "@/lib/db/schema";

function userFacingSchemaMessage(message: string) {
  if (!message || looksLikeHtml(message) || message.length > 400) {
    return "The profile_settings database schema is missing expected columns.";
  }
  return message;
}

export function SchemaErrorBanner({
  message,
  missing,
}: {
  message: string;
  missing: string[];
}) {
  const migrations = getMigrationFilesForMissing(missing);

  return (
    <div
      role="alert"
      className="relative z-[100] border-b border-red-500/30 bg-red-950 px-4 py-3 text-sm text-red-100"
    >
      <p className="font-semibold text-red-50">cried.bio database schema error</p>
      <p className="mt-1 text-red-200/90">{userFacingSchemaMessage(message)}</p>
      {missing.length > 0 && missing.length <= 20 && (
        <p className="mt-2 font-mono text-xs text-red-300/80">
          Missing: {missing.join(", ")}
        </p>
      )}
      {missing.length > 20 && (
        <p className="mt-2 font-mono text-xs text-red-300/80">
          Missing {missing.length} expected profile_settings columns.
        </p>
      )}
      {migrations.length > 0 && (
        <p className="mt-2 text-xs text-red-300/70">
          Run in Supabase SQL Editor{migrations.length > 1 ? " (in order)" : ""}:{" "}
          <code className="font-mono">{migrations.join(" → ")}</code>, then restart the dev server.
        </p>
      )}
    </div>
  );
}

export function DatabaseUnavailableBanner() {
  return (
    <div
      role="status"
      className="relative z-[100] border-b border-amber-500/25 bg-amber-950/90 px-4 py-3 text-sm text-amber-100"
    >
      <p>{DATABASE_UNAVAILABLE_USER_MESSAGE}</p>
    </div>
  );
}
