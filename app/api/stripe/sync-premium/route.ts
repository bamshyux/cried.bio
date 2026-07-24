import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserEntitlements } from "@/lib/premium/entitlements";
import { getStripeCustomerId } from "@/lib/data/premium-subscription";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import {
  fulfillPremiumCheckoutSession,
  syncPremiumFromStripeCustomer,
} from "@/lib/stripe/premium-checkout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.getClaims();
    if (authError || !data?.claims?.sub) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const userId = data.claims.sub as string;
    let body: { sessionId?: string } = {};

    try {
      body = (await request.json()) as typeof body;
    } catch {
      body = {};
    }

    const stripe = getStripe();
    const sessionId = body.sessionId?.trim();

    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items.data.price", "subscription"],
      });

      const isBuyer =
        session.client_reference_id === userId || session.metadata?.cried_user_id === userId;

      if (!isBuyer) {
        return NextResponse.json({ error: "Checkout session does not belong to this account." }, { status: 403 });
      }

      const result = await fulfillPremiumCheckoutSession(stripe, session);
      if (!result.ok && result.reason !== "not_premium_checkout") {
        return NextResponse.json({ error: `Could not sync premium: ${result.reason}` }, { status: 400 });
      }
    } else {
      const customerId = await getStripeCustomerId(userId);
      if (!customerId) {
        return NextResponse.json({ error: "No Stripe customer found for this account." }, { status: 404 });
      }

      const synced = await syncPremiumFromStripeCustomer(stripe, userId, customerId);
      if (!synced) {
        return NextResponse.json({ error: "No paid premium checkout or subscription found." }, { status: 404 });
      }
    }

    const entitlements = await getUserEntitlements(userId);
    return NextResponse.json({
      ok: true,
      entitlements: {
        plan_tier: entitlements.plan_tier,
        is_active: entitlements.is_active,
        billing_type: entitlements.billing_type,
        lifetime: entitlements.lifetime,
      },
    });
  } catch (error) {
    console.error("[stripe sync-premium]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Premium sync failed." },
      { status: 500 },
    );
  }
}
