export const SITE_HOST = "bioforge.blog";

export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  return process.env.NODE_ENV === "production" ? `https://${SITE_HOST}` : "http://localhost:3000";
}
