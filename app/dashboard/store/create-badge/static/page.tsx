import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { BadgeCreationClient } from "@/components/store/badge-creation-client";
import { requireBadgeCreationAccess } from "@/lib/store/badge-credits";
import { createClient } from "@/lib/supabase/server";

async function StaticBadgeCreationPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const credit = await requireBadgeCreationAccess(userId, "static");
  if (!credit) notFound();

  return (
    <BadgeCreationClient
      route="static"
      credit={credit}
      title="Create your custom badge"
      description="Upload a static image, name your badge, and add a short bio. This page is only available after purchasing 1 Custom Badge."
      accept="image/jpeg,image/png,image/webp,image/svg+xml"
      uploadHint="Static images only — JPEG, PNG, WebP, or SVG. GIFs and animated files are not allowed."
    />
  );
}

export default function StoreStaticBadgePage() {
  return (
    <Suspense fallback={<div className="text-neutral-500">Loading…</div>}>
      <StaticBadgeCreationPage />
    </Suspense>
  );
}
