import { redirect } from "next/navigation";
import { EmbedsEditor } from "@/components/dashboard/embeds-editor";
import { getEmbedsByProfileId } from "@/lib/data/embeds";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardEmbedsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const [embeds, settings] = await Promise.all([
    getEmbedsByProfileId(userId),
    getSettingsByProfileId(userId),
  ]);

  return <EmbedsEditor embeds={embeds} settings={settings} />;
}
