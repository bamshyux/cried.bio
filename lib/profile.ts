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
  if (!pathname.startsWith("/") || pathname.includes("/", 1)) {
    return false;
  }

  const segment = pathname.slice(1);
  if (!segment || RESERVED_USERNAMES.has(segment.toLowerCase())) {
    return false;
  }

  return USERNAME_REGEX.test(segment.toLowerCase());
}

export function formatProfileUid(uid: number) {
  return `UID #${uid.toLocaleString("en-US")}`;
}
