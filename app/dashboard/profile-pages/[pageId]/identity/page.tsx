import { ProfilePageIdentityEditor } from "@/components/dashboard/profile-page-editor/identity-editor";
import { loadProfilePageEditor } from "@/lib/dashboard/load-profile-page-editor";

export default async function ProfilePageIdentityPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const { page, profile } = await loadProfilePageEditor(pageId);

  return <ProfilePageIdentityEditor page={page} username={profile?.username ?? null} />;
}
