/**
 * Diagnose password reset delivery. Run: node scripts/test-password-reset.mjs you@example.com
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/test-password-reset.mjs you@example.com");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const service =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  process.env.SUPABASE_SECRET_KEY?.trim();
const resendKey = process.env.RESEND_API_KEY?.trim();
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cried.bio";

console.log("\n--- Password reset diagnostics ---");
console.log("Email:", email);
console.log("Site URL:", siteUrl);
console.log("SUPABASE_URL:", url ? "ok" : "MISSING");
console.log("ANON_KEY:", anon ? "ok" : "MISSING");
console.log("SERVICE_ROLE:", service ? "ok" : "MISSING");
console.log("RESEND_API_KEY:", resendKey ? "ok" : "MISSING");

const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`;

if (url && anon) {
  const supabase = createClient(url, anon);
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  console.log("\nSupabase resetPasswordForEmail:", error ? `FAIL — ${error.message}` : "OK (no error returned)");
}

if (url && service) {
  const admin = createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });
  console.log(
    "Admin generateLink:",
    error ? `FAIL — ${error.message}` : `OK — token ${data.properties?.hashed_token ? "yes" : "no"}`,
  );
}

if (resendKey) {
  const resend = new Resend(resendKey);
  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "cried.bio password reset test",
    text: "If you received this, Resend API works.",
  });
  console.log("Resend API test:", error ? `FAIL — ${error.message}` : `OK — id ${data?.id ?? "?"}`);
}

console.log("\nDone.\n");
