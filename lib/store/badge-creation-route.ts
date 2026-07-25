export const BADGE_CREATION_PATH_PREFIX = "/dashboard/store/create-badge";

export function isBadgeCreationPath(pathname: string): boolean {
  return pathname.startsWith(BADGE_CREATION_PATH_PREFIX);
}
