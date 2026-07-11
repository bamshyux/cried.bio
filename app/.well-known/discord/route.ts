/** Discord domain verification for cried.bio (Developer Portal → Domain Verification). */
const DISCORD_DOMAIN_VERIFICATION = "dh=780c83b89de58d17adc2026237968dff2c370b62";

export async function GET() {
  return new Response(DISCORD_DOMAIN_VERIFICATION, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
