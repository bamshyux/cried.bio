import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const HUMAN_COOKIE_NAME = "bf_human_v";
export const HUMAN_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days
export const HUMAN_HOLD_MIN_MS = 1800;
export const HUMAN_HOLD_MAX_MS = 12000;
export const HUMAN_CHALLENGE_TTL_MS = 5 * 60 * 1000;

function getSecret(): string {
  return (
    process.env.HUMAN_VERIFICATION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "bf-dev-human-secret"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

export function createHumanChallenge(): { challenge: string; issuedAt: number } {
  const issuedAt = Date.now();
  const nonce = randomBytes(16).toString("hex");
  const payload = `${issuedAt}.${nonce}`;
  const challenge = `${payload}.${sign(payload)}`;
  return { challenge, issuedAt };
}

export function verifyHumanChallenge(challenge: string, holdDurationMs: number): boolean {
  const parts = challenge.split(".");
  if (parts.length !== 3) return false;

  const [issuedRaw, nonce, sig] = parts;
  const issuedAt = Number(issuedRaw);
  if (!Number.isFinite(issuedAt) || !nonce || !sig) return false;

  const payload = `${issuedRaw}.${nonce}`;
  if (!safeEqual(sign(payload), sig)) return false;

  const age = Date.now() - issuedAt;
  if (age < 0 || age > HUMAN_CHALLENGE_TTL_MS) return false;
  if (holdDurationMs < HUMAN_HOLD_MIN_MS || holdDurationMs > HUMAN_HOLD_MAX_MS) return false;

  return true;
}

export function createHumanCookieValue(): string {
  const issuedAt = Date.now();
  const payload = `${issuedAt}.${randomBytes(12).toString("hex")}`;
  return `${payload}.${sign(payload)}`;
}

export function parseHumanCookieValue(value: string | undefined | null): boolean {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;

  const [issuedRaw, nonce, sig] = parts;
  const issuedAt = Number(issuedRaw);
  if (!Number.isFinite(issuedAt) || !nonce || !sig) return false;

  const payload = `${issuedRaw}.${nonce}`;
  if (!safeEqual(sign(payload), sig)) return false;

  const age = Date.now() - issuedAt;
  if (age < 0 || age > HUMAN_COOKIE_MAX_AGE_SEC * 1000) return false;

  return true;
}

export async function isHumanVerified(): Promise<boolean> {
  const jar = await cookies();
  return parseHumanCookieValue(jar.get(HUMAN_COOKIE_NAME)?.value);
}

export const HUMAN_VERIFICATION_REQUIRED_MESSAGE =
  "Please complete human verification before continuing.";

export function isHumanVerificationRequired(error: string | null | undefined): boolean {
  return error === HUMAN_VERIFICATION_REQUIRED_MESSAGE;
}

export async function assertHumanVerified(): Promise<string | null> {
  if (await isHumanVerified()) return null;
  return HUMAN_VERIFICATION_REQUIRED_MESSAGE;
}

export function hashForRateLimit(value: string): string {
  return createHash("sha256").update(value.toLowerCase().trim()).digest("hex").slice(0, 24);
}

export async function verifyTurnstileToken(token: string, ip?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret || !token) return false;

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  if (ip) body.set("remoteip", ip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) return false;
  const data = (await response.json()) as { success?: boolean };
  return Boolean(data.success);
}

export function isTurnstileConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() &&
      process.env.TURNSTILE_SECRET_KEY?.trim(),
  );
}
