export const USERNAME_CHANGE_COOLDOWN_DAYS = 7;
export const USERNAME_CHANGE_COOLDOWN_MS =
  USERNAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export type UsernameChangeCooldownInfo = {
  canChange: boolean;
  nextChangeAt: string | null;
};

export function getUsernameChangeCooldown(
  usernameChangedAt: string | null | undefined,
): UsernameChangeCooldownInfo {
  if (!usernameChangedAt) {
    return { canChange: true, nextChangeAt: null };
  }

  const nextChangeAtMs = new Date(usernameChangedAt).getTime() + USERNAME_CHANGE_COOLDOWN_MS;
  if (Date.now() >= nextChangeAtMs) {
    return { canChange: true, nextChangeAt: null };
  }

  return {
    canChange: false,
    nextChangeAt: new Date(nextChangeAtMs).toISOString(),
  };
}

export function formatUsernameChangeAvailableDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function usernameChangeBlockedMessage(nextChangeAt: string) {
  return `You can change your username again on ${formatUsernameChangeAvailableDate(nextChangeAt)}. Usernames can only be changed once every ${USERNAME_CHANGE_COOLDOWN_DAYS} days.`;
}

/** Returns an error message when a username change is blocked, otherwise null. */
export function getUsernameChangeBlockReason(input: {
  currentUsername: string | null | undefined;
  nextUsername: string;
  usernameChangedAt: string | null | undefined;
}): string | null {
  const current = input.currentUsername?.trim().toLowerCase() ?? "";
  const next = input.nextUsername.trim().toLowerCase();

  if (!current || current === next) {
    return null;
  }

  const cooldown = getUsernameChangeCooldown(input.usernameChangedAt);
  if (!cooldown.canChange && cooldown.nextChangeAt) {
    return usernameChangeBlockedMessage(cooldown.nextChangeAt);
  }

  return null;
}
