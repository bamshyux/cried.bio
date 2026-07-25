"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPostCheckoutFulfillmentPath, getPurchaseSuccessPath } from "@/lib/store/post-checkout";
import { readJsonResponse } from "@/lib/stripe/client-fetch";

export function PurchaseCompleteRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [message, setMessage] = useState("Confirming your purchase…");

  useEffect(() => {
    if (!sessionId) {
      setMessage("Missing checkout session.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/stripe/sync-store", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await readJsonResponse<{
          error?: string;
          referenceId?: string | null;
          productSlug?: string | null;
          fulfillmentPath?: string;
        }>(res);

        if (!res.ok) throw new Error(data.error ?? "Could not confirm purchase.");

        const referenceId = data.referenceId;
        const fulfillmentPath =
          data.fulfillmentPath ??
          getPostCheckoutFulfillmentPath(data.productSlug ?? "");

        if (referenceId) {
          const successPath = getPurchaseSuccessPath(referenceId);
          window.open(successPath, "_blank", "noopener,noreferrer");
        }

        if (!cancelled) {
          setMessage("Purchase confirmed. Opening your receipt…");
          router.replace(fulfillmentPath);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "Could not confirm purchase.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center text-center">
      <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" />
      <p className="text-sm text-neutral-400">{message}</p>
    </div>
  );
}
