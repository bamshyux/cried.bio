import { createHash } from "crypto";

/** Client IP from reverse proxy headers (Vercel, Cloudflare, etc.) */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    headers.get("x-vercel-forwarded-for") ??
    "unknown"
  );
}

/** One profile view identity per device + IP (stored in analytics_events.visitor_hash). */
export function buildProfileViewHash(headers: Headers, deviceId: string): string {
  const ip = getClientIp(headers);
  const raw = `${ip}:${deviceId}`.slice(0, 256);
  return createHash("sha256").update(raw).digest("hex").slice(0, 64);
}
