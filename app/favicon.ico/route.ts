import { loadDefaultSiteIcon } from "@/lib/profile/default-site-icon";

export async function GET() {
  return loadDefaultSiteIcon();
}
