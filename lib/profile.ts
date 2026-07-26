const RESERVED_USERNAMES = new Set([
  "login",
  "signup",
  "dashboard",
  "auth",
  "api",
  "admin",
  "settings",
  "profile",
  "profiles",
  "help",
  "support",
  "terms",
  "privacy",
  "about",
  "pricing",
  "community",
  "accounts",
]);

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(username: string) {
  return USERNAME_REGEX.test(username) && !RESERVED_USERNAMES.has(username);
}

export function isPublicProfilePath(pathname: string) {
  return (
    isHomeProfilePath(pathname) ||
    isProfileSocialPath(pathname) ||
    isContentPagePath(pathname)
  );
}

export function isHomeProfilePath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const segments = normalized.split("/").filter(Boolean);

  if (segments.length !== 1) {
    return false;
  }

  const username = segments[0].toLowerCase();
  if (!username || RESERVED_USERNAMES.has(username)) {
    return false;
  }

  return USERNAME_REGEX.test(username);
}

export function isProfileSocialPath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const segments = normalized.split("/").filter(Boolean);

  if (segments.length !== 2) {
    return false;
  }

  const username = segments[0].toLowerCase();
  if (!username || RESERVED_USERNAMES.has(username) || !USERNAME_REGEX.test(username)) {
    return false;
  }

  const subpage = segments[1].toLowerCase();
  return subpage === "followers" || subpage === "following";
}

/** Premium content pages at /{username}/{slug} — not the home profile. */
export function isContentPagePath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const segments = normalized.split("/").filter(Boolean);

  if (segments.length !== 2) {
    return false;
  }

  const username = segments[0].toLowerCase();
  if (!username || RESERVED_USERNAMES.has(username) || !USERNAME_REGEX.test(username)) {
    return false;
  }

  const subpage = segments[1].toLowerCase();
  return subpage !== "followers" && subpage !== "following";
}

export function formatProfileUid(uid: number) {
  return `UID #${uid.toLocaleString("en-US")}`;
}

export type ProfileUidTier = "founder" | "og" | "early" | "default";

export function getProfileUidTier(uid: number): ProfileUidTier {
  if (uid === 1) return "founder";
  if (uid <= 50) return "og";
  if (uid <= 500) return "early";
  return "default";
}
