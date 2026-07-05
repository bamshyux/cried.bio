import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadDefaultSiteIcon(): Promise<Response> {
  const iconPath = path.join(process.cwd(), "public", "icon.svg");
  const body = await readFile(iconPath);
  return new Response(body, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
