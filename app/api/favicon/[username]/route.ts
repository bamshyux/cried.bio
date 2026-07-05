import { getProfileFaviconContent } from "@/lib/profile/favicon-server";
import { isValidUsername, normalizeUsername } from "@/lib/profile";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);

  if (!isValidUsername(username)) {
    return new Response("Not found", { status: 404 });
  }

  const favicon = await getProfileFaviconContent(username);
  if (!favicon) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(favicon.body, {
    headers: {
      "Content-Type": favicon.contentType,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
