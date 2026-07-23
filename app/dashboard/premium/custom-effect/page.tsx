import Link from "next/link";
import { redirect } from "next/navigation";
import { PremiumLocked } from "@/components/premium/premium-locked";
import { cardClassName, PageHeader } from "@/components/dashboard/form-fields";
import { DISCORD_COMMUNITY_INVITE_URL, SITE_HOST } from "@/lib/site";
import { getUserEntitlements } from "@/lib/premium/entitlements";
import { createClient } from "@/lib/supabase/server";

export default async function CustomEffectRequestPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const entitlements = await getUserEntitlements(userId);
  const allowed = entitlements.can_use_custom_effect_request;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Custom Profile Effect"
        description="Request a fully custom profile effect designed exclusively for your page."
      />

      <PremiumLocked allowed={allowed}>
        <div className={`${cardClassName} border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.06] to-transparent`}>
          <p className="text-xs font-medium uppercase tracking-wider text-amber-400/90">Premium Lite exclusive</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Your custom effect</h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-300">
            Premium Lite members can request one fully custom profile effect designed exclusively
            for their own profile. This does not generate effects automatically — our team designs
            and implements each request by hand.
          </p>

          <div className="mt-6 rounded-xl border border-white/[0.08] bg-black/20 p-5">
            <p className="text-sm font-medium text-white">To request your custom effect, contact:</p>
            <ul className="mt-4 space-y-3 text-sm text-neutral-300">
              <li>
                <span className="text-neutral-500">Support ticket —</span>{" "}
                <Link href="/dashboard/settings" className="text-white underline underline-offset-2">
                  open Support from your dashboard
                </Link>{" "}
                (topic: Billing &amp; premium)
              </li>
              <li>
                <span className="text-neutral-500">Discord —</span>{" "}
                <a
                  href={DISCORD_COMMUNITY_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline underline-offset-2"
                >
                  cried.bio Discord
                </a>
              </li>
              <li>
                <span className="text-neutral-500">Owner DMs —</span>{" "}
                <span className="font-medium text-white">bamshy</span>
              </li>
            </ul>
          </div>

          <p className="mt-5 text-xs text-neutral-600">
            Include your {SITE_HOST} username and a description of the effect you want. One custom
            effect per Premium Lite account.
          </p>
        </div>
      </PremiumLocked>
    </div>
  );
}
