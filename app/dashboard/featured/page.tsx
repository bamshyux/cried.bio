import { redirect } from "next/navigation";
import { FeaturedEditor } from "@/components/dashboard/featured-editor";
import { getFeaturedBlocksByProfileId } from "@/lib/data/featured";
import { createClient } from "@/lib/supabase/server";
import { cardClassName } from "@/components/dashboard/form-fields";

export default async function DashboardFeaturedPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const blocks = await getFeaturedBlocksByProfileId(data.claims.sub as string);

  return (
    <div className={cardClassName}>
      <FeaturedEditor blocks={blocks} />
    </div>
  );
}
