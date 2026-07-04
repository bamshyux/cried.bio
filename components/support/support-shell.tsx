import { StaffSupportAlertBanner } from "@/components/admin/staff-support-alert-banner";
import { FloatingSiteDock } from "@/components/support/floating-site-dock";
import { getAdminAccess } from "@/lib/auth/admin-access";
import { getAdminSupportUnreadTotal } from "@/lib/data/support";
import { createClient } from "@/lib/supabase/server";

export async function SupportShell() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = !error && data?.claims?.sub ? (data.claims.sub as string) : null;

  const adminAccess = userId ? await getAdminAccess() : null;
  let initialSupportUnread = 0;

  if (adminAccess) {
    try {
      initialSupportUnread = await getAdminSupportUnreadTotal(adminAccess.userId);
    } catch {
      initialSupportUnread = 0;
    }
  }

  return (
    <>
      <StaffSupportAlertBanner
        isStaff={Boolean(adminAccess)}
        staffUserId={adminAccess?.userId ?? null}
        initialUnread={initialSupportUnread}
      />
      <FloatingSiteDock userId={userId} />
    </>
  );
}
