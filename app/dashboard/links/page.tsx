import { redirect } from "next/navigation";
import { LinksEditor } from "@/components/profile/links-editor";
import { getLinksByProfileId } from "@/lib/data/links";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";
import { cardClassName } from "@/components/dashboard/form-fields";

export default async function DashboardLinksPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const [links, settings] = await Promise.all([
    getLinksByProfileId(userId),
    getSettingsByProfileId(userId),
  ]);

  if (settings.show_total_followers) {
    try {
      const { syncLinkPlatformStats } = await import("@/lib/platform-followers/sync");
      await syncLinkPlatformStats(userId);
    } catch {
      // Follower sync is best-effort and should never block the links editor.
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Links</h1>
        <p className="mt-2 text-zinc-400">
          Unlimited custom links with icons, colors, animations, and drag-and-drop reorder.
        </p>
      </div>
      <div className={cardClassName} data-tour="tour-links">
        <LinksEditor links={links} settings={settings} />
      </div>
    </>
  );
}
