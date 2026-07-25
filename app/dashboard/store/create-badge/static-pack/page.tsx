import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BadgeCreationClient } from "@/components/store/badge-creation-client";
import { requireBadgeCreationAccess } from "@/lib/store/badge-credits";
import { createClient } from "@/lib/supabase/server";

async function StaticPackBadgeCreationPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const credit = await requireBadgeCreationAccess(userId, "static-pack");
  if (!credit) redirect("/dashboard/badges");

  return (
    <BadgeCreationClient
      route="static-pack"
      credit={credit}
      title="Create your 3 custom badges"
      description="Design three separate static badges for your profile. Complete one at a time — this page is only available after purchasing 3 Custom Badges."
      accept="image/jpeg,image/png,image/webp,image/svg+xml"
      uploadHint="Static images only — JPEG, PNG, WebP, or SVG. GIFs and animated files are not allowed."
    />
  );
}

export default function StoreStaticPackBadgePage() {
  return (
    <Suspense fallback={<div className="text-neutral-500">Loading…</div>}>
      <StaticPackBadgeCreationPage />
    </Suspense>
  );
}
