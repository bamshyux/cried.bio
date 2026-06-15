import { redirect } from "next/navigation";
import { GuestbookEditor } from "@/components/dashboard/guestbook-editor";
import { getGuestbookEntries } from "@/lib/data/guestbook";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";
import { cardClassName } from "@/components/dashboard/form-fields";

export default async function DashboardGuestbookPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const [settings, entries] = await Promise.all([
    getSettingsByProfileId(userId),
    getGuestbookEntries(userId, { ownerView: true }),
  ]);

  return (
    <div className={cardClassName}>
      <GuestbookEditor settings={settings} entries={entries} />
    </div>
  );
}
