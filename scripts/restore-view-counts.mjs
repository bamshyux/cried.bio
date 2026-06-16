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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const { data: events, error: eventsError } = await sb
  .from("analytics_events")
  .select("profile_id")
  .eq("event_type", "profile_view");

if (eventsError) {
  console.error("Failed to load analytics events:", eventsError.message);
  process.exit(1);
}

const counts = new Map();
for (const row of events ?? []) {
  counts.set(row.profile_id, (counts.get(row.profile_id) ?? 0) + 1);
}

const { data: profiles, error: profilesError } = await sb
  .from("profiles")
  .select("id, username, uid, view_count")
  .not("username", "is", null);

if (profilesError) {
  console.error("Failed to load profiles:", profilesError.message);
  process.exit(1);
}

let updated = 0;
for (const profile of profiles ?? []) {
  const isBam = profile.username?.toLowerCase() === "bam" && profile.uid === 1;
  const target = isBam ? 8_675_309 : (counts.get(profile.id) ?? 0);

  if (!isBam && target === 0) continue;

  const patch = isBam
    ? { view_count: target, view_count_frozen: true }
    : { view_count: target };

  const { error } = await sb.from("profiles").update(patch).eq("id", profile.id);
  if (error) {
    if (error.message.includes("view_count_frozen")) {
      const { error: fallbackError } = await sb
        .from("profiles")
        .update({ view_count: target })
        .eq("id", profile.id);
      if (fallbackError) {
        console.error(`${profile.username}: ${fallbackError.message}`);
        continue;
      }
    } else if (error.message.includes("view_count")) {
      console.error(`${profile.username}: view_count column missing — run supabase/v56_restore_view_counts.sql`);
      process.exit(1);
    } else {
      console.error(`${profile.username}: ${error.message}`);
      continue;
    }
  }

  updated += 1;
  console.log(`${profile.username}: ${profile.view_count ?? "?"} -> ${target}`);
}

console.log(`Updated ${updated} profile(s).`);
