import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";

function formatCardBrand(brand: string | undefined | null): string {
  if (!brand) return "Card";
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

export async function resolveCheckoutPaymentDetails(session: Stripe.Checkout.Session): Promise<{
  stripeCustomerId: string | null;
  stripePaymentIntentId: string | null;
  paymentMethod: string | null;
  receiptNumber: string | null;
  invoiceNumber: string | null;
}> {
  const stripe = getStripe();
  const stripeCustomerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

  let stripePaymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  let paymentMethod: string | null = null;
  let receiptNumber: string | null = null;
  let invoiceNumber: string | null = null;

  if (stripePaymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId, {
        expand: ["payment_method", "latest_charge"],
      });

      stripePaymentIntentId = paymentIntent.id;

      const pm = paymentIntent.payment_method;
      if (pm && typeof pm === "object") {
        if (pm.type === "card" && pm.card) {
          paymentMethod = `${formatCardBrand(pm.card.brand)} •••• ${pm.card.last4}`;
        } else {
          paymentMethod = pm.type.replaceAll("_", " ");
        }
      }

      const charge = paymentIntent.latest_charge;
      if (charge && typeof charge === "object") {
        receiptNumber = charge.receipt_number ?? null;
      }
    } catch {
      // Non-fatal — checkout can still be fulfilled without payment method details.
    }
  }

  if (session.invoice && typeof session.invoice === "object") {
    invoiceNumber = session.invoice.number ?? null;
  } else if (typeof session.invoice === "string") {
    try {
      const invoice = await stripe.invoices.retrieve(session.invoice);
      invoiceNumber = invoice.number ?? null;
    } catch {
      // ignore
    }
  }

  if (!paymentMethod && session.payment_method_types?.length) {
    paymentMethod = session.payment_method_types.join(", ").replaceAll("_", " ");
  }

  return {
    stripeCustomerId,
    stripePaymentIntentId,
    paymentMethod,
    receiptNumber,
    invoiceNumber,
  };
}
