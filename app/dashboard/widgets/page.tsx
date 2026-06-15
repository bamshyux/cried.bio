import { Suspense } from "react";
import { redirect } from "next/navigation";
import { WidgetsEditor } from "@/components/dashboard/widgets-editor";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { setDiscordStatusWidgetEnabled } from "@/lib/data/discord-widget";
import { isDiscordOAuthConfigured } from "@/lib/discord/config";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardWidgetsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const settings = await getSettingsByProfileId(userId);

  if (settings.discord_user_id.trim() && settings.show_discord_status) {
    await setDiscordStatusWidgetEnabled(userId, true);
  }

  return (
    <Suspense fallback={null}>
      <WidgetsEditor settings={settings} oauthConfigured={isDiscordOAuthConfigured()} />
    </Suspense>
  );
}
