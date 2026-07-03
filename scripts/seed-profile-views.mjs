import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const raw = readFileSync(".env.local", "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const username = process.argv[2]?.trim();
const targetViews = Number(process.argv[3]);

if (!username || !Number.isFinite(targetViews) || targetViews < 0) {
  console.error("Usage: node scripts/seed-profile-views.mjs <username> <minViews>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const { data: profile, error: lookupError } = await sb
  .from("profiles")
  .select("id, username, uid, view_count, view_count_frozen")
  .ilike("username", username)
  .maybeSingle();

if (lookupError) {
  console.error("Lookup failed:", lookupError.message);
  process.exit(1);
}

if (!profile) {
  console.error(`Profile ${username} not found.`);
  process.exit(1);
}

const nextCount = Math.max(Number(profile.view_count) || 0, targetViews);

const { data: updated, error: updateError } = await sb
  .from("profiles")
  .update({
    view_count: nextCount,
    view_count_frozen: false,
  })
  .eq("id", profile.id)
  .select("username, uid, view_count, view_count_frozen")
  .single();

if (updateError) {
  console.error("Update failed:", updateError.message);
  process.exit(1);
}

console.log("Updated profile:");
console.log(JSON.stringify(updated, null, 2));
