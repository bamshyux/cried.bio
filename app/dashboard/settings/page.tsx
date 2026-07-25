import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AccountSettingsShell } from "@/components/dashboard/settings/account-settings-shell";
import { getAccountSettingsData, touchUserSession } from "@/lib/data/account-settings";
import { listPurchasesForUser } from "@/lib/data/purchases";
import { createClient } from "@/lib/supabase/server";

async function SettingsContent({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const email = (data.claims.email as string | undefined) ?? "";
  const sessionId = data.claims.session_id as string | undefined;
  const params = await searchParams;

  await touchUserSession(userId, sessionId);

  const [settingsData, purchases] = await Promise.all([
    getAccountSettingsData(userId, email),
    listPurchasesForUser(userId),
  ]);

  return (
    <AccountSettingsShell
      data={settingsData}
      purchases={purchases}
      initialTab={params.tab ?? null}
    />
  );
}

export default function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  return (
    <Suspense fallback={<div className="text-neutral-500">Loading settings…</div>}>
      <SettingsContent searchParams={searchParams} />
    </Suspense>
  );
}
