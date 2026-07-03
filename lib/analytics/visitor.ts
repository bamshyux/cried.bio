const VISITOR_KEY = "bf_visitor_id";
const SESSION_KEY = "bf_session_id";
/** Per-profile flag so reopening the browser does not send duplicate view events. */
const VIEW_RECORD_PREFIX = "bf_profile_view:";

function readStorage(store: Storage, key: string): string | null {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(store: Storage, key: string, value: string): boolean {
  try {
    store.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function createVisitorId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getVisitorId(): string {
  if (typeof window === "undefined") return "";

  const fromLocal = readStorage(localStorage, VISITOR_KEY);
  if (fromLocal) return fromLocal;

  const fromSession = readStorage(sessionStorage, VISITOR_KEY);
  if (fromSession) {
    writeStorage(localStorage, VISITOR_KEY, fromSession);
    return fromSession;
  }

  const id = createVisitorId();
  writeStorage(localStorage, VISITOR_KEY, id);
  writeStorage(sessionStorage, VISITOR_KEY, id);
  return id;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  const existing = readStorage(sessionStorage, SESSION_KEY);
  if (existing) return existing;

  const id = createVisitorId();
  writeStorage(sessionStorage, SESSION_KEY, id);
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
  const key = `${VIEW_RECORD_PREFIX}${profileId}`;
  return readStorage(localStorage, key) === "1" || readStorage(sessionStorage, key) === "1";
}

export function markProfileViewRecorded(profileId: string): void {
  if (typeof window === "undefined") return;
  const key = `${VIEW_RECORD_PREFIX}${profileId}`;
  writeStorage(localStorage, key, "1");
  writeStorage(sessionStorage, key, "1");
}
