import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { getProfileByUserId } from "@/lib/data/profiles";
import { createClient } from "@/lib/supabase/server";
import { cardClassName } from "@/components/dashboard/form-fields";

export default async function DashboardProfilePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const profile = await getProfileByUserId(data.claims.sub as string);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-2 text-zinc-400">Username, bio, avatar, and banner.</p>
      </div>
      <div className={cardClassName}>
        <ProfileEditor profile={profile} />
      </div>
    </div>
  );
}
