import { redirect } from "next/navigation";
import { BackgroundPageShell } from "@/components/dashboard/background-editor";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";

export default async function BackgroundPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const settings = await getSettingsByProfileId(data.claims.sub as string);
  return <BackgroundPageShell settings={settings} />;
}
