"use client";

import { Suspense, useEffect, useState } from "react";
import { HumanVerificationGate } from "@/components/security/human-verification-gate";
import { isHumanVerificationRequired } from "@/lib/security/human-verification-messages";
import type { HumanVerificationRedirectFrom } from "@/lib/security/guard-action";

function AuthHumanVerificationInner({
  error,
  from,
}: {
  error?: string;
  from: HumanVerificationRedirectFrom;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (error && isHumanVerificationRequired(error)) {
      setOpen(true);
    }
  }, [error]);

  return (
    <HumanVerificationGate
      variant="auth"
      from={from}
      open={open}
      onVerified={() => setOpen(false)}
    />
  );
}

export function AuthHumanVerification({
  error,
  from,
}: {
  error?: string;
  from: HumanVerificationRedirectFrom;
}) {
  return (
    <Suspense fallback={null}>
      <AuthHumanVerificationInner error={error} from={from} />
    </Suspense>
  );
}

export function shouldHideAuthError(error?: string): boolean {
  return Boolean(error && isHumanVerificationRequired(error));
}
