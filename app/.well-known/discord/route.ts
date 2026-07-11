/** Discord domain verification for cried.bio (Developer Portal → Domain Verification). */
const DISCORD_DOMAIN_VERIFICATION = "dh=598d467d454c72e52ccd4daf0c37d5cb12d2b3fe";

export async function GET() {
  return new Response(DISCORD_DOMAIN_VERIFICATION, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
