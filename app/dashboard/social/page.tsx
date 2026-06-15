import { redirect } from "next/navigation";
import { SocialEditor } from "@/components/dashboard/social-editor";
import { getFollowCounts, getPendingFriendRequests } from "@/lib/data/social";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";
import { cardClassName } from "@/components/dashboard/form-fields";

export default async function DashboardSocialPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const [settings, counts, pendingRequests] = await Promise.all([
    getSettingsByProfileId(userId),
    getFollowCounts(userId),
    getPendingFriendRequests(userId),
  ]);

  return (
    <div className={cardClassName}>
      <SocialEditor
        settings={settings}
        pendingRequests={pendingRequests as Parameters<typeof SocialEditor>[0]["pendingRequests"]}
        followerCount={counts.followers}
        followingCount={counts.following}
      />
    </div>
  );
}
