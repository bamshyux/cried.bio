import { getMigrationFilesForMissing } from "@/lib/db/schema";

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
      <p className="font-semibold text-red-50">BioForge database schema error</p>
      <p className="mt-1 text-red-200/90">{message}</p>
      {missing.length > 0 && (
        <p className="mt-2 font-mono text-xs text-red-300/80">
          Missing: {missing.join(", ")}
        </p>
      )}
      <p className="mt-2 text-xs text-red-300/70">
        Run in Supabase SQL Editor{migrations.length > 1 ? " (in order)" : ""}:{" "}
        <code className="font-mono">{migrations.join(" → ")}</code>, then restart the dev server.
      </p>
    </div>
  );
}
