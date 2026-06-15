import { createClient } from "@/lib/supabase/server";
import { resolveCountry } from "@/lib/analytics/geo";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const VIEW_COOLDOWN_HOURS = 24;

export async function POST(request: Request) {
  let body: {
    profileId?: string;
    eventType?: string;
    linkId?: string;
    visitorHash?: string;
    sessionId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { profileId, eventType, linkId, visitorHash, sessionId } = body;

  if (!profileId || !eventType || !visitorHash) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (eventType !== "profile_view" && eventType !== "link_click") {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  const headersList = await headers();
  const country = await resolveCountry(headersList);
  const trackingHash = sessionId
    ? `${visitorHash}:${sessionId}`.slice(0, 128)
    : visitorHash.slice(0, 64);

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .not("username", "is", null)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (eventType === "link_click" && linkId) {
    const { data: link } = await supabase
      .from("links")
      .select("id")
      .eq("id", linkId)
      .eq("profile_id", profileId)
      .maybeSingle();

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }
  }

  // Dedupe profile views: one unique view per visitor per 24h
  if (eventType === "profile_view") {
    const since = new Date();
    since.setHours(since.getHours() - VIEW_COOLDOWN_HOURS);

    const { data: existing } = await supabase
      .from("analytics_events")
      .select("id")
      .eq("profile_id", profileId)
      .eq("event_type", "profile_view")
      .eq("visitor_hash", trackingHash)
      .gte("created_at", since.toISOString())
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, deduplicated: true });
    }
  }

  const { error } = await supabase.from("analytics_events").insert({
    profile_id: profileId,
    event_type: eventType,
    link_id: eventType === "link_click" ? linkId ?? null : null,
    visitor_hash: trackingHash,
    country: country.slice(0, 64),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (eventType === "profile_view") {
    const { syncViewMilestoneBadges } = await import("@/lib/badges/sync-milestones");
    await syncViewMilestoneBadges(profileId);
  }

  return NextResponse.json({ ok: true });
}
