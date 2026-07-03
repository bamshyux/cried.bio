import { createHash } from "crypto";
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

function buildHash(deviceId) {
  return createHash("sha256").update(`127.0.0.1:${deviceId}`).digest("hex").slice(0, 64);
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });
const username = process.argv[2]?.trim() || "synnix";

const { data: profile, error } = await sb
  .from("profiles")
  .select("id, username, view_count, view_count_frozen")
  .ilike("username", username)
  .maybeSingle();

if (error || !profile) {
  console.error(error?.message || `Profile ${username} not found`);
  process.exit(1);
}

const before = Number(profile.view_count) || 0;
const deviceA = crypto.randomUUID();
const deviceB = crypto.randomUUID();
const hashA = buildHash(deviceA);
const hashB = buildHash(deviceB);

async function bumpCount() {
  const { data: row } = await sb
    .from("profiles")
    .select("view_count, view_count_frozen")
    .eq("id", profile.id)
    .single();
  if (row?.view_count_frozen) return;
  const next = (Number(row?.view_count) || 0) + 1;
  await sb.from("profiles").update({ view_count: next }).eq("id", profile.id);
}

async function record(hash) {
  const { count: existing } = await sb
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profile.id)
    .eq("event_type", "profile_view")
    .eq("visitor_hash", hash);

  if ((existing ?? 0) > 0) {
    return { ok: true, deduplicated: true };
  }

  const { data: inserted, error: insertError } = await sb
    .from("analytics_events")
    .insert({
      profile_id: profile.id,
      event_type: "profile_view",
      visitor_hash: hash,
      country: "Test",
    })
    .select("id")
    .maybeSingle();

  if (insertError?.code === "23505") {
    return { ok: true, deduplicated: true };
  }
  if (insertError) throw new Error(insertError.message);
  if (inserted) {
    await bumpCount();
    return { ok: true, recorded: true };
  }
  return { ok: true, deduplicated: true };
}

console.log(`Testing @${profile.username} (before: ${before} views)`);

const first = await record(hashA);
const duplicate = await record(hashA);
const second = await record(hashB);

const { data: afterProfile } = await sb
  .from("profiles")
  .select("view_count")
  .eq("id", profile.id)
  .single();

const after = Number(afterProfile?.view_count) || 0;
const delta = after - before;

console.log("first:", first);
console.log("duplicate:", duplicate);
console.log("second:", second);
console.log(`after: ${after} (delta: +${delta})`);

const ok =
  first?.recorded === true &&
  duplicate?.deduplicated === true &&
  second?.recorded === true &&
  delta === 2;

if (!ok) {
  console.error("View counting verification FAILED");
  process.exit(1);
}

console.log("View counting verification passed (+2 unique, duplicate ignored)");
