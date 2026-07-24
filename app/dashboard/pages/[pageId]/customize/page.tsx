import { ContentPageStyleEditor } from "@/components/dashboard/content-page-editor/style-editor";
import { loadProfilePageEditor } from "@/lib/dashboard/load-profile-page-editor";
import { getUserEntitlements } from "@/lib/premium/entitlements";

export default async function ContentPageStylePage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const { userId, page, settings } = await loadProfilePageEditor(pageId);
  const entitlements = await getUserEntitlements(userId);

  return (
    <ContentPageStyleEditor
      page={page}
      settings={settings}
      pageId={pageId}
      canUsePremiumFonts={entitlements.can_use_premium_fonts}
      canUsePremiumBorderEffects={entitlements.animated_effects}
    />
  );
}
