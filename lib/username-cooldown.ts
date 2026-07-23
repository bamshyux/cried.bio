export const USERNAME_CHANGE_COOLDOWN_DAYS_FREE = 7;
export const USERNAME_CHANGE_COOLDOWN_HOURS_PREMIUM = 24;

export const USERNAME_CHANGE_COOLDOWN_MS_FREE =
  USERNAME_CHANGE_COOLDOWN_DAYS_FREE * 24 * 60 * 60 * 1000;

export const USERNAME_CHANGE_COOLDOWN_MS_PREMIUM =
  USERNAME_CHANGE_COOLDOWN_HOURS_PREMIUM * 60 * 60 * 1000;

/** @deprecated Use entitlement-based cooldown */
export const USERNAME_CHANGE_COOLDOWN_DAYS = USERNAME_CHANGE_COOLDOWN_DAYS_FREE;

/** @deprecated Use entitlement-based cooldown */
export const USERNAME_CHANGE_COOLDOWN_MS = USERNAME_CHANGE_COOLDOWN_MS_FREE;

export type UsernameChangeCooldownInfo = {
  canChange: boolean;
  nextChangeAt: string | null;
  cooldownHours: number;
};

export function getUsernameCooldownMs(cooldownHours: number): number {
  return cooldownHours * 60 * 60 * 1000;
}

export function getUsernameChangeCooldown(
  usernameChangedAt: string | null | undefined,
  cooldownHours = USERNAME_CHANGE_COOLDOWN_DAYS_FREE * 24,
): UsernameChangeCooldownInfo {
  if (!usernameChangedAt) {
    return { canChange: true, nextChangeAt: null, cooldownHours };
  }

  const cooldownMs = getUsernameCooldownMs(cooldownHours);
  const nextChangeAtMs = new Date(usernameChangedAt).getTime() + cooldownMs;
  if (Date.now() >= nextChangeAtMs) {
    return { canChange: true, nextChangeAt: null, cooldownHours };
  }

  return {
    canChange: false,
    nextChangeAt: new Date(nextChangeAtMs).toISOString(),
    cooldownHours,
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

export function usernameChangeBlockedMessage(nextChangeAt: string, cooldownHours: number) {
  const unit =
    cooldownHours >= 24
      ? `${Math.round(cooldownHours / 24)} day${cooldownHours >= 48 ? "s" : ""}`
      : `${cooldownHours} hour${cooldownHours !== 1 ? "s" : ""}`;
  return `You can change your username again on ${formatUsernameChangeAvailableDate(nextChangeAt)}. Usernames can only be changed once every ${unit}.`;
}

/** Returns an error message when a username change is blocked, otherwise null. */
export function getUsernameChangeBlockReason(input: {
  currentUsername: string | null | undefined;
  nextUsername: string;
  usernameChangedAt: string | null | undefined;
  cooldownHours?: number;
}): string | null {
  const current = input.currentUsername?.trim().toLowerCase() ?? "";
  const next = input.nextUsername.trim().toLowerCase();

  if (!current || current === next) {
    return null;
  }

  const cooldownHours =
    input.cooldownHours ?? USERNAME_CHANGE_COOLDOWN_DAYS_FREE * 24;
  const cooldown = getUsernameChangeCooldown(input.usernameChangedAt, cooldownHours);
  if (!cooldown.canChange && cooldown.nextChangeAt) {
    return usernameChangeBlockedMessage(cooldown.nextChangeAt, cooldownHours);
  }

  return null;
}
