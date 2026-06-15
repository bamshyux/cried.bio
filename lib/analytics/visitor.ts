const VISITOR_KEY = "bf_visitor_id";
const SESSION_KEY = "bf_session_id";
const VIEW_RECORD_PREFIX = "bf_profile_view:";

export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Normalize stored visitor_hash for unique-visitor counts (handles legacy device:session rows). */
export function normalizeVisitorKey(storedHash: string): string {
  const colon = storedHash.indexOf(":");
  if (colon > 0 && colon < storedHash.length - 1) {
    const prefix = storedHash.slice(0, colon);
    if (/^[0-9a-f-]{36}$/i.test(prefix)) return prefix;
  }
  return storedHash;
}

export function hasRecordedProfileView(profileId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${VIEW_RECORD_PREFIX}${profileId}`) === "1";
}

export function markProfileViewRecorded(profileId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${VIEW_RECORD_PREFIX}${profileId}`, "1");
}
