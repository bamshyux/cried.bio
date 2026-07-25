import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BadgeCreationClient } from "@/components/store/badge-creation-client";
import { requireBadgeCreationAccess } from "@/lib/store/badge-credits";
import { createClient } from "@/lib/supabase/server";

async function AnimatedBadgeCreationPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const credit = await requireBadgeCreationAccess(userId, "animated");
  if (!credit) redirect("/dashboard/badges");

  return (
    <BadgeCreationClient
      route="animated"
      credit={credit}
      title="Create your animated badge"
      description="Upload an animated image for a badge with motion on your profile. This page is only available after purchasing an Animated Badge."
      accept="image/gif,image/webp,image/png,image/jpeg"
      uploadHint="GIF, animated WebP, or other animated image formats up to 2 MB."
    />
  );
}

export default function StoreAnimatedBadgePage() {
  return (
    <Suspense fallback={<div className="text-neutral-500">Loading…</div>}>
      <AnimatedBadgeCreationPage />
    </Suspense>
  );
}
