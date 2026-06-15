export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getProfileSettingsSchemaValidation } = await import("@/lib/db/validate-schema");
    const result = await getProfileSettingsSchemaValidation();

    if (!result.ok) {
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
