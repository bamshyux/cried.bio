import { CustomizePageShell } from "@/components/dashboard/customize-editor";
import { loadProfilePageEditor } from "@/lib/dashboard/load-profile-page-editor";
import { getUserEntitlements } from "@/lib/premium/entitlements";

export default async function ContentPageCustomizePage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const { userId, settings } = await loadProfilePageEditor(pageId);
  const entitlements = await getUserEntitlements(userId);

  return (
    <CustomizePageShell
      settings={settings}
      canUsePremiumFonts={entitlements.can_use_premium_fonts}
      pageId={pageId}
    />
  );
}
