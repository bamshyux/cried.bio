import { createAdminClient } from "@/lib/supabase/admin";

export async function fulfillPremiumGiftPurchase(input: {
  buyerId: string;
  referenceId: string;
  stripeSessionId: string;
  stripePaymentIntent: string | null;
  stripeCustomerId: string;
  priceId: string;
  productSlug: string;
  productName: string;
  amountPaid: number;
  currency: string;
  fulfillmentKey: string;
}): Promise<string | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data: existing } = await supabase
    .from("purchases")
    .select("id")
    .eq("stripe_checkout_session_id", input.stripeSessionId)
    .maybeSingle();

  if (existing?.id) return String(existing.id);

  const { data, error } = await supabase
    .from("purchases")
    .insert({
      user_id: input.buyerId,
      reference_id: input.referenceId,
      stripe_checkout_session_id: input.stripeSessionId,
      stripe_payment_intent: input.stripePaymentIntent,
      stripe_customer_id: input.stripeCustomerId,
      price_id: input.priceId,
      product_slug: input.productSlug,
      product_name: input.productName,
      amount_paid: input.amountPaid,
      currency: input.currency,
      status: "completed",
      fulfillment_key: input.fulfillmentKey,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: dup } = await supabase
        .from("purchases")
        .select("id")
        .eq("stripe_checkout_session_id", input.stripeSessionId)
        .maybeSingle();
      return dup?.id ? String(dup.id) : null;
    }
    throw new Error(error.message);
  }

  return data?.id ? String(data.id) : null;
}
