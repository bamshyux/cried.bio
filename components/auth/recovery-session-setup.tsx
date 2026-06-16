"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Picks up #access_token hash fragments from Supabase recovery links. */
export function RecoverySessionSetup() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        router.refresh();
      }
    });

    void supabase.auth.getSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
