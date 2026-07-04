import { redirect } from "next/navigation";

export default async function LegacyCommunityPresetPreviewPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;
  redirect(`/preview/preset/${listingId}`);
}
