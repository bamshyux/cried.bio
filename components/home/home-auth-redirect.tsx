"use client";

import { Suspense, useEffect } from "react";

/** Forwards Supabase auth tokens that land on the home page to the correct handler. */
function HomeAuthRedirectInner() {
  useEffect(() => {
    const { hash, search } = window.location;
    const params = new URLSearchParams(search);

    if (params.has("code") || params.has("token_hash")) {
      const target = params.has("code") ? "/auth/callback" : "/auth/confirm";
      window.location.replace(`${target}${search}${hash}`);
      return;
    }

    if (hash && (hash.includes("access_token") || hash.includes("type=recovery"))) {
      window.location.replace(`/auth/update-password${hash}`);
    }
  }, []);

  return null;
}

export function HomeAuthRedirect() {
  return (
    <Suspense fallback={null}>
      <HomeAuthRedirectInner />
    </Suspense>
  );
}
