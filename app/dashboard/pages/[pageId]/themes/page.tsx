import { redirect } from "next/navigation";

export default async function LegacyContentPageThemesPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  redirect(`/dashboard/pages/${pageId}/customize`);
}
