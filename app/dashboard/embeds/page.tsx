import { redirect } from "next/navigation";
import { EmbedsEditor } from "@/components/dashboard/embeds-editor";
import { getEmbedsByProfileId } from "@/lib/data/embeds";
import { createClient } from "@/lib/supabase/server";
import { cardClassName } from "@/components/dashboard/form-fields";

export default async function DashboardEmbedsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const embeds = await getEmbedsByProfileId(data.claims.sub as string);

  return (
    <div className={cardClassName}>
      <EmbedsEditor embeds={embeds} />
    </div>
  );
}
