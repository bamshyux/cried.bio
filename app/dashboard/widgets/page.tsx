import { redirect } from "next/navigation";
import { Suspense } from "react";
import { sanitizeDiscordConnectionAction } from "@/app/actions/discord";
import { WidgetsEditor } from "@/components/dashboard/widgets-editor";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { isDiscordOAuthConfigured } from "@/lib/discord/config";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardWidgetsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  await sanitizeDiscordConnectionAction();
  const settings = await getSettingsByProfileId(userId);

  return (
    <Suspense fallback={null}>
      <WidgetsEditor settings={settings} oauthConfigured={isDiscordOAuthConfigured()} />
    </Suspense>
  );
}
