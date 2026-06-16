import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { getProfileByUserId } from "@/lib/data/profiles";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";
import { cardClassName } from "@/components/dashboard/form-fields";

export default async function DashboardProfilePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const [profile, settings] = await Promise.all([
    getProfileByUserId(userId),
    getSettingsByProfileId(userId),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-2 text-zinc-400">Username, bio, avatar, banner, and bio styling.</p>
      </div>
      <div className="space-y-6">
        <div className={cardClassName}>
          {settings ? (
            <ProfileEditor profile={profile} settings={settings} />
          ) : (
            <ProfileEditor profile={profile} />
          )}
        </div>
      </div>
    </div>
  );
}
