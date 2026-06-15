const VISITOR_KEY = "bf_visitor_id";
const SESSION_KEY = "bf_session_id";

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

/** Composite fingerprint: persistent visitor + session scope */
export function getTrackingId(): string {
  return `${getVisitorId()}:${getSessionId()}`;
}
