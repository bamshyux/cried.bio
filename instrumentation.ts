export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getProfileSettingsSchemaValidation } = await import("@/lib/db/validate-schema");
    const { summarizeDatabaseError } = await import("@/lib/db/errors");
    const result = await getProfileSettingsSchemaValidation();

    if (!result.ok && result.kind === "unavailable") {
      console.error(
        "[cried.bio] Database temporarily unavailable during schema validation:",
        summarizeDatabaseError(result.message),
      );
    } else if (!result.ok) {
      console.error("\n[cried.bio] Database schema validation failed:");
      console.error(result.message);
      if (result.missing.length > 0) {
        console.error(`Missing columns: ${result.missing.join(", ")}`);
      }
      console.error("\n");
    } else {
      console.log("[cried.bio] Database schema validation passed.");
    }
  }
}
