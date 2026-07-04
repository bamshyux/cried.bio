import { FloatingSiteDock } from "@/components/support/floating-site-dock";
import { createClient } from "@/lib/supabase/server";

export async function SupportShell() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = !error && data?.claims?.sub ? (data.claims.sub as string) : null;

  return <FloatingSiteDock userId={userId} />;
}
