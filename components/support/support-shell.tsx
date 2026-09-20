import { StaffSupportAlertBanner } from "@/components/admin/staff-support-alert-banner";
import { FloatingSiteDock } from "@/components/support/floating-site-dock";
import { getAdminAccess } from "@/lib/auth/admin-access";
import { getAdminSupportUnreadTotal } from "@/lib/data/support";
import { createClient } from "@/lib/supabase/server";

export async function SupportShell() {
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    userId = !error && data?.claims?.sub ? (data.claims.sub as string) : null;
  } catch (error) {
    const { logDatabaseError } = await import("@/lib/db/errors");
    logDatabaseError("SupportShell auth", error);
  }

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
