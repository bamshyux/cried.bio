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
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const segments = normalized.split("/").filter(Boolean);

  if (segments.length === 0 || segments.length > 2) {
    return false;
  }

  const username = segments[0].toLowerCase();
  if (!username || RESERVED_USERNAMES.has(username)) {
    return false;
  }

  if (!USERNAME_REGEX.test(username)) {
    return false;
  }

  if (segments.length === 2) {
    const subpage = segments[1].toLowerCase();
    return subpage === "followers" || subpage === "following";
  }

  return true;
}

export function formatProfileUid(uid: number) {
  return `UID #${uid.toLocaleString("en-US")}`;
}
