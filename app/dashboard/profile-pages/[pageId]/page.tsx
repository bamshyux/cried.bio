import { redirect } from "next/navigation";

export default async function ProfilePageEditorIndex({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  redirect(`/dashboard/profile-pages/${pageId}/identity`);
}
